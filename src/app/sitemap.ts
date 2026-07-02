import type { MetadataRoute } from "next";
import { getActiveProducts, getPages } from "@/lib/data";

const base = process.env.NEXT_PUBLIC_SITE_URL || "https://oucystudios.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updated_at: string }[] = [];
  let pages: { slug: string; updated_at: string }[] = [];
  try {
    products = (await getActiveProducts()).map((p) => ({
      slug: p.slug,
      updated_at: p.updated_at,
    }));
  } catch {
    products = [];
  }
  try {
    pages = (await getPages()).map((p) => ({ slug: p.slug, updated_at: p.updated_at }));
  } catch {
    pages = [];
  }

  const staticRoutes = ["", "/tienda", "/soporte"].map((path) => ({
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

  const pageRoutes = pages.map((p) => ({
    url: `${base}/pagina/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  return [...staticRoutes, ...productRoutes, ...pageRoutes];
}
