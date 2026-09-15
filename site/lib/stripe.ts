// Stripe REST helpers for route handlers (architecture/payments_and_email.md). fetch only, no stripe npm package.
// STRIPE_API_BASE is a test seam for tools/test_integrations.py; production always talks to api.stripe.com.

export type StripeResult<T = Record<string, unknown>> = { ok: boolean; status: number; data: T };

function base() {
  return (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/+$/, "");
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

async function call<T>(method: "GET" | "POST", path: string, form?: URLSearchParams): Promise<StripeResult<T>> {
  const res = await fetch(base() + path, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || ""}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? form.toString() : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export const stripeGet = <T = Record<string, unknown>>(path: string) => call<T>("GET", path);
export const stripePost = <T = Record<string, unknown>>(path: string, form: URLSearchParams) => call<T>("POST", path, form);

export type SessionLine = { sku: string; cartSku: string; name: string; quantity: number; unitAmount: number; amountTotal: number };

/** All line items of a Checkout Session, with the SKU from the product metadata written at checkout. */
export async function sessionLines(sessionId: string): Promise<SessionLine[]> {
  const out: SessionLine[] = [];
  let after = "";
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ limit: "100" });
    qs.append("expand[]", "data.price.product");
    if (after) qs.set("starting_after", after);
    const list = await stripeGet<{ data?: unknown[]; has_more?: boolean }>(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?${qs}`);
    if (!list.ok) throw new Error(`Stripe line items HTTP ${list.status}`);
    const rows = Array.isArray(list.data.data) ? list.data.data : [];
    for (const raw of rows) {
      const row = raw as { id?: string; quantity?: number; description?: string; amount_total?: number; price?: { unit_amount?: number; product?: { metadata?: Record<string, string>; name?: string } } };
      const meta = row.price?.product && typeof row.price.product === "object" ? row.price.product.metadata || {} : {};
      out.push({
        sku: String(meta.sku || "").trim(),
        cartSku: String(meta.cart_sku || meta.sku || "").trim(),
        name: String(row.description || row.price?.product?.name || ""),
        quantity: Math.floor(Number(row.quantity) || 0),
        unitAmount: Number(row.price?.unit_amount) || 0,
        amountTotal: Number(row.amount_total) || 0,
      });
    }
    const last = rows[rows.length - 1] as { id?: string } | undefined;
    if (list.data.has_more !== true || !last?.id) break;
    after = last.id;
  }
  return out;
}
