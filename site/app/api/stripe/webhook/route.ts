// POST /api/stripe/webhook. Paid Checkout Sessions become Odoo sale orders (architecture/odoo_api_sync.md, payments_and_email.md).
// Verifies Stripe's v1 signature, is idempotent on the session id (client_order_ref), emails the buyer and ACBG once,
// and returns 500 when Odoo cannot take the order so Stripe retries (up to three days). No site database.
import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { resolveSku } from "@/lib/catalogue";
import { COMPANY } from "@/lib/company";
import { emailConfigured, escapeHtml, notifyAddress, sendEmail } from "@/lib/email";
import { createSaleOrder, findOrCreatePartner, findOrderByRef, odooConfig, odooUnitPrice, type OdooOrder, type OrderLine } from "@/lib/odoo";
import { sessionLines, stripeGet, stripePost, type SessionLine } from "@/lib/stripe";

const TOLERANCE_S = 300; // Stripe's recommended replay window
const HANDLED = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
const SENT_FLAG = "phx_confirmation_sent";

function verify(header: string, payload: string, secret: string): boolean {
  let t = "";
  const sigs: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.trim().split("=");
    if (k === "t") t = v || "";
    else if (k === "v1" && v) sigs.push(v);
  }
  if (!/^\d+$/.test(t) || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > TOLERANCE_S) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  return sigs.some((s) => {
    const b = Buffer.from(s, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

type Address = { line1?: string | null; line2?: string | null; city?: string | null; postal_code?: string | null; state?: string | null; country?: string | null };
type Session = {
  id: string;
  payment_status?: string;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_details?: { email?: string | null; name?: string | null; phone?: string | null; address?: Address | null } | null;
  shipping_details?: { name?: string | null; address?: Address | null } | null;
  collected_information?: { shipping_details?: { name?: string | null; address?: Address | null } | null } | null;
};

/** Checkout names lines "<SKU> <name>"; drop the SKU prefix for display next to the SKU. */
const cleanName = (l: SessionLine) => (l.name.startsWith(l.sku) ? l.name.slice(l.sku.length).trim() : l.name) || l.sku;
const money = (cents: number) => `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function orderEmails(session: Session, order: OdooOrder, lines: SessionLine[], paymentId: string) {
  const total = Number(session.amount_total) || lines.reduce((t, l) => t + l.amountTotal, 0);
  const gst = Math.round(total / 11); // prices are GST inclusive at 10 percent
  const who = session.customer_details || {};
  const ship = session.collected_information?.shipping_details || session.shipping_details || null;
  const addr = ship?.address || who.address || null;
  const addrText = addr ? [addr.line1, addr.line2, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(" "), addr.country].filter(Boolean).join(", ") : "";
  const rows = lines.map((l) => `${l.quantity} x ${l.sku} ${cleanName(l)}  ${money(l.amountTotal)}`);

  const customerText = [
    `Thanks for your order${who.name ? `, ${who.name}` : ""}.`,
    "",
    `Order ${order.name}`,
    ...rows,
    "",
    `Total paid ${money(total)} (includes GST of ${money(gst)})`,
    "",
    "Our team will confirm freight and dispatch with you shortly.",
    COMPANY.contactConfirmed ? `Questions: reply to this email or call ${COMPANY.phone}.` : "Questions: reply to this email.",
    "",
    COMPANY.brand,
  ].join("\n");
  const customerHtml = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#000">
<p style="font-size:20px;font-weight:700;margin:0 0 12px">Thanks for your order${who.name ? `, ${escapeHtml(who.name)}` : ""}.</p>
<p style="margin:0 0 12px">Order <b>${escapeHtml(order.name)}</b></p>
<table cellpadding="6" style="border-collapse:collapse;border-top:2px solid #f45120">${lines
    .map((l) => `<tr style="border-bottom:1px solid #d9dcdb"><td>${l.quantity} x</td><td><b>${escapeHtml(l.sku)}</b><br>${escapeHtml(cleanName(l))}</td><td align="right">${money(l.amountTotal)}</td></tr>`)
    .join("")}</table>
<p style="margin:12px 0">Total paid <b>${money(total)}</b> (includes GST of ${money(gst)})</p>
<p style="margin:0 0 12px">Our team will confirm freight and dispatch with you shortly.</p>
<p style="margin:0;color:#6c6c6c">${escapeHtml(COMPANY.brand)}</p></div>`;

  const internalText = [
    `New paid order ${order.name} from partshubexpress.com`,
    "",
    `Customer: ${who.name || ""} <${who.email || ""}> ${who.phone || ""}`,
    addrText ? `Ship to: ${ship?.name ? ship.name + ", " : ""}${addrText}` : "Ship to: not provided",
    "",
    ...rows,
    "",
    `Total paid ${money(total)} inc GST`,
    `Stripe payment ${paymentId || "n/a"}, Checkout Session ${session.id}`,
    `Odoo sale order id ${order.id}`,
  ].join("\n");
  return { customerText, customerHtml, internalText, email: who.email || "" };
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ ok: false, error: "Webhook is not configured" }, { status: 503 });

  const payload = await request.text();
  const header = request.headers.get("stripe-signature") || "";
  if (!verify(header, payload, secret)) return Response.json({ ok: false, error: "Bad signature" }, { status: 400 });

  let event: { id?: string; type?: string; data?: { object?: Session } };
  try { event = JSON.parse(payload); } catch { return Response.json({ ok: false, error: "Invalid payload" }, { status: 400 }); }
  if (!event.type || !HANDLED.has(event.type)) return Response.json({ received: true });

  const session = event.data?.object;
  if (!session?.id) return Response.json({ ok: false, error: "No session in event" }, { status: 400 });
  if (session.payment_status !== "paid") return Response.json({ received: true, skipped: "not paid yet" });
  if (!odooConfig()) {
    console.error("[webhook] paid session but Odoo is not configured", session.id);
    return Response.json({ ok: false, error: "Odoo is not configured" }, { status: 503 }); // Stripe retries
  }

  const paymentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || "";
  let lines: SessionLine[] | null = null;
  try {
    let order = await findOrderByRef(session.id);
    if (!order) {
      lines = await sessionLines(session.id);
      const orderLines: OrderLine[] = [];
      for (const l of lines) {
        const p = l.sku ? resolveSku(l.sku) : undefined;
        if (!p || typeof p.odoo_id !== "number") throw new Error(`No Odoo product for SKU ${l.sku || "(missing)"}`);
        if (l.quantity < 1) continue;
        orderLines.push({ productId: p.odoo_id, qty: l.quantity, priceUnit: odooUnitPrice(l.unitAmount) });
      }
      if (!orderLines.length) throw new Error("Session has no order lines");
      const who = session.customer_details || {};
      if (!who.email) throw new Error("Session has no customer email");
      const ship = session.collected_information?.shipping_details || session.shipping_details || null;
      const partnerId = await findOrCreatePartner({
        email: who.email,
        name: who.name || ship?.name || who.email,
        phone: who.phone || undefined,
        address: ship?.address || who.address || undefined,
      });
      order = await createSaleOrder({
        partnerId,
        ref: session.id,
        note: `Paid online by card through Stripe. Payment ${paymentId || "n/a"}. Checkout Session ${session.id}.`,
        lines: orderLines,
        confirm: process.env.ODOO_CONFIRM_PAID_ORDERS === "1",
      });
    }

    // Confirmation emails exactly once, tracked on the PaymentIntent so retries never send twice.
    if (paymentId && emailConfigured()) {
      const pi = await stripeGet<{ metadata?: Record<string, string> }>(`/v1/payment_intents/${encodeURIComponent(paymentId)}`);
      const alreadySent = pi.ok && pi.data.metadata?.[SENT_FLAG] === "1";
      if (!alreadySent) {
        if (!lines) lines = await sessionLines(session.id);
        const mail = orderEmails(session, order, lines, paymentId);
        const to = notifyAddress();
        const sentCustomer = mail.email ? await sendEmail({ to: mail.email, subject: `Your Parts Hub Express order ${order.name}`, text: mail.customerText, html: mail.customerHtml, replyTo: to }) : true;
        const sentInternal = to ? await sendEmail({ to, subject: `New order ${order.name}`, text: mail.internalText, replyTo: mail.email || undefined }) : true;
        if (sentCustomer && sentInternal) {
          const form = new URLSearchParams();
          form.set(`metadata[${SENT_FLAG}]`, "1");
          form.set("metadata[odoo_order]", order.name);
          await stripePost(`/v1/payment_intents/${encodeURIComponent(paymentId)}`, form);
        }
      }
    }
    return Response.json({ received: true, order: order.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhook] order push failed", session.id, message);
    const to = notifyAddress();
    // One alert per payment, not one per Stripe retry: the flag lives on the PaymentIntent.
    let alerted = false;
    if (paymentId) {
      const pi = await stripeGet<{ metadata?: Record<string, string> }>(`/v1/payment_intents/${encodeURIComponent(paymentId)}`).catch(() => null);
      alerted = Boolean(pi?.ok && pi.data.metadata?.phx_alert_sent === "1");
    }
    if (to && !alerted) {
      const sent = await sendEmail({
        to,
        subject: `Order not yet in Odoo: Stripe session ${session.id}`,
        text: [
          "A paid order from partshubexpress.com could not be created in Odoo yet.",
          `Reason: ${message}`,
          `Customer: ${session.customer_details?.email || "unknown"}`,
          `Stripe payment ${paymentId || "n/a"}, Checkout Session ${session.id}`,
          "",
          "Stripe will retry automatically for up to three days. If the reason needs fixing (an expired Odoo key, a missing product), fix it, then resend the event from the Stripe dashboard.",
          "This alert is sent once per payment.",
        ].join("\n"),
      });
      if (sent && paymentId) {
        const form = new URLSearchParams();
        form.set("metadata[phx_alert_sent]", "1");
        await stripePost(`/v1/payment_intents/${encodeURIComponent(paymentId)}`, form).catch(() => null);
      }
    }
    return Response.json({ ok: false, error: "Order could not be recorded yet" }, { status: 500 });
  }
}
