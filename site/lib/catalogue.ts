// Single data access layer for the storefront. Pages never read JSON directly (architecture/storefront.md).
// Store: static JSON built by tools/build_catalogue.py (from the Odoo export, then nightly from the Odoo API).
// CATALOGUE_DIR is a test seam for tools/test_integrations.py; production reads data/ next to the app.
import fs from "node:fs";
import path from "node:path";

export type Product = {
  odoo_id: number | null;
  sku: string;
  slug: string;
  name: string;
  category_path: string[];
  category_slug: string;
  price_aud_inc_gst: number | null;
  price_source: string | null;
  stock_qty: number | null;
  stock_status: "in_stock" | "low_stock" | "made_to_order" | "unavailable" | "call_to_confirm";
  weight_kg: number | null;
  weight_source: string | null;
  description: string;
  image_path: string | null;
  image_thumb: string | null;
  image_source: "odoo_128" | "client_shopify" | "none";
  image_w: number | null;
  image_h: number | null;
  fits: string[];
  machine_tokens: string[];
  brand_tokens: string[];
  alt_part_numbers: string[];
  brand: string | null;
  active: boolean;
  tags?: string[];
  synced_at?: string;
};

export type Category = {
  name: string;
  slug: string;
  path: string[];
  product_count: number;
  image_count: number;
  children: Category[];
  hero_sku: string | null;
};

export type Machine = {
  model: string;
  slug: string;
  brand: string;
  type: string;
  product_count: number;
  image: string | null;
  image_credit: string | null;
};

type IndexRow = {
  sku: string; sku_norm: string; name: string; alt: string[]; alt_norm: string[]; slug: string; cat: string; tokens: string[];
};

const DATA = process.env.CATALOGUE_DIR || path.join(process.cwd(), "data");
function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) as T;
}

let _products: Product[] | null = null;
let _bySlug: Map<string, Product> | null = null;
let _bySkuNorm: Map<string, Product> | null = null;
let _categories: Category[] | null = null;
let _machines: Machine[] | null = null;
let _index: IndexRow[] | null = null;

export const norm = (s: string) => (s || "").toLowerCase().replace(/[\s\-\.\/]/g, "");

/** Alt part numbers with machine model tokens removed. A model token in the name is never a part code alias. */
export function altCodes(p: Product): string[] {
  const machines = new Set(p.machine_tokens.map(norm));
  return p.alt_part_numbers.filter((a) => !machines.has(norm(a)));
}

export function getProducts(): Product[] {
  if (!_products) _products = readJson<Product[]>("catalogue.json");
  return _products;
}
/** Products still offered. Inactive records (missing from Odoo) keep their URLs but drop out of listings and counts. */
export function getActiveProducts(): Product[] {
  return getProducts().filter((p) => p.active);
}
function skuMap() {
  if (!_bySkuNorm) {
    _bySkuNorm = new Map();
    for (const p of getProducts()) {
      _bySkuNorm.set(norm(p.sku), p);
      for (const a of altCodes(p)) if (!_bySkuNorm.has(norm(a))) _bySkuNorm.set(norm(a), p);
    }
  }
  return _bySkuNorm;
}
export function getProduct(slug: string): Product | undefined {
  if (!_bySlug) _bySlug = new Map(getProducts().map((p) => [p.slug, p]));
  return _bySlug.get(slug);
}
/** Resolve a SKU or alt part number (any spacing, hyphens, dots) to its product. */
export function resolveSku(code: string): Product | undefined {
  return skuMap().get(norm(decodeURIComponent(code)));
}
export function getCategories(): Category[] {
  if (!_categories) _categories = readJson<Category[]>("categories.json");
  return _categories;
}
export function getCategory(slug: string): Category | undefined {
  const parts = slug.split("/").filter(Boolean);
  let level = getCategories();
  let found: Category | undefined;
  for (let i = 0; i < parts.length; i++) {
    const want = parts.slice(0, i + 1).join("/");
    found = level.find((c) => c.slug === want);
    if (!found) return undefined;
    level = found.children;
  }
  return found;
}
export function getCategoryProducts(slug: string): Product[] {
  return getActiveProducts().filter((p) => p.category_slug === slug || p.category_slug.startsWith(slug + "/"));
}
export function getMachines(): Machine[] {
  if (!_machines) _machines = readJson<Machine[]>("machines.json");
  return _machines;
}
export function getMachine(modelSlug: string): Machine | undefined {
  return getMachines().find((m) => m.slug === modelSlug);
}
export function getMachineProducts(model: string): Product[] {
  return getActiveProducts().filter((p) => p.machine_tokens.includes(model));
}
function index() {
  if (!_index) _index = readJson<IndexRow[]>("search-index.json");
  return _index;
}

export type SearchHit = { product: Product; rank: number; reason: string };
/** Ranked search: exact SKU, normalised SKU prefix, alt part numbers, machine tokens, name words. */
export function search(q: string, limit = 96): SearchHit[] {
  const raw = (q || "").trim();
  if (!raw) return [];
  const n = norm(raw);
  const words = raw.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const hits: SearchHit[] = [];
  const seen = new Set<string>();
  const push = (row: IndexRow, rank: number, reason: string) => {
    if (seen.has(row.slug)) return;
    const p = getProduct(row.slug);
    if (!p) return;
    seen.add(row.slug);
    hits.push({ product: p, rank, reason });
  };
  const rows = index();
  // Alt codes that equal one of the row's machine tokens are skipped, so the "Machine" reason wins for those rows.
  const alts = (r: IndexRow) => {
    const machines = new Set(r.tokens.map(norm));
    return r.alt.filter((a) => !machines.has(norm(a)));
  };
  const altReason = (r: IndexRow) => "Also known as " + alts(r).join(", ");
  for (const r of rows) if (r.sku_norm === n) push(r, 0, "Part number");
  for (const r of rows) if (alts(r).some((a) => norm(a) === n)) push(r, 1, altReason(r));
  if (n.length >= 3) {
    for (const r of rows) if (r.sku_norm.startsWith(n)) push(r, 2, "Part number");
    for (const r of rows) if (alts(r).some((a) => norm(a).startsWith(n))) push(r, 3, altReason(r));
    for (const r of rows) if (r.sku_norm.includes(n)) push(r, 4, "Part number");
  }
  for (const r of rows) if (r.tokens.some((t) => norm(t) === n)) push(r, 5, "Machine " + raw.toUpperCase());
  if (words.length) {
    for (const r of rows) if (words.every((w) => r.name.includes(w))) push(r, 6, "Name");
  }
  hits.sort((a, b) => a.rank - b.rank || a.product.sku.localeCompare(b.product.sku));
  return hits.slice(0, limit);
}

export type Suggestion = { group: "Part numbers" | "Machines" | "Categories"; label: string; sub?: string; href: string };
export function suggest(q: string): Suggestion[] {
  const raw = (q || "").trim();
  if (raw.length < 2) return [];
  const n = norm(raw);
  const lq = raw.toLowerCase();
  const out: Suggestion[] = [];
  for (const h of search(raw, 5)) out.push({ group: "Part numbers", label: h.product.sku, sub: h.product.name, href: "/part/" + h.product.slug });
  for (const m of getMachines()) if (norm(m.model).includes(n)) out.push({ group: "Machines", label: m.model, sub: `${m.product_count} parts`, href: "/machines/" + m.slug });
  const walk = (cs: Category[]) => { for (const c of cs) { if (c.name.toLowerCase().includes(lq)) out.push({ group: "Categories", label: c.path.join(" / "), sub: `${c.product_count} parts`, href: "/parts/" + c.slug }); walk(c.children); } };
  walk(getCategories());
  return out.slice(0, 12);
}

export function formatPrice(p: Product): string {
  return p.price_aud_inc_gst == null ? "Price on request" : `$${p.price_aud_inc_gst.toLocaleString("en-AU", { minimumFractionDigits: 2 })} inc GST`;
}
export function stockLabel(p: Product): string {
  switch (p.stock_status) {
    case "in_stock": return p.stock_qty != null ? `In stock · ${p.stock_qty}` : "In stock";
    case "low_stock": return p.stock_qty != null ? `Low stock · ${p.stock_qty}` : "Low stock";
    case "made_to_order": return "Made to order";
    case "unavailable": return "No longer listed";
    default: return "Stock: call to confirm";
  }
}
