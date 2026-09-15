// Resend email for route handlers (architecture/payments_and_email.md). Never throws: returns true when Resend accepted it.
// RESEND_API_BASE is a test seam for tools/test_integrations.py; production always talks to api.resend.com.

export function resendBase() {
  return (process.env.RESEND_API_BASE || "https://api.resend.com").replace(/\/+$/, "");
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.ORDER_FROM_EMAIL);
}

export type Email = { to: string | string[]; subject: string; text: string; html?: string; replyTo?: string };

export async function sendEmail(mail: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL;
  if (!key || !from) return false;
  try {
    const res = await fetch(resendBase() + "/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(mail.to) ? mail.to : [mail.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.html ? { html: mail.html } : {}),
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) console.error("[email] Resend responded", res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error("[email] Resend request failed", err);
    return false;
  }
}

/** Where ACBG receives order notices and alerts. */
export function notifyAddress(): string | undefined {
  return process.env.ORDER_NOTIFY_EMAIL || process.env.ENQUIRY_TO_EMAIL || undefined;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
