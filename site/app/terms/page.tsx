// Terms placeholder. Copy to be supplied by ACBG. Same frame, crumbs and page-h pattern as app/trade/page.tsx.
import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Terms" };

const CSS = `
.terms-page{padding-bottom:24px}
.terms-page .lede{margin-bottom:24px}
.terms-page .body{max-width:760px;font-size:15px;color:var(--muted)}
`;

export default function TermsPage() {
  return (
    <main className="terms-page frame">
      <style>{CSS}</style>
      <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Terms</span></nav>
      <div className="page-h">
        <h1>Terms of sale</h1>
      </div>
      <p className="lede">Terms to confirm with ACBG.</p>
      <p className="body">
        The terms of sale for this site are being finalised with {COMPANY.legalName}. Until they are published here,
        call <a href={COMPANY.phoneHref}>{COMPANY.phone}</a> or email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> with any question about ordering, delivery or returns.
      </p>
    </main>
  );
}
