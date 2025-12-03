import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export const runtime = "edge";
export const alt = "Product Image";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Product {
  name: string;
  description?: string;
  product_images?: Array<{
    original_url: string;
    large_url?: string;
    is_primary: boolean;
  }>;
}

async function getProduct(productId: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      name,
      description,
      product_images(original_url, large_url, is_primary)
    `
    )
    .eq("id", productId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Product;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 64,
            background: "linear-gradient(to bottom right, #1e293b, #334155)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          WallDecorator
        </div>
      ),
      {
        ...size,
      }
    );
  }

  const primaryImage = product.product_images?.find((img) => img.is_primary);
  const imageUrl = primaryImage?.large_url || primaryImage?.original_url;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(to bottom right, #f8fafc, #e2e8f0)",
        }}
      >
        {imageUrl && (
          <div
            style={{
              display: "flex",
              width: "50%",
              height: "100%",
            }}
          >
            <img
              src={imageUrl}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: imageUrl ? "60px" : "120px",
            width: imageUrl ? "50%" : "100%",
          }}
        >
          <h1
            style={{
              fontSize: imageUrl ? 56 : 72,
              fontWeight: "bold",
              color: "#0f172a",
              marginBottom: 20,
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </h1>
          {product.description && (
            <p
              style={{
                fontSize: 24,
                color: "#64748b",
                lineHeight: 1.4,
              }}
            >
              {product.description.slice(0, 120)}
              {product.description.length > 120 ? "..." : ""}
            </p>
          )}
          <div
            style={{
              marginTop: 40,
              fontSize: 20,
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            WALLDECORATOR
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
