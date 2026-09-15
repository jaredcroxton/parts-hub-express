// /quote: paste-a-list quote request (architecture/storefront.md). Server page, inline script for localStorage and submit.
import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Request a quote",
  description: "Paste your part numbers and we reply with a price on every line, including parts not listed online.",
};

const FAIL_MSG = `Could not send. Call ${COMPANY.phone} or email ${COMPANY.email}.`;

// Draft: the whole form is saved to localStorage phx_quote_draft on input and restored on load. It is cleared only after
// /api/quote confirms the request. The quote list phx_quote ("SKU x qty" per line) reconciles with the part list by SKU:
// "applied" remembers each imported line exactly as written. Untouched imported lines follow quantity changes and leave
// when the SKU leaves the list; lines the buyer typed or edited stay as typed and are flagged under the field instead.
// ?q= arrives as data-q rather than a textarea defaultValue, because React hydration resets a prefilled textarea's value.
const QUOTE_SCRIPT = `
(function(){
  var DRAFT='phx_quote_draft', FIELDS=['company','contact','email','phone','machine','parts','notes'];
  var f=document.getElementById('quoteForm'),ta=document.getElementById('parts'),msg=document.getElementById('quoteMsg'),btn=document.getElementById('quoteBtn');
  if(!f||!ta||!msg||!btn) return;
  var EMAIL_RE=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  var applied={};
  function say(t,cls){msg.textContent=t;msg.className='msg full'+(cls?' '+cls:'');}
  function tok(line){ var m=String(line).trim().split(/\\s+/)[0]; return m?m.toUpperCase():''; }
  function lines(){ var a=ta.value.split('\\n'); while(a.length&&!a[a.length-1].trim()) a.pop(); return a; }
  function hasTok(a,t){ for(var i=0;i<a.length;i++){ if(tok(a[i])===t) return i; } return -1; }
  function save(){
    var d={fields:{},applied:applied,saved_at:new Date().toISOString()};
    FIELDS.forEach(function(k){ var el=f.elements[k]; d.fields[k]=el?el.value:''; });
    try{ localStorage.setItem(DRAFT,JSON.stringify(d)); }catch(e){}
  }
  var fromUrl=f.getAttribute('data-q')||'', draft=null;
  try{ draft=JSON.parse(localStorage.getItem(DRAFT)||'null'); }catch(e){ draft=null; }
  if(draft&&typeof draft==='object'&&draft.fields&&typeof draft.fields==='object'){
    FIELDS.forEach(function(k){ var el=f.elements[k]; if(el&&typeof draft.fields[k]==='string') el.value=draft.fields[k]; });
    if(draft.applied&&typeof draft.applied==='object') applied=draft.applied;
  }
  // applied[SKU]={qty:<list qty last seen>, line:<exact text this script wrote, or null when the buyer typed the line>}.
  // Older drafts stored a bare number; read that as a line this script wrote.
  var norm={};
  Object.keys(applied).forEach(function(sku){
    var v=applied[sku];
    if(typeof v==='number') norm[sku]={qty:v,line:sku+' x '+v};
    else if(v&&typeof v==='object'&&typeof v.qty==='number') norm[sku]={qty:v.qty,line:typeof v.line==='string'?v.line:null};
  });
  applied=norm;
  var a=lines(), conflicts=[];
  fromUrl.split('\\n').forEach(function(l){ var t=tok(l); if(t&&hasTok(a,t)<0) a.push(l.trim()); });
  var q=null;
  try{ q=JSON.parse(localStorage.getItem('phx_quote')||'[]'); }catch(e){ q=null; }
  if(Array.isArray(q)){
    var seen={};
    q.forEach(function(x){
      if(!x||!x.sku) return;
      var sku=String(x.sku), qty=Math.max(1,parseInt(x.qty,10)||1), i=hasTok(a,sku.toUpperCase()), was=applied[sku], line=sku+' x '+qty;
      seen[sku]=true;
      if(i<0){
        if(!was||was.qty!==qty){ a.push(line); applied[sku]={qty:qty,line:line}; } // deleted by hand stays deleted until the quantity changes
      } else if(was&&was.line!==null&&a[i].trim()===was.line){
        if(was.qty!==qty) a[i]=line;                                                // untouched imported line follows the list
        applied[sku]={qty:qty,line:a[i].trim()};
      } else {
        if(was&&was.qty!==qty) conflicts.push(sku+' (quote list now '+qty+')');     // buyer edited or typed this line, leave it as typed
        applied[sku]={qty:qty,line:null};
      }
    });
    Object.keys(applied).forEach(function(sku){
      if(seen[sku]) return;
      var was=applied[sku], i=hasTok(a,sku.toUpperCase());
      if(i>=0){
        if(was.line!==null&&a[i].trim()===was.line) a.splice(i,1);                    // untouched imported line leaves with the item
        else conflicts.push(sku+' (removed from quote list)');
      }
      delete applied[sku];
    });
  }
  ta.value=a.join('\\n');
  var sync=document.getElementById('partsSync');
  if(sync&&conflicts.length){ sync.textContent='Your quote list changed. These lines were edited here, so we left them as typed. Check them: '+conflicts.join(', ')+'.'; sync.hidden=false; }
  save();
  f.addEventListener('input',save);

  var CHECKS={
    company:function(v){ return v?'':'Enter your company name.'; },
    contact:function(v){ return v?'':'Enter a contact name.'; },
    email:function(v){ return EMAIL_RE.test(v)?'':'Enter a valid email address.'; },
    parts:function(v){ return v?'':'Add at least one part number.'; }
  };
  function setError(k,text){
    var el=f.elements[k], err=document.getElementById(k+'Err'); if(!el||!err) return;
    var ids=(el.getAttribute('aria-describedby')||'').split(/\\s+/).filter(function(id){ return id&&id!==k+'Err'; });
    err.textContent=text||''; err.hidden=!text;
    if(text){ ids.push(k+'Err'); el.setAttribute('aria-invalid','true'); } else { el.removeAttribute('aria-invalid'); }
    if(ids.length) el.setAttribute('aria-describedby',ids.join(' ')); else el.removeAttribute('aria-describedby');
  }
  Object.keys(CHECKS).forEach(function(k){
    var el=f.elements[k]; if(!el) return;
    el.addEventListener('input',function(){ if(el.getAttribute('aria-invalid')==='true'&&!CHECKS[k](el.value.trim())) setError(k,''); });
  });
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d={type:'quote'}, first=null;
    FIELDS.forEach(function(k){var el=f.elements[k];d[k]=el?el.value.trim():'';});
    Object.keys(CHECKS).forEach(function(k){ var t=CHECKS[k](d[k]); setError(k,t); if(t&&!first) first=k; });
    if(first){ say('Check the highlighted fields.','err'); f.elements[first].focus(); return; }
    btn.disabled=true; say('Sending.','');
    fetch('/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok&&j&&j.ok,j:j};});})
      .then(function(res){
        if(res.ok){
          try{localStorage.removeItem('phx_quote');localStorage.removeItem('phx_quote_from_cart');localStorage.removeItem(DRAFT);}catch(e){}
          window.dispatchEvent(new Event('phx:change'));
          applied={};
          f.reset(); ta.value='';
          try{ history.replaceState(null,'','/quote'); }catch(e){}
          say('Sent. We reply within one working day.','ok');
        } else {
          var field=res.j&&res.j.field;
          if(field&&CHECKS[field]){ setError(field,res.j.error); f.elements[field].focus(); }
          say((res.j&&res.j.error)||${JSON.stringify(FAIL_MSG)},'err');
        }
      })
      .catch(function(){ say(${JSON.stringify(FAIL_MSG)},'err'); })
      .then(function(){ btn.disabled=false; });
  });
})();`;

export default async function QuotePage(props: PageProps<"/quote">) {
  const sp = await props.searchParams;
  const q = Array.isArray(sp.q) ? sp.q.join("\n") : sp.q || "";

  return (
    <main className="quote-page frame">
      <style>{`
        .quote-page{padding-bottom:48px}
        .quote-page .intro{margin-bottom:24px}
        .quote-page .form{max-width:880px}
        .quote-page textarea.field{font-family:var(--mono);font-variant-numeric:tabular-nums}
        .quote-page textarea#parts{min-height:180px}
        .quote-page textarea#notes{min-height:96px}
        .quote-page .field[aria-invalid="true"]{border-color:var(--low);box-shadow:inset 0 0 0 1px var(--low)}
        .quote-page .hint{font-size:12px;color:var(--muted);margin-top:6px}
        .quote-page .ferr{font-size:14px;color:var(--low);margin-top:6px}
        .quote-page .sync{font-size:14px;color:var(--low);margin-top:6px;overflow-wrap:anywhere}
        .quote-page .send{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
        .quote-page .contact{margin-top:32px;font-size:14px;color:var(--muted)}
        .quote-page .contact a{color:var(--ink)}
        @media (max-width:720px){
          .quote-page .send .btn{width:100%}
        }
      `}</style>

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span><span>Quote</span>
      </nav>

      <div className="page-h">
        <h1>Request a quote</h1>
      </div>

      <p className="intro">Paste your part numbers, one per line. We reply with a price on every line, including parts not listed online.</p>

      <form className="form" id="quoteForm" method="post" action="/api/quote" noValidate data-q={q}>
        <div>
          <label className="lbl" htmlFor="company">Company</label>
          <input className="field" id="company" name="company" type="text" autoComplete="organization" enterKeyHint="next" required />
          <p className="ferr" id="companyErr" hidden />
        </div>
        <div>
          <label className="lbl" htmlFor="contact">Contact name</label>
          <input className="field" id="contact" name="contact" type="text" autoComplete="name" enterKeyHint="next" required />
          <p className="ferr" id="contactErr" hidden />
        </div>
        <div>
          <label className="lbl" htmlFor="email">Email</label>
          <input className="field" id="email" name="email" type="email" autoComplete="email" inputMode="email" enterKeyHint="next" required />
          <p className="ferr" id="emailErr" hidden />
        </div>
        <div>
          <label className="lbl" htmlFor="phone">Phone (optional)</label>
          <input className="field" id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" enterKeyHint="next" />
        </div>
        <div className="full">
          <label className="lbl" htmlFor="machine">Machine (optional)</label>
          <input className="field" id="machine" name="machine" type="text" placeholder="Make and model, e.g. HP300" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" />
        </div>
        <div className="full">
          <label className="lbl" htmlFor="parts">Part numbers</label>
          <textarea className="field" id="parts" name="parts" required autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={"One per line, quantity after an x\n949647154300 x 2\n0116-0010 x 1"} aria-describedby="partsHint" />
          <p className="hint" id="partsHint">Parts you added to your quote list on this site appear here as well.</p>
          <p className="sync" id="partsSync" role="status" hidden />
          <p className="ferr" id="partsErr" hidden />
        </div>
        <div className="full">
          <label className="lbl" htmlFor="notes">Notes (optional)</label>
          <textarea className="field" id="notes" name="notes" placeholder="Delivery location, urgency, anything else we should know" />
        </div>
        <div className="full send">
          <button className="btn" id="quoteBtn" type="submit">Send quote request</button>
          <p className="msg full" id="quoteMsg" role="status" aria-live="polite"></p>
        </div>
      </form>

      <p className="contact">Prefer to talk. Call <a href={COMPANY.phoneHref}>{COMPANY.phone}</a> or email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.</p>

      <script dangerouslySetInnerHTML={{ __html: QUOTE_SCRIPT }} />
    </main>
  );
}
