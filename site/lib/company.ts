// Company facts. Placeholders until ACBG confirms spelling and contact details (claude.md rule).
// contactConfirmed stays false until ACBG supplies real details; emails leave the phone number out until then.
export const COMPANY = {
  contactConfirmed: false,
  brand: "Parts Hub Express",
  legalName: "Australia Crushing & Belting Group",
  phone: "1300 000 000",
  phoneHref: "tel:1300000000",
  email: "sales@partshubexpress.com",
  abn: "ABN to confirm",
  hours: "Hours to confirm",
  dispatch: "Dispatch address to confirm",
} as const;

// Launch gate: a SITE_LIVE=1 build fails while these are placeholders, so the site never launches with a fake phone number.
if (process.env.SITE_LIVE === "1" && !COMPANY.contactConfirmed) {
  throw new Error("SITE_LIVE=1 but site/lib/company.ts still holds placeholder contact details. Fill them in and set contactConfirmed: true.");
}
