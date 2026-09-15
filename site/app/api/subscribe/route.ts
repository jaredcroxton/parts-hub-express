import type { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { resendBase } from "@/lib/email";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Email signup. Always written to the inbox file first; Resend audience add is best effort when configured.
export async function POST(request: NextRequest) {
  let body: { email?: string } = {};
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Bad request" }, { status: 400 }); }
  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL.test(email)) return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  // Inbox file where the filesystem is writable (local); Vercel functions are read-only, so there it relies on Resend.
  let recorded = false;
  try {
    const dir = path.join(process.cwd(), "data", "inbox");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "subscribers.jsonl"), JSON.stringify({ received_at: new Date().toISOString(), email }) + "\n");
    recorded = true;
  } catch (e) { console.error("subscribe inbox write failed", e); }
  const key = process.env.RESEND_API_KEY, audience = process.env.RESEND_AUDIENCE_ID;
  if (key && audience) {
    try {
      const res = await fetch(`${resendBase()}/audiences/${audience}/contacts`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ email, unsubscribed: false }) });
      if (res.ok) recorded = true;
    } catch (e) { console.error("resend audience add failed", e); }
  }
  if (!recorded) return Response.json({ ok: false, error: "Email signup is not switched on yet." }, { status: 503 });
  return Response.json({ ok: true });
}
