// POST /api/checkout. Creates a Stripe Checkout Session from the cart (architecture/payments_and_email.md).
// Prices come from the catalogue on the server, GST inclusive. One live stock read from Odoo before payment when Odoo is connected.
// Uses fetch against the Stripe REST API, no stripe npm package.
import type { NextRequest } from "next/server";
import { resolveSku } from "@/lib/catalogue";
import { OdooError, checkStock, odooConfig, type StockLine } from "@/lib/odoo";
import { stripeConfigured, stripePost } from "@/lib/stripe";

type CartItem = { sku: string; qty: number };

function readItems(body: unknown): CartItem[] {
  const raw = body && typeof body === "object" && Array.isArray((body as { items?: unknown }).items) ? ((body as { items: unknown[] }).items) : [];
  const merged = new Map<string, number>();
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const sku = String((x as { sku?: unknown }).sku || "").trim();
    if (!sku) continue;
    const qty = Math.min(999, Math.max(1, Math.floor(Number((x as { qty?: unknown }).qty) || 1)));
    merged.set(sku, (merged.get(sku) || 0) + qty);
  }
  return [...merged].map(([sku, qty]) => ({ sku, qty }));
}

export async function POST(request: NextRequest) {
  if (!stripeConfigured()) return Response.json({ ok: false, error: "Payments are not live yet" }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Invalid request" }, { status: 400 }); }
  const items = readItems(body);
  if (!items.length) return Response.json({ ok: false, error: "Cart is empty" }, { status: 400 });

  const priced = items
    .map(({ sku, qty }) => ({ sku, qty, p: resolveSku(sku) }))
    .filter((x): x is { sku: string; qty: number; p: NonNullable<ReturnType<typeof resolveSku>> } => Boolean(x.p && x.p.active && x.p.price_aud_inc_gst != null)); // unpriced items never reach Stripe
  if (!priced.length) return Response.json({ ok: false, error: "No priced items" }, { status: 400 });

  if (odooConfig()) {
    const missing = priced.filter((x) => typeof x.p.odoo_id !== "number");
    if (missing.length) {
      return Response.json({ ok: false, error: `We can't confirm stock for ${missing.map((x) => x.p.sku).join(", ")}. Send it as a quote request instead.` }, { status: 409 });
    }
    const lines: StockLine[] = priced.map((x) => ({ odooId: x.p.odoo_id as number, sku: x.p.sku, qty: x.qty }));
    try {
      const problems = await checkStock(lines, process.env.ALLOW_BACKORDER === "1");
      if (problems.length) {
        const list = problems.map((pr) => `${pr.sku} (${pr.reason})`).join(", ");
        return Response.json({ ok: false, error: `Please update your cart: ${list}.`, problems }, { status: 409 });
      }
    } catch (err) {
      console.error("[api/checkout] stock check failed", err instanceof OdooError ? err.message : err);
      return Response.json({ ok: false, error: "We couldn't confirm stock right now. Try again shortly, or send the cart as a quote request." }, { status: 503 });
    }
  }

  const site = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/+$/, "");
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("currency", "aud");
  if (process.env.STRIPE_AUTOMATIC_TAX === "1") form.set("automatic_tax[enabled]", "true"); // needs Stripe Tax set up for GST
  form.set("billing_address_collection", "required");
  form.set("shipping_address_collection[allowed_countries][0]", "AU");
  form.set("phone_number_collection[enabled]", "true");
  form.set("customer_creation", "always");
  form.set("custom_text[submit][message]", "Freight and dispatch are confirmed by our team after your order.");
  form.set("payment_intent_data[metadata][source]", "partshubexpress.com");
  form.set("success_url", `${site}/cart?paid=1&session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${site}/cart?cancelled=1`);
  (process.env.STRIPE_SHIPPING_RATE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)
    .forEach((rate, i) => form.set(`shipping_options[${i}][shipping_rate]`, rate));

  priced.forEach(({ sku, qty, p }, n) => {
    const k = `line_items[${n}]`;
    form.set(`${k}[quantity]`, String(qty));
    form.set(`${k}[price_data][currency]`, "aud");
    form.set(`${k}[price_data][unit_amount]`, String(Math.round((p.price_aud_inc_gst as number) * 100)));
    form.set(`${k}[price_data][tax_behavior]`, "inclusive"); // list price already includes GST
    form.set(`${k}[price_data][product_data][name]`, `${p.sku} ${p.name}`.slice(0, 250));
    form.set(`${k}[price_data][product_data][metadata][sku]`, p.sku);
    form.set(`${k}[price_data][product_data][metadata][cart_sku]`, sku); // the cart's own key, so /api/checkout/verify can remove exactly what was bought
  });

  try {
    const res = await stripePost<{ url?: string; error?: { message?: string } }>("/v1/checkout/sessions", form);
    if (!res.ok || !res.data.url) {
      return Response.json({ ok: false, error: res.data.error?.message || "Stripe rejected the request" }, { status: 502 });
    }
    return Response.json({ ok: true, url: res.data.url });
  } catch {
    return Response.json({ ok: false, error: "Could not reach Stripe" }, { status: 502 });
  }
}
