// POST /api/quote: quote requests and trade applications. Inbox file first, always. Email second, never blocking.
import type { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { sendEmail } from "@/lib/email";

const INBOX_DIR = path.join(process.cwd(), "data", "inbox");
const INBOX_FILE = path.join(INBOX_DIR, "quotes.jsonl");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = 4000;

const FIELDS: Record<"quote" | "trade", string[]> = {
  quote: ["company", "contact", "email", "phone", "machine", "parts", "notes"],
  trade: ["company", "abn", "contact", "email", "phone", "monthly_spend", "notes"],
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim().slice(0, MAX) : "";
}

function bad(error: string, field?: string) {
  return Response.json({ ok: false, error, ...(field ? { field } : {}) }, { status: 400 });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return bad("Send the form as a JSON object.");
    body = parsed as Record<string, unknown>;
  } catch {
    return bad("Send the form as a JSON object.");
  }

  const type: "quote" | "trade" = body.type === "trade" ? "trade" : "quote";
  const fields: Record<string, string> = {};
  for (const k of FIELDS[type]) fields[k] = str(body[k]);

  if (!fields.company) return bad("Company is required.", "company");
  if (!EMAIL_RE.test(fields.email)) return bad("Enter a valid email address.", "email");
  if (type === "quote" && !fields.parts) return bad("Add at least one part number.", "parts");

  const record = { received_at: new Date().toISOString(), type, ...fields };

  // 1. Inbox file where the filesystem is writable (local and self-hosted). Vercel functions are read-only, so there the
  //    request relies on email. It is never dropped silently: if nothing recorded it, the buyer is told and keeps the draft.
  let recorded = false;
  try {
    await fs.promises.mkdir(INBOX_DIR, { recursive: true });
    await fs.promises.appendFile(INBOX_FILE, JSON.stringify(record) + "\n", "utf8");
    recorded = true;
  } catch (err) {
    console.error("[api/quote] inbox write failed", err);
  }

  // 2. Email ACBG through Resend when configured (reply goes straight to the buyer).
  if (process.env.ENQUIRY_TO_EMAIL) {
    const subject = type === "trade" ? `Trade account application: ${fields.company}` : `Quote request: ${fields.company}`;
    const text = FIELDS[type].map((k) => `${k}: ${fields[k]}`).join("\n") + `\n\nreceived_at: ${record.received_at}`;
    if (await sendEmail({ to: process.env.ENQUIRY_TO_EMAIL, subject, text, replyTo: fields.email })) recorded = true;
  }

  if (!recorded) return Response.json({ ok: false, error: "Online requests are not switched on yet. Your list is saved on this device. Please call or email us." }, { status: 503 });
  return Response.json({ ok: true });
}
