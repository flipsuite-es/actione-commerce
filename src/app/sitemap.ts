import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/data";

const base = process.env.NEXT_PUBLIC_SITE_URL || "https://oucystudios.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updated_at: string }[] = [];
  try {
    products = (await getActiveProducts()).map((p) => ({
      slug: p.slug,
      updated_at: p.updated_at,
    }));
  } catch {
    products = [];
  }

  const staticRoutes = ["", "/tienda", "/favoritos"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const productRoutes = products.map((p) => ({
    url: `${base}/producto/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
