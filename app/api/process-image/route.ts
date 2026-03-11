import { NextResponse } from "next/server";
import sharp from "sharp";
import { encode } from "blurhash";
import { getAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "product-images";

// Image variant configurations
const VARIANTS = {
  thumbnail: { width: 150, height: 150, folder: "thumbnail" },
  medium: { width: 600, height: 600, folder: "medium" },
  large: { width: 1200, height: 1200, folder: "large" },
} as const;

type VariantKey = keyof typeof VARIANTS;

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

// Folder prefix mapping for entity types
const FOLDER_PREFIX: Record<string, string> = {
  product: "products",
  category: "categories",
  review: "reviews",
  custom_order: "custom-orders",
};

export async function POST(request: Request) {
  const supabase = getAdminClient();
  let currentImageId: string | null = null;

  try {
    const { imageId, storagePath, entityType, entityId } = await request.json();
    currentImageId = imageId;

    if (!imageId || !storagePath || !entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing required fields: imageId, storagePath, entityType, entityId" },
        { status: 400 }
      );
    }

    const folderPrefix = FOLDER_PREFIX[entityType];
    if (!folderPrefix) {
      return NextResponse.json(
        { error: `Invalid entity type: ${entityType}` },
        { status: 400 }
      );
    }

    console.log(`Processing ${entityType} image: ${imageId} at ${storagePath}`);

    // Update status to processing (centralized images table)
    await supabase
      .from("images")
      .update({ processing_status: "processing" })
      .eq("id", imageId);

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

    for (const [key, config] of Object.entries(VARIANTS)) {
      const variantKey = key as VariantKey;

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
    const { error: updateError } = await supabase
      .from("images")
      .update({
        ...variantPaths,
        blurhash,
        processing_status: "completed",
        processing_error: null,
        original_width: originalWidth,
        original_height: originalHeight,
        file_size_bytes: fileSize,
      })
      .eq("id", imageId);

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

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
    if (currentImageId) {
      await supabase
        .from("images")
        .update({
          processing_status: "failed",
          processing_error: errorMessage,
        })
        .eq("id", currentImageId);
    }

    return NextResponse.json(
      { error: errorMessage || "Image processing failed" },
      { status: 500 }
    );
  }
}
