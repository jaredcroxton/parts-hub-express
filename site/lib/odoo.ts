// Odoo external API for the site: the live stock read at checkout and the paid-order push (architecture/odoo_api_sync.md).
// ODOO_TRANSPORT=json2 for Odoo 19 and later (POST /json/2/<model>/<method>), jsonrpc for 17 and 18 (POST /jsonrpc).
// Route handlers only. Never write product data, never unlink.

export class OdooError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "OdooError";
  }
}

type Config = { url: string; db: string; login: string; key: string; transport: "json2" | "jsonrpc" };

export function odooConfig(): Config | null {
  const url = (process.env.ODOO_URL || "").replace(/\/+$/, "");
  const db = process.env.ODOO_DB || "";
  const key = process.env.ODOO_API_KEY || "";
  const login = process.env.ODOO_LOGIN || "";
  const transport = (process.env.ODOO_TRANSPORT || "json2").trim().toLowerCase();
  if (!url || !db || !key) return null;
  if (transport !== "json2" && transport !== "jsonrpc") return null;
  if (transport === "jsonrpc" && !login) return null;
  return { url, db, login, key, transport };
}

async function post(url: string, body: unknown, headers: Record<string, string> = {}): Promise<unknown> {
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "PartsHubExpress-site/1.0", ...headers },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
  } catch (err) {
    throw new OdooError(`Cannot reach Odoo: ${err instanceof Error ? err.message : String(err)}`);
  }
  const text = await res.text();
  if (!res.ok) throw new OdooError(`Odoo HTTP ${res.status}: ${text.slice(0, 300)}`, res.status);
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new OdooError("Odoo returned something that is not JSON", res.status);
  }
}

let cachedUid: { key: string; uid: number } | null = null;

async function rpc(cfg: Config, service: string, method: string, args: unknown[]): Promise<unknown> {
  const out = (await post(`${cfg.url}/jsonrpc`, { jsonrpc: "2.0", method: "call", params: { service, method, args }, id: Date.now() })) as {
    result?: unknown;
    error?: { message?: string; data?: { message?: string } };
  };
  if (out?.error) throw new OdooError(`Odoo error: ${out.error.data?.message || out.error.message || "unknown"}`);
  return out?.result;
}

async function uidFor(cfg: Config): Promise<number> {
  const cacheKey = `${cfg.url}|${cfg.db}|${cfg.login}|${cfg.key.slice(-6)}`;
  if (cachedUid?.key === cacheKey) return cachedUid.uid;
  const uid = await rpc(cfg, "common", "authenticate", [cfg.db, cfg.login, cfg.key, {}]);
  if (typeof uid !== "number" || !uid) throw new OdooError("Odoo login failed: check ODOO_DB, ODOO_LOGIN and ODOO_API_KEY", 401);
  cachedUid = { key: cacheKey, uid };
  return uid;
}

/** One Odoo call. json2Body is the named-argument body for JSON-2; rpcArgs and rpcKwargs are the execute_kw equivalent. */
async function call(model: string, method: string, json2Body: Record<string, unknown>, rpcArgs: unknown[], rpcKwargs: Record<string, unknown> = {}): Promise<unknown> {
  const cfg = odooConfig();
  if (!cfg) throw new OdooError("Odoo is not configured");
  if (cfg.transport === "json2") {
    return post(`${cfg.url}/json/2/${model}/${method}`, json2Body, { Authorization: `bearer ${cfg.key}`, "X-Odoo-Database": cfg.db });
  }
  const uid = await uidFor(cfg);
  return rpc(cfg, "object", "execute_kw", [cfg.db, uid, cfg.key, model, method, rpcArgs, rpcKwargs]);
}

type Row = Record<string, unknown>;

async function searchRead(model: string, domain: unknown[], fields: string[], limit?: number): Promise<Row[]> {
  const kw: Record<string, unknown> = { fields, ...(limit ? { limit } : {}) };
  const out = await call(model, "search_read", { domain, ...kw }, [domain], kw);
  return Array.isArray(out) ? (out as Row[]) : [];
}

async function read(model: string, ids: number[], fields: string[]): Promise<Row[]> {
  const out = await call(model, "read", { ids, fields }, [ids], { fields });
  return Array.isArray(out) ? (out as Row[]) : [];
}

async function create(model: string, vals: Row): Promise<number> {
  const cfg = odooConfig();
  const out = cfg?.transport === "json2" ? await call(model, "create", { vals_list: [vals] }, []) : await call(model, "create", {}, [vals]);
  const id = Array.isArray(out) ? out[0] : out;
  if (typeof id !== "number") throw new OdooError(`Odoo did not return an id for the new ${model}`);
  return id;
}

// ---------------------------------------------------------------------------------------------------------------------
// Stock check at checkout
// ---------------------------------------------------------------------------------------------------------------------

export type StockLine = { odooId: number; sku: string; qty: number };
export type StockProblem = { sku: string; reason: string };

/** One read for the cart. Short, archived or not-for-sale lines come back as problems (short lines pass with allowBackorder). */
export async function checkStock(lines: StockLine[], allowBackorder: boolean): Promise<StockProblem[]> {
  if (!lines.length) return [];
  const rows = await read("product.product", [...new Set(lines.map((l) => l.odooId))], ["qty_available", "active", "sale_ok"]);
  const byId = new Map(rows.map((r) => [Number(r.id), r]));
  const problems: StockProblem[] = [];
  for (const line of lines) {
    const row = byId.get(line.odooId);
    if (!row || row.active === false) problems.push({ sku: line.sku, reason: "no longer available" });
    else if (row.sale_ok === false) problems.push({ sku: line.sku, reason: "not sold online" });
    else if (!allowBackorder && Number(row.qty_available) < line.qty) {
      const have = Math.max(0, Math.floor(Number(row.qty_available) || 0));
      problems.push({ sku: line.sku, reason: have ? `only ${have} in stock` : "out of stock" });
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------------------------------------------------
// Paid order push
// ---------------------------------------------------------------------------------------------------------------------

export type OdooOrder = { id: number; name: string };

export async function findOrderByRef(ref: string): Promise<OdooOrder | null> {
  const rows = await searchRead("sale.order", [["client_order_ref", "=", ref]], ["id", "name"], 1);
  return rows[0] ? { id: Number(rows[0].id), name: String(rows[0].name || rows[0].id) } : null;
}

export type Customer = {
  email: string;
  name: string;
  phone?: string;
  address?: { line1?: string | null; line2?: string | null; city?: string | null; postal_code?: string | null; state?: string | null; country?: string | null };
};

export async function findOrCreatePartner(c: Customer): Promise<number> {
  const found = await searchRead("res.partner", [["email", "=ilike", c.email]], ["id"], 1);
  if (found[0]) return Number(found[0].id);
  const vals: Row = { name: c.name || c.email, email: c.email };
  if (c.phone) vals.phone = c.phone;
  const a = c.address;
  if (a) {
    if (a.line1) vals.street = a.line1;
    if (a.line2) vals.street2 = a.line2;
    if (a.city) vals.city = a.city;
    if (a.postal_code) vals.zip = a.postal_code;
    if (a.country) {
      const country = await searchRead("res.country", [["code", "=", a.country]], ["id"], 1);
      if (country[0]) {
        vals.country_id = Number(country[0].id);
        if (a.state) {
          const state = await searchRead("res.country.state", [["country_id", "=", vals.country_id], ["code", "=", a.state]], ["id"], 1);
          if (state[0]) vals.state_id = Number(state[0].id);
        }
      }
    }
  }
  return create("res.partner", vals);
}

export type OrderLine = { productId: number; qty: number; priceUnit: number };

export async function createSaleOrder(o: { partnerId: number; ref: string; note: string; lines: OrderLine[]; confirm: boolean }): Promise<OdooOrder> {
  const id = await create("sale.order", {
    partner_id: o.partnerId,
    client_order_ref: o.ref,
    origin: "partshubexpress.com",
    note: o.note,
    order_line: o.lines.map((l) => [0, 0, { product_id: l.productId, product_uom_qty: l.qty, price_unit: l.priceUnit }]),
  });
  if (o.confirm) await call("sale.order", "action_confirm", { ids: [id] }, [[id]]);
  const rows = await read("sale.order", [id], ["name"]);
  return { id, name: String(rows[0]?.name || id) };
}

/** Odoo list prices exclude GST unless ODOO_PRICES_INCLUDE_GST=1 (Australian default). amountCents is what Stripe charged, GST inclusive. */
export function odooUnitPrice(amountCents: number): number {
  const inc = amountCents / 100;
  const value = process.env.ODOO_PRICES_INCLUDE_GST === "1" ? inc : inc / 1.1;
  return Math.round(value * 100) / 100;
}
