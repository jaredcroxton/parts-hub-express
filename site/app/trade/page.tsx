// Trade account application. Posts to /api/quote with type "trade" (architecture/storefront.md).
import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Trade account" };

const CSS = `
.trade-page{padding-bottom:24px}
.trade-page .lede{margin-bottom:24px}
.trade-page .form{max-width:760px}
.trade-page .form .msg:empty{display:none}
.trade-page .form .acts{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.trade-page .alt{font-size:14px;color:var(--muted)}
.trade-page .hint{font-size:12px;color:var(--muted);margin-top:6px}
.trade-page textarea#notes{min-height:96px}
@media (max-width:720px){
  .trade-page .form .acts .btn{width:100%}
}
`;

const SUCCESS = "Sent. We reply within one working day.";
const FAILURE = `Could not send. Call ${COMPANY.phone} or email ${COMPANY.email}.`;

const SCRIPT = `(function(){
  var f=document.getElementById('tradeForm'), msg=document.getElementById('tradeMsg'), btn=document.getElementById('tradeSubmit');
  if(!f) return;
  function say(t,k){ msg.textContent=t; msg.className='msg full'+(k?' '+k:''); }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(!f.reportValidity()) return;
    var fd=new FormData(f), body={type:'trade'};
    fd.forEach(function(v,k){ body[k]=String(v).trim(); });
    btn.disabled=true; say('Sending.');
    fetch('/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok&&j&&j.ok,j:j}; }); })
      .then(function(res){ if(res.ok){ say(${JSON.stringify(SUCCESS)},'ok'); f.reset(); } else { say((res.j&&res.j.error)||${JSON.stringify(FAILURE)},'err'); } })
      .catch(function(){ say(${JSON.stringify(FAILURE)},'err'); })
      .then(function(){ btn.disabled=false; });
  });
})();`;

export default function TradePage() {
  return (
    <main className="trade-page frame">
      <style>{CSS}</style>
      <nav className="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Trade account</span></nav>
      <div className="page-h">
        <h1>Open a trade account</h1>
      </div>
      <p className="lede">Tell us about your business and our team will come back to you about account terms.</p>

      <form className="form" id="tradeForm" autoComplete="on">
        <div>
          <label className="lbl" htmlFor="company">Company</label>
          <input className="field" id="company" name="company" type="text" required autoComplete="organization" enterKeyHint="next" />
        </div>
        <div>
          <label className="lbl" htmlFor="abn">ABN</label>
          <input className="field mono" id="abn" name="abn" type="text" inputMode="numeric" required pattern="[0-9 ]{11,14}" aria-describedby="abnHint" enterKeyHint="next" />
          <p className="hint" id="abnHint">11 digits</p>
        </div>
        <div>
          <label className="lbl" htmlFor="contact">Contact name</label>
          <input className="field" id="contact" name="contact" type="text" required autoComplete="name" enterKeyHint="next" />
        </div>
        <div>
          <label className="lbl" htmlFor="email">Email</label>
          <input className="field" id="email" name="email" type="email" required autoComplete="email" enterKeyHint="next" />
        </div>
        <div>
          <label className="lbl" htmlFor="phone">Phone</label>
          <input className="field" id="phone" name="phone" type="tel" required autoComplete="tel" enterKeyHint="next" />
        </div>
        <div>
          <label className="lbl" htmlFor="monthly_spend">Estimated monthly spend</label>
          <select className="field" id="monthly_spend" name="monthly_spend" required defaultValue="">
            <option value="" disabled>Select a range</option>
            <option value="under_1000">Under 1,000 AUD</option>
            <option value="1000_5000">1,000 to 5,000 AUD</option>
            <option value="5000_20000">5,000 to 20,000 AUD</option>
            <option value="over_20000">Over 20,000 AUD</option>
            <option value="not_sure">Not sure yet</option>
          </select>
        </div>
        <div className="full">
          <label className="lbl" htmlFor="notes">Notes (optional)</label>
          <textarea className="field" id="notes" name="notes" placeholder="Machines you run, parts you buy most, anything else we should know"></textarea>
        </div>
        <div className="full acts">
          <button className="btn" type="submit" id="tradeSubmit">Send application</button>
          <span className="alt">Or call <a href={COMPANY.phoneHref}>{COMPANY.phone}</a></span>
        </div>
        <p className="msg full" id="tradeMsg" role="status" aria-live="polite" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
      </form>

      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </main>
  );
}
