// Sitemap from the catalogue (architecture/storefront.md). Base URL from NEXT_PUBLIC_SITE_URL.
import type { MetadataRoute } from "next";
import { getActiveProducts, getCategories, getMachines, type Category } from "@/lib/catalogue";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://partshubexpress.com").replace(/\/+$/, "");

function categoryUrls(cats: Category[], out: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  for (const c of cats) {
    out.push({ url: `${BASE}/parts/${c.slug}`, changeFrequency: "daily", priority: 0.7 });
    categoryUrls(c.children, out);
  }
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed: MetadataRoute.Sitemap = ["", "/parts", "/machines", "/search", "/quote", "/trade", "/terms", "/privacy"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.5,
  }));
  const categories = categoryUrls(getCategories(), []);
  const machines: MetadataRoute.Sitemap = getMachines().map((m) => ({ url: `${BASE}/machines/${m.slug}`, changeFrequency: "daily", priority: 0.7 }));
  const products: MetadataRoute.Sitemap = getActiveProducts().map((p) => ({ url: `${BASE}/part/${p.slug}`, changeFrequency: "daily", priority: 0.6 }));
  return [...fixed, ...categories, ...machines, ...products];
}
