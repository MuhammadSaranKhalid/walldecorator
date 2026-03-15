import { NextResponse } from "next/server";
import sharp from "sharp";
import { encode } from "blurhash";
import { getAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const BUCKET_NAME = "product-images";

const webhookPayloadSchema = z.object({
  imageId: z.uuid("Invalid image ID format"),
  storagePath: z.string().min(1, "Storage path is required"),
  entityType: z.enum(["product", "category", "review", "custom_order"]),
  entityId: z.uuid("Invalid entity ID format"),
});

/**
 * Generate BlurHash from image buffer
 * Uses a small version of the image for performance
 */
async function generateBlurhash(imageBuffer: Buffer): Promise<string> {
  // Resize to small dimensions for blurhash (4x3 components is standard)
  const { data, info } = await sharp(imageBuffer)
    .resize(32, 32, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Encode blurhash with 4x3 components
  const blurhash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,
    3
  );

  return blurhash;
}

export async function POST(request: Request) {
  const supabase = getAdminClient();

  let payload: z.infer<typeof webhookPayloadSchema>;

  // Cleaned up payload extraction and validation
  try {
    const json = await request.json();
    const parsed = webhookPayloadSchema.safeParse(json); // Changed to sync safeParse

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }
    payload = parsed.data;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { imageId, storagePath, entityType, entityId } = payload;

  try {

    console.log(`Processing ${entityType} image: ${imageId} at ${storagePath}`);

    // Update status to processing (centralized images table)
    await prisma.images.update({
      where: { id: imageId },
      data: { processing_status: "processing" },
    });

    // Step 0: Fetch specific configuration for this entity type
    const configData = await prisma.image_processing_configs.findUnique({
      where: { entity_type: entityType },
      select: { variants: true, folder_prefix: true },
    });

    if (!configData?.variants || !configData?.folder_prefix) {
      throw new Error(`Failed to fetch image processing config for ${entityType}: No config found`);
    }

    const variantsConfig = configData.variants as Record<string, { width: number, height: number, folder: string }>;
    const folderPrefix = configData.folder_prefix as string;

    // Step 1: Download original image from Supabase Storage
    const { data: originalFile, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (downloadError || !originalFile) {
      throw new Error(
        `Failed to download original image: ${downloadError?.message}`
      );
    }

    // Convert blob to buffer
    const originalBuffer = Buffer.from(await originalFile.arrayBuffer());

    // Get original image metadata
    const metadata = await sharp(originalBuffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    const fileSize = originalBuffer.length;

    // Step 2: Generate BlurHash for placeholder
    console.log("Generating BlurHash...");
    const blurhash = await generateBlurhash(originalBuffer);
    console.log(`✓ Generated BlurHash: ${blurhash}`);

    // Step 3: Generate image variants
    const variantPaths: Record<string, string> = {};

    for (const [variantKey, config] of Object.entries(variantsConfig)) {
      // Process image with Sharp
      const processedImage = await sharp(originalBuffer)
        .resize(config.width, config.height, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 85 }) // Convert to WebP
        .toBuffer();

      // Generate storage path for variant
      // Example: products/thumbnail/product-uuid/image-name.webp
      const originalFileName = storagePath.split("/").pop() || "image.jpg";
      const fileNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
      const variantPath = `${folderPrefix}/${config.folder}/${entityId}/${fileNameWithoutExt}.webp`;

      // Upload variant to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(variantPath, processedImage, {
          contentType: "image/webp",
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        console.error(`Failed to upload ${variantKey} variant:`, uploadError);
        throw new Error(`Failed to upload ${variantKey}: ${uploadError.message}`);
      }

      variantPaths[`${variantKey}_path`] = variantPath;
      console.log(`✓ Created ${variantKey} variant at ${variantPath}`);
    }

    // Step 4: Update database with variant paths and blurhash (centralized images table)
    await prisma.images.update({
      where: { id: imageId },
      data: {
        ...variantPaths,
        blurhash,
        processing_status: "completed",
        processing_error: null,
        original_width: originalWidth,
        original_height: originalHeight,
        file_size_bytes: fileSize,
      },
    });

    console.log(`✓ ${entityType} image processing completed for ${imageId}`);

    return NextResponse.json({
      success: true,
      imageId,
      blurhash,
      variants: variantPaths,
      metadata: {
        originalWidth,
        originalHeight,
        fileSize,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Image processing error:", error);

    // Update database with error status (centralized images table)
    if (imageId) {
      try {
        await prisma.images.update({
          where: { id: imageId },
          data: {
            processing_status: "failed",
            processing_error: errorMessage,
          },
        });
      } catch (dbError) {
        console.error("Failed to update error status in database:", dbError);
      }
    }

    return NextResponse.json(
      { error: errorMessage || "Image processing failed" },
      { status: 500 }
    );
  }
}
