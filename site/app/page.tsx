// Homepage per design/DESIGN_CHARACTERISTICS.md 10.8: search hero and finder, machines strip, where each part fits,
// why Parts Hub Express, real reviews only, email signup. One file, server component, inline scripts for browser state.
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";
import { getActiveProducts, getCategories, getMachines, type Machine } from "@/lib/catalogue";
import { DRAW_SCRIPT, HIGHLIGHT_SCRIPT, ZOOM_SCRIPT, calloutInfo, getDrawings } from "@/lib/drawings";

// The homepage title and description are what a texted or shared link shows under the share image.
export const metadata: Metadata = {
  title: { absolute: `${COMPANY.brand} · Crusher, screen and conveyor parts` },
  description: `Find the right part for your machine. Search ${getActiveProducts().length.toLocaleString("en-AU")} crusher, screen and conveyor wear parts by part number or machine model.`,
};

const nf = (n: number) => n.toLocaleString("en-AU");
// Machine type images: unbranded illustrations generated for the client (Higgsfield nano_banana_pro), one per type, never per model.
const TYPE_IMAGE: Record<string, string> = { jaw: "/img/machines/type-jaw.jpg", cone: "/img/machines/type-cone.jpg", "mobile jaw": "/img/machines/type-mobile-jaw.jpg", "mobile impact": "/img/machines/type-mobile-impact.jpg" };
const TYPE_ORDER = ["jaw", "cone", "mobile jaw", "mobile impact"];
const TYPE_LABEL: Record<string, string> = { jaw: "Jaw crusher", cone: "Cone crusher", "mobile jaw": "Mobile jaw crusher", "mobile impact": "Mobile impact crusher", unknown: "Machine type to confirm" };
type Review = { name: string; company: string; quote: string; date?: string; sample?: boolean; rating?: number };

const CSS = `
.home .hero h1{margin-bottom:8px}
.home .hero h1 .uline{position:relative;white-space:nowrap}
.home .hero h1 .uline::after{content:"";position:absolute;left:0;right:0;bottom:.04em;height:max(3px,.075em);background:var(--accent);transform-origin:left center;animation:phx-underline 700ms var(--ease-settle) 350ms both}
@keyframes phx-underline{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.home .big{display:flex;gap:8px;align-items:stretch}
.home .big .field{height:56px;font-size:17px;padding:0 16px;caret-color:var(--accent)}
.home .big .field:focus{outline:none;box-shadow:4px 4px 0 0 var(--ink)}
.home .big .btn{height:56px;padding:0 24px;flex:none}
.home .finder{margin-top:32px}
.home .finder .row{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end}
.home .finder .f{min-width:0}
.home .finder .btn[aria-disabled="true"]{opacity:.5;cursor:not-allowed}
.home .finder .fhint{font-size:13px;color:var(--muted);margin-top:8px;max-width:none}
.home .hero .photo{padding-bottom:12px}
.home .hero .photo .cap{margin-top:12px;font-family:var(--mono);font-size:11px;letter-spacing:0.04em;text-transform:uppercase;color:var(--muted);max-width:none}
.home .browse{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.home .browse a{display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 18px 0 20px;border:1.5px solid var(--accent);border-radius:999px;background:var(--surface);color:var(--ink);font-size:15px;font-weight:600;text-decoration:none;transition:background var(--t),color var(--t),box-shadow var(--t),border-color var(--t),transform 220ms var(--ease-settle)}
.home .browse a svg{width:16px;height:16px;stroke:var(--accent);stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;transition:transform var(--t),stroke var(--t)}
.home .browse a:hover,.home .browse a:focus-visible{background:var(--accent-text);border-color:var(--accent-text);color:#ffffff;box-shadow:0 0 0 4px rgba(244,81,32,.22);outline:none;text-decoration:none}
.home .browse a:hover svg,.home .browse a:focus-visible svg{stroke:#ffffff;transform:translateX(2px)}
.home .browse a:active{transform:scale(.97);transition:transform var(--t-press) var(--ease-press)}
.home .hero{padding-bottom:64px}
@media (max-width:820px){.home .finder .row{grid-template-columns:1fr}.home .finder .btn{width:100%}}
@media (max-width:480px){.home .big{flex-direction:column}.home .big .btn{width:100%}}

.home .mtypes .mtype{gap:6px;padding-bottom:20px}
.home .mtype .img{width:100%;height:170px;overflow:hidden;margin-bottom:6px}
.home .mtype .img img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:cover;outline:1px solid var(--ink)}
.home .mtype h3{font-size:18px;font-weight:600;margin:0}
.home .mtype .cnt{font-family:var(--mono);font-size:13px;color:var(--muted);margin-bottom:8px}
.home .mtype .lbl{margin-bottom:2px}
.home .mtype .pick{display:grid;grid-template-columns:1fr;gap:8px}
.home .mtype .pick .btn{width:100%}
@media (max-width:1024px){.home .mtypes{grid-template-columns:repeat(2,1fr)}}
@media (max-width:480px){.home .mtypes{grid-template-columns:1fr}}
.home .fits{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;align-items:start}
.home .fits .copy{grid-column:span 4}
.home .fits .copy h2{font-size:28px;font-weight:700;margin-bottom:12px}
.home .fits .copy p{font-size:15px;max-width:40ch}
.home .fits .copy p+p{margin-top:12px}
.home .fits .copy .note{margin-top:16px}
.home .fits{margin-bottom:20px;align-items:end}
.home .fits .dkey{grid-column:span 8}
.home .fits .dkey .key{margin-top:0;grid-template-columns:repeat(3,1fr)}
.home .dark{background:var(--foot-bg);color:var(--foot-text);margin-top:72px;padding-block:56px 64px}
.home .dark .frame{border-color:var(--foot-rule)}
.home .dark .rule{height:auto;background:none;border-bottom:1px solid var(--foot-rule);padding-bottom:18px;margin-bottom:28px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.home .dark .rule .eyebrow,.home .dark .rule .right{position:static;transform:none;padding:0;background:none}
.home .dark .rule .eyebrow{font-family:var(--sans);font-size:clamp(30px,4.2vw,44px);font-weight:700;letter-spacing:-0.02em;line-height:1.05;text-transform:none;color:var(--accent)}
.home .dark .why{border-color:var(--foot-rule)}
.home .dark .why div{border-color:var(--foot-rule)}
.home .dark .why h3{color:var(--foot-text)}
.home .dark .why p{color:var(--foot-muted)}
.home .dark .whyrow .shot{background:#111111;border-color:var(--foot-rule)}
.home .dark .whyrow .shot img{outline-color:var(--foot-rule)}
.home .dark + .sec{padding-top:72px}
.home .reviewsband{margin-top:72px}
.home .reviewsband .rule .right{color:var(--foot-text);display:inline-flex;align-items:center;gap:8px;font-size:15px;padding-bottom:6px}
.home .reviewsband .rule .right b{font-weight:600}
.home .stars{display:inline-flex;gap:2px;vertical-align:middle}
.home .stars svg{width:16px;height:16px;fill:var(--foot-rule)}
.home .stars svg.on{fill:var(--accent)}
.home .reviewsband .reviews{gap:16px;margin-top:8px}
.home .reviewsband .reviews blockquote{border:1px solid var(--foot-rule);border-top:2px solid var(--accent);padding:24px;background:#0b0b0b;display:flex;flex-direction:column;gap:14px}
.home .reviewsband .reviews blockquote .stars{align-self:flex-start}
.home .reviewsband .reviews blockquote .stars svg{width:18px;height:18px}
.home .reviewsband .reviews blockquote p{color:var(--foot-text);font-size:18px;line-height:1.5}
.home .reviewsband .reviews cite{margin-top:auto;display:flex;flex-direction:column;gap:2px;font-style:normal;font-family:var(--sans);font-size:14px;letter-spacing:0;text-transform:none;color:var(--foot-muted)}
.home .reviewsband .reviews cite b{color:var(--foot-text);font-weight:600;font-size:15px}
.home .reviewsband + .connect{margin-top:0}
.home .whyrow{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;align-items:stretch}
.home .whyrow .why{grid-column:span 7}
.home .whyrow .shot{grid-column:span 5;background:var(--ground);border:1px solid var(--hair);padding:16px;display:flex;flex-direction:column}
.home .whyrow .shot img{width:100%;height:100%;object-fit:cover;outline:1px solid var(--ink)}
.home .whyrow .shot .cap{margin-top:12px;font-family:var(--mono);font-size:11px;letter-spacing:0.04em;text-transform:uppercase;color:var(--muted);max-width:none}
.home .why{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--hair);border-left:1px solid var(--hair)}
.home .why div{border-right:1px solid var(--hair);border-bottom:1px solid var(--hair);padding:20px 18px 24px}
.home .why h3{font-size:18px;font-weight:600;margin-bottom:8px;line-height:1.3}
.home .why p{font-size:14px;color:var(--ink);max-width:none}
.home .reviews{display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:24px}
.home .reviews blockquote{margin:0;padding:20px 0 0;border-top:1px solid var(--ink);font-size:16px;line-height:1.5}
.home .reviews blockquote p{max-width:none}
.home .reviews cite{display:block;margin-top:12px;font-style:normal;font-family:var(--mono);font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:var(--muted)}
.home .connect{margin-top:64px;background:var(--ground);border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)}
.home .connect .frame{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:32px;align-items:center;padding-top:40px;padding-bottom:40px}
.home .connect h2{font-size:26px;font-weight:700}
.home .connect p{font-size:15px;margin-top:8px}
.home .connect form{display:flex;gap:8px;align-items:stretch}
.home .connect .field{height:48px}
.home .connect .btn{height:48px;flex:none}
.home .connect .msg{font-size:13px;color:var(--muted);margin-top:8px;min-height:1.4em}
.home .connect .msg.ok{color:var(--ok)}.home .connect .msg.err{color:var(--low)}
@media (max-width:1024px){.home .fits .copy,.home .fits .dkey{grid-column:span 12}.home .whyrow .why,.home .whyrow .shot{grid-column:span 12}.home .reviews{grid-template-columns:1fr}}
/* Per-drawing links, Enlarge viewer and phone callouts live in globals.css (shared with /parts). */
@media (max-width:720px){.home .fits .dkey{display:none}}
@media (max-width:720px){.home .mtype .img{height:150px}.home .fits .dkey .key{grid-template-columns:1fr}.home .why{grid-template-columns:1fr}.home .connect .frame{grid-template-columns:1fr;gap:16px}.home .connect form{flex-direction:column}.home .connect .btn{width:100%}}
/* Phone rhythm: 32 to 40px between sections, no stacked padding plus margin. */
@media (max-width:720px){
.home .hero{padding-bottom:12px}
.home .sec.deep{padding-top:28px}
.home .dark{margin-top:36px;padding-block:36px}
.home .dark .rule{margin-bottom:20px}
.home .dark + .sec{padding-top:36px}
.home .reviewsband{margin-top:36px}
.home .connect{margin-top:36px}
.home .reviewsband + .connect{margin-top:0}
.home .connect .frame{padding-top:32px;padding-bottom:32px}
.home .whyrow .shot img{height:auto;aspect-ratio:1400/939}
}
`;

// Show parts needs a brand and a model. Restored form state (back navigation) rebuilds the model list and keeps a valid model.
const FINDER_SCRIPT = `
(function(){
  var b=document.getElementById('brand'),m=document.getElementById('model'),f=document.getElementById('finder');
  if(!b||!m||!f) return;
  var btn=f.querySelector('button[type=submit]'), hint=document.getElementById('finderHint'), KEY='phx_finder', built=null;
  var data={}; try{ data=JSON.parse(f.getAttribute('data-models')||'{}'); }catch(e){}
  function saved(){ try{ return JSON.parse(sessionStorage.getItem(KEY)||'null'); }catch(e){ return null; } }
  function save(){ try{ sessionStorage.setItem(KEY,JSON.stringify({brand:b.value,model:m.value})); }catch(e){} }
  function sync(){ var ok=!!m.value; if(btn) btn.setAttribute('aria-disabled',ok?'false':'true'); if(hint) hint.hidden=ok; }
  function apply(keep){
    var v=b.value; if(v&&!data[v]){ b.value=''; v=''; }
    var list=data[v]||[];
    while(m.options.length) m.remove(0);
    var ph=document.createElement('option'); ph.value=''; ph.textContent=v?'Select model':'Select brand first'; m.appendChild(ph);
    list.forEach(function(x){ var o=document.createElement('option'); o.value=x.slug; o.textContent=x.model+' ('+x.count+' parts)'; m.appendChild(o); });
    m.value=keep&&list.some(function(x){ return x.slug===keep; })?keep:'';
    m.disabled=!v; built=v; sync();
  }
  function restore(){
    if(built===b.value){ sync(); return; }
    var s=saved(); apply(s&&s.brand===b.value?s.model:'');
  }
  b.addEventListener('change',function(){ apply(''); save(); });
  m.addEventListener('change',function(){ sync(); save(); });
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(!m.value){ (b.value?m:b).focus(); return; }
    window.location.href='/machines/'+encodeURIComponent(m.value);
  });
  restore();
  window.addEventListener('load',restore);
  window.addEventListener('pageshow',restore);
})();`;

// Machine type tiles: choosing a model and pressing View parts opens /machines/<model>. Without JS the form posts to /machines?model=, which redirects there.
const TYPE_SCRIPT = `
(function(){
  document.querySelectorAll('form[data-machine-type]').forEach(function(f){
    f.addEventListener('submit',function(e){ var s=f.querySelector('select'); if(s&&s.value){ e.preventDefault(); window.location.href='/machines/'+encodeURIComponent(s.value); } });
  });
})();`;

const SUBSCRIBE_SCRIPT = `
(function(){
  var f=document.getElementById('subscribe'); if(!f) return;
  var e=f.querySelector('input[type=email]'), m=f.querySelector('.msg'), b=f.querySelector('button');
  f.addEventListener('submit',function(ev){
    ev.preventDefault(); m.className='msg'; m.textContent='Sending'; b.disabled=true;
    fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e.value})})
      .then(function(r){ return r.json().then(function(d){ return {ok:r.ok&&d.ok, error:d.error}; }); })
      .then(function(d){ if(d.ok){ m.className='msg ok'; m.textContent='You are on the list.'; e.value=''; } else { m.className='msg err'; m.textContent=d.error||'Could not subscribe. Try again.'; } })
      .catch(function(){ m.className='msg err'; m.textContent='Could not subscribe. Try again.'; })
      .then(function(){ b.disabled=false; });
  });
})();`;

// Section arrivals and star wipe (DESIGN_CHARACTERISTICS 10.12 moments 4 and 5, adapted from the HyperFrames waterfall-entry
// and stat-bars-and-fills rules). Only elements still below the fold at load are held, as paused Web Animations with no inline
// styles. Each group plays once as it reaches the viewport: a 16px rise with a fade; a review card and its stars form one group,
// the stars wiping 240ms after their card; the aggregate score wipes with the band's rule. Groups arriving together start 70ms
// apart. Owned animations are cancelled (static layout restored) when they finish, when focus moves inside a held group, before
// printing, and when reduced motion is switched on. Reduced motion at load, no IntersectionObserver or no Web Animations:
// nothing is held and nothing moves.
const MOTION_SCRIPT = `
(function(){
  var mq=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
  if((mq&&mq.matches)||!('IntersectionObserver' in window)||!Element.prototype.animate) return;
  var SETTLE='cubic-bezier(.215,.61,.355,1)', GENTLE='cubic-bezier(.25,.46,.45,.94)', vh=window.innerHeight, groups=new Map(), io=null;
  function below(el){ return el.getBoundingClientRect().top>vh; }
  function add(key,target,kf,dur,delay,ease){
    var a=target.animate(kf,{duration:dur,delay:delay,easing:ease,fill:'both'}); a.pause();
    var g=groups.get(key); if(!g){ g={items:[],running:false}; groups.set(key,g); } g.items.push({a:a,delay:delay});
  }
  function rise(el){ add(el,el,[{transform:'translateY(16px)'},{transform:'none'}],520,0,SETTLE); add(el,el,[{opacity:0},{opacity:1}],360,0,GENTLE); }
  function wipe(key,stars,delay){ add(key,stars,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],700,delay,GENTLE); }
  document.querySelectorAll('.home .mtypes .mtype, .home .why > div, .home .whyrow .shot').forEach(function(el){ if(below(el)) rise(el); });
  document.querySelectorAll('.home .reviewsband blockquote').forEach(function(card){
    if(!below(card)) return;
    rise(card); card.querySelectorAll('.stars').forEach(function(st){ wipe(card,st,240); });
  });
  var rule=document.querySelector('.home .reviewsband .rule');
  if(rule&&below(rule)) rule.querySelectorAll('.stars').forEach(function(st){ wipe(rule,st,120); });
  if(!groups.size) return;
  function release(key){ var g=groups.get(key); if(!g) return; groups.delete(key); if(io) io.unobserve(key); g.items.forEach(function(x){ x.a.cancel(); }); }
  function releaseAll(){ groups.forEach(function(_,key){ release(key); }); if(io){ io.disconnect(); io=null; } }
  function play(key,i){
    var g=groups.get(key); if(!g||g.running) return;
    g.running=true; if(io) io.unobserve(key);
    g.items.forEach(function(x){ x.a.effect.updateTiming({delay:x.delay+i*70}); x.a.play(); });
    Promise.all(g.items.map(function(x){ return x.a.finished; })).then(function(){ release(key); },function(){});
  }
  io=new IntersectionObserver(function(es){
    var hits=es.filter(function(e){ return e.isIntersecting&&groups.has(e.target); }).map(function(e){ return e.target; });
    hits.sort(function(a,b){ return a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1; });
    hits.forEach(play);
  });
  groups.forEach(function(_,key){ io.observe(key); });
  document.addEventListener('focusin',function(e){ groups.forEach(function(_,key){ if(key.contains(e.target)) release(key); }); });
  window.addEventListener('beforeprint',releaseAll);
  if(mq){ var onPref=function(e){ if(e.matches) releaseAll(); }; if(mq.addEventListener) mq.addEventListener('change',onPref); else if(mq.addListener) mq.addListener(onPref); }
})();`;

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="stars" role="img" aria-label={`Rated ${full} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" aria-hidden="true" className={i < full ? "on" : ""}><path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.6l-5 2.6.9-5.6-4-3.9 5.6-.8z" /></svg>
      ))}
    </span>
  );
}

function readReviews(): Review[] {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "reviews.json"), "utf8")) as Review[]; } catch { return []; }
}

export default function Home() {
  const groups = getCategories();
  const machines = getMachines();
  const totalParts = getActiveProducts().length;
  const heroExists = fs.existsSync(path.join(process.cwd(), "public", "img", "hero", "hero.jpg"));
  const dispatchExists = fs.existsSync(path.join(process.cwd(), "public", "img", "hero", "dispatch.jpg"));
  const showSamples = process.env.NEXT_PUBLIC_SHOW_SAMPLE_REVIEWS === "1";
  const reviews = readReviews().filter((r) => r.quote && r.name && (!r.sample || showSamples));
  const hasSample = reviews.some((r) => r.sample);
  const rated = reviews.filter((r) => typeof r.rating === "number");
  const avg = rated.length ? rated.reduce((t, r) => t + (r.rating as number), 0) / rated.length : 0;

  const byBrand = new Map<string, Machine[]>();
  for (const m of machines) byBrand.set(m.brand, [...(byBrand.get(m.brand) ?? []), m]);
  const brands = [...byBrand.keys()].sort((a, b) => (a === "Make to confirm" ? 1 : b === "Make to confirm" ? -1 : a.localeCompare(b)));
  const modelsOf = (brand: string) => [...(byBrand.get(brand) ?? [])].sort((a, b) => b.product_count - a.product_count);
  const n = nf;

  const unknownTypes = machines.filter((m) => !TYPE_ORDER.includes(m.type));
  const drawings = getDrawings();
  const calloutsInfo = calloutInfo();

  return (
    <main className="home">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="hero" aria-labelledby="heroTitle">
        <div className="frame">
          <div className="copy">
            <span className="eyebrow">Crusher, screen and conveyor wear parts</span>
            <h1 id="heroTitle">Find the right part for your <span className="uline">machine</span>.</h1>

            <form className="finder" id="finder" action="/machines" method="get" data-models={JSON.stringify(Object.fromEntries(brands.map((b) => [b, modelsOf(b).map((m) => ({ slug: m.slug, model: m.model, count: m.product_count }))])))}>
              <div className="row">
                <div className="f">
                  <label className="lbl" htmlFor="brand">Brand</label>
                  <select className="field" id="brand" name="brand">
                    <option value="">Select brand</option>
                    {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="f">
                  <label className="lbl" htmlFor="model">Machine model</label>
                  <select className="field" id="model" name="model" disabled>
                    <option value="">Select brand first</option>
                  </select>
                </div>
                <button className="btn" type="submit" aria-disabled="true" aria-describedby="finderHint">Show parts</button>
              </div>
              <p className="fhint" id="finderHint">Choose a brand and model</p>
            </form>
            <script dangerouslySetInnerHTML={{ __html: FINDER_SCRIPT }} />
            <nav className="browse" aria-label="Browse">
              <a href="/parts">Browse all parts<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg></a>
              <a href="/machines">Browse by machine<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg></a>
            </nav>
          </div>

          {heroExists && (
            <div className="photo">
              <img src="/img/hero/hero.jpg" srcSet="/img/hero/hero-750.jpg 750w, /img/hero/hero-1200.jpg 1200w, /img/hero/hero.jpg 1920w" sizes="(max-width:1024px) calc(100vw - 64px), (max-width:1280px) calc(50vw - 64px), 564px" width={1600} height={895} alt="A tracked mobile crushing plant working in a quarry, discharging crushed rock onto a stockpile." />
            </div>
          )}
        </div>
      </section>

      <section className="sec deep" aria-labelledby="machTitle">
        <div className="frame">
          <div className="rule"><span className="eyebrow" id="machTitle">Parts by machine</span><a className="right" href="/machines">All {machines.length} models</a></div>
          <div className="lattice mtypes">
            {TYPE_ORDER.map((t) => {
              const list = machines.filter((m) => m.type === t).sort((a, b) => b.product_count - a.product_count);
              if (!list.length) return null;
              const parts = list.reduce((sum, m) => sum + m.product_count, 0);
              const id = `mt-${t.replace(/\s+/g, "-")}`;
              return (
                <form className="cell mtype" key={t} action="/machines" method="get" data-machine-type>
                  <div className="img"><img src={TYPE_IMAGE[t]} srcSet={`${TYPE_IMAGE[t].replace(/\.jpg$/, "-600.jpg")} 600w, ${TYPE_IMAGE[t]} 1050w`} sizes="(max-width:480px) calc(100vw - 32px), (max-width:1024px) calc(50vw - 40px), 300px" width={1050} height={704} loading="lazy" alt={TYPE_LABEL[t]} /></div>
                  <h3>{TYPE_LABEL[t]}</h3>
                  <span className="cnt">{list.length} {list.length === 1 ? "model" : "models"} · {n(parts)} parts</span>
                  <label className="lbl" htmlFor={id}>Machine model</label>
                  <div className="pick">
                    <select className="field" id={id} name="model" required defaultValue="">
                      <option value="" disabled>Choose a model</option>
                      {list.map((m) => <option key={m.slug} value={m.slug}>{m.model} · {m.brand} · {n(m.product_count)} parts</option>)}
                    </select>
                    <button className="btn" type="submit">View parts</button>
                  </div>
                </form>
              );
            })}
          </div>
          {unknownTypes.length > 0 && (
            <p className="note">Also listed, make to confirm: {unknownTypes.map((m, i) => <span key={m.slug}>{i > 0 && ", "}<a href={`/machines/${m.slug}`}>{m.model} ({n(m.product_count)} parts)</a></span>)}. Model codes are read from part names. Confirm fitment with our team before ordering.</p>
          )}
        </div>
      </section>
      <script dangerouslySetInnerHTML={{ __html: TYPE_SCRIPT }} />

      <section className="dark" aria-labelledby="whyTitle">
        <div className="frame">
          <div className="rule"><span className="eyebrow" id="whyTitle">Why Parts Hub Express</span></div>
          <div className="whyrow">
          <div className="why">
            <div><h3>Search the number you already have</h3><p>Part numbers, old numbers and machine models all resolve. Hyphens and spaces do not matter.</p></div>
            <div><h3>{n(totalParts)} parts in one place</h3><p>Crusher, screen and conveyor wear parts across {groups.length} groups, from Australian stock.</p></div>
            <div><h3>Express dispatch</h3><p>Stocked parts leave the warehouse fast. Ask us for same day options on urgent breakdowns.</p></div>
            <div><h3>Trade accounts and quotes</h3><p>Order on account with your PO number, or paste a parts list and get every line priced.</p></div>
          </div>
          {dispatchExists && (
            <div className="shot">
              <img src="/img/hero/dispatch.jpg" srcSet="/img/hero/dispatch-700.jpg 700w, /img/hero/dispatch-1000.jpg 1000w, /img/hero/dispatch.jpg 1400w" sizes="(max-width:1024px) calc(100vw - 64px), (max-width:1280px) calc(42vw - 64px), 461px" width={1400} height={939} loading="lazy" alt="A forklift carries a wrapped casting on a pallet toward a truck at the warehouse door." />
            </div>
          )}
          </div>
        </div>
      </section>

      <section className="sec deep" aria-labelledby="fitsTitle">
        <div className="frame">
          <div className="rule"><span className="eyebrow">Where each part fits</span><a className="right" href="/parts">All {groups.length} part groups</a></div>
          <div className="fits">
            <div className="copy">
              <h2 id="fitsTitle">Where each part fits</h2>
              <p>Three crushers in section. The hatched parts are the wear parts we stock. Each number matches a part name. Pick a name to open that category.</p>
              <p className="note">Schematics, not to scale. Cheek plates line the side walls and are shown behind the jaws. Fitment to a specific machine is not listed, confirm with our team before ordering.</p>
            </div>
            <div className="dkey">
              <nav className="key" aria-label="Callout key">
                {calloutsInfo.map((c) => (
                  <a href={c.href} key={c.k} data-k={c.k}><span className="ksq">{String(c.k).padStart(2, "0")}</span><span className="name">{c.name}</span>{c.count != null && <span className="cnt">{n(c.count)}</span>}</a>
                ))}
              </nav>
            </div>
          </div>
          <div className="draw3">
            {drawings.map((d) => (
              <div className="dpanel" key={d.key}>
                <div className="dhead">
                  <h3>{d.title}</h3>
                  <button className="btn ghost dzbtn" type="button" data-zoom={`zoom-${d.key}`} aria-label={`Enlarge ${d.title.toLowerCase()} drawing`} hidden>Enlarge</button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: d.svg }} />
                <nav className="key dlinks" aria-label={`${d.title} parts`}>
                  {calloutsInfo.filter((c) => d.callouts.includes(c.k)).map((c) => (
                    <a href={c.href} key={c.k} data-k={c.k}><span className="ksq">{String(c.k).padStart(2, "0")}</span><span className="name">{c.name}</span>{c.count != null && <span className="cnt">{n(c.count)}</span>}</a>
                  ))}
                </nav>
                <dialog className="dzoom" id={`zoom-${d.key}`} aria-labelledby={`zoom-${d.key}-t`}>
                  <div className="zbar">
                    <h2 id={`zoom-${d.key}-t`}>{d.title}</h2>
                    <button className="btn" type="button" data-close>Close</button>
                  </div>
                  <div className="zbody" dangerouslySetInnerHTML={{ __html: d.svgZoom }} />
                </dialog>
              </div>
            ))}
          </div>
          <script dangerouslySetInnerHTML={{ __html: HIGHLIGHT_SCRIPT }} />
          <script dangerouslySetInnerHTML={{ __html: ZOOM_SCRIPT }} />
          <script dangerouslySetInnerHTML={{ __html: DRAW_SCRIPT }} />
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="dark reviewsband" aria-labelledby="revTitle">
          <div className="frame">
            <div className="rule"><span className="eyebrow" id="revTitle">Our clients say</span>{rated.length > 0 && <span className="right score"><Stars rating={avg} /> <b>{avg.toFixed(1)}</b> from {rated.length} {rated.length === 1 ? "review" : "reviews"}</span>}</div>
            <div className="reviews" style={{ ["--cols" as string]: Math.min(reviews.length, 3) } as React.CSSProperties}>
              {reviews.slice(0, 3).map((r, i) => (
                <blockquote key={i}>
                  {typeof r.rating === "number" && <Stars rating={r.rating} />}
                  <p>{r.quote}</p>
                  <cite><b>{r.company || r.name}</b>{r.company && r.name ? <span>{r.name}</span> : null}</cite>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="connect" aria-labelledby="connTitle">
        <div className="frame">
          <div>
            <h2 id="connTitle">Get connected with our exclusive email updates and sales</h2>
            <p>New stock, clearance lines and trade offers. No more than a few emails a month. Unsubscribe any time.</p>
          </div>
          <form id="subscribe" noValidate>
            <label className="sr" htmlFor="subEmail">Email address</label>
            <input className="field" id="subEmail" type="email" placeholder="Your email address" autoComplete="email" required />
            <button className="btn" type="submit">Subscribe</button>
            <p className="msg" aria-live="polite"></p>
          </form>
        </div>
      </section>
      <script dangerouslySetInnerHTML={{ __html: SUBSCRIBE_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
    </main>
  );
}
