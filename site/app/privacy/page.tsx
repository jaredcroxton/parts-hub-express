// Privacy placeholder. Copy to be supplied by ACBG. Same frame, crumbs and page-h pattern as app/trade/page.tsx.
import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Privacy" };

const CSS = `
.privacy-page{padding-bottom:24px}
.privacy-page .lede{margin-bottom:24px}
.privacy-page .body{max-width:760px;font-size:15px;color:var(--muted)}
`;

export default function PrivacyPage() {
  return (
    <main className="privacy-page frame">
      <style>{CSS}</style>
      <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Privacy</span></nav>
      <div className="page-h">
        <h1>Privacy</h1>
      </div>
      <p className="lede">Privacy policy to confirm with ACBG.</p>
      <p className="body">
        The privacy policy for this site is being finalised with {COMPANY.legalName}. Until it is published here,
        call <a href={COMPANY.phoneHref}>{COMPANY.phone}</a> or email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> with any question about how your details are handled.
      </p>
    </main>
  );
}
