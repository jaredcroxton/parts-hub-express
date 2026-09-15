// GET /api/checkout/verify?session_id=. Confirms with Stripe that a Checkout Session is paid before the cart page removes anything.
// Returns {paid:true, items:[{sku, qty}]} only when payment_status is "paid". Uses fetch against the Stripe REST API, no stripe npm package.
import type { NextRequest } from "next/server";

const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{8,}$/;
const NO_STORE = { "Cache-Control": "no-store" };
const MAX_PAGES = 20; // 100 line items per page

type StripeResult = { ok: boolean; status: number; data: Record<string, unknown> };
type LineItem = { id?: string; quantity?: number | null; price?: { product?: unknown } | null };

function reply(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function GET(request: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return reply({ paid: false, error: "Payments are not live yet" }, 503);

  const id = request.nextUrl.searchParams.get("session_id") || "";
  if (!SESSION_RE.test(id)) return reply({ paid: false, error: "Invalid session" }, 400);

  const stripe = async (url: string): Promise<StripeResult> => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  };

  try {
    const session = await stripe(`https://api.stripe.com/v1/checkout/sessions/${id}`);
    if (session.status === 404) return reply({ paid: false, error: "Session not found" }, 404);
    if (!session.ok) return reply({ paid: false, error: "Stripe rejected the request" }, 502);
    if (session.data.payment_status !== "paid") return reply({ paid: false });

    const merged = new Map<string, number>();
    let after = "";
    for (let page = 0; page < MAX_PAGES; page++) {
      const qs = new URLSearchParams({ limit: "100" });
      qs.append("expand[]", "data.price.product");
      if (after) qs.set("starting_after", after);
      const list = await stripe(`https://api.stripe.com/v1/checkout/sessions/${id}/line_items?${qs}`);
      if (!list.ok) return reply({ paid: false, error: "Stripe rejected the request" }, 502);
      const rows = (Array.isArray(list.data.data) ? list.data.data : []) as LineItem[];
      for (const row of rows) {
        const product = row.price?.product;
        const meta = product && typeof product === "object" ? (product as { metadata?: Record<string, string> }).metadata : undefined;
        const sku = String(meta?.cart_sku || meta?.sku || "").trim();
        const qty = Math.floor(Number(row.quantity) || 0);
        if (!sku || qty < 1) continue;
        merged.set(sku, (merged.get(sku) || 0) + qty);
      }
      const last = rows[rows.length - 1];
      if (list.data.has_more !== true || !last?.id) break;
      after = last.id;
    }

    return reply({ paid: true, items: [...merged].map(([sku, qty]) => ({ sku, qty })) });
  } catch {
    return reply({ paid: false, error: "Could not reach Stripe" }, 502);
  }
}
