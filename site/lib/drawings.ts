// Sectional drawings for "Where each part fits". SVG files live in data/drawings and are authored to the classes in globals.css.
// Callout hrefs in the files are placeholders (__HREF_N__) filled here from real category routes.
import fs from "node:fs";
import path from "node:path";
import { getCategory } from "@/lib/catalogue";

export const CALLOUTS: { k: number; slug: string }[] = [
  { k: 1, slug: "manganese/jaws" },
  { k: 2, slug: "manganese/cheek-plates" },
  { k: 3, slug: "manganese/concave-mantle" },
  { k: 4, slug: "manganese/wedges" },
  { k: 5, slug: "manganese/blow-bars" },
  { k: 6, slug: "manganese/impact-plates" },
];

export type CalloutInfo = { k: number; name: string; href: string; count: number | null };

export function calloutInfo(): CalloutInfo[] {
  return CALLOUTS.map(({ k, slug }) => {
    const c = getCategory(slug);
    return c ? { k, name: c.name, href: `/parts/${c.slug}`, count: c.product_count } : { k, name: slug.split("/").pop()!.replace(/-/g, " "), href: "/parts/manganese", count: null };
  });
}

/** svgZoom is the same drawing with ids suffixed "-z", for the full-screen enlarge dialog on the same page. */
export type Drawing = { key: "jaw" | "cone" | "impactor"; title: string; callouts: number[]; svg: string; svgZoom: string };

const META: { key: Drawing["key"]; title: string; callouts: number[] }[] = [
  { key: "jaw", title: "Jaw crusher", callouts: [1, 2, 4] },
  { key: "cone", title: "Cone crusher", callouts: [3] },
  { key: "impactor", title: "Impact crusher", callouts: [5, 6] },
];

export function getDrawings(): Drawing[] {
  const info = calloutInfo();
  return META.map((m) => {
    let svg = fs.readFileSync(path.join(process.cwd(), "data", "drawings", `${m.key}.svg`), "utf8");
    svg = svg.replace(/^<\?xml[^>]*>\s*/, "");
    svg = svg.replace(/id="hatch"/g, `id="hatch-${m.key}"`).replace(/url\(#hatch\)/g, `url(#hatch-${m.key})`);
    // Highlight overlay: an orange copy of each wear part sits under it, so the highlight crossfades (hatch out, orange in) instead of snapping.
    svg = svg.replace(/<polygon\b[^>]*\bclass="part(?: heavy)?"[^>]*\/>/g, (tag) => {
      const k = /\bdata-k="(\d+)"/.exec(tag)?.[1];
      const pts = /\bpoints="([^"]+)"/.exec(tag)?.[1];
      return k && pts ? `<polygon class="part-hl" data-hk="${k}" points="${pts}"/>${tag}` : tag;
    });
    for (const c of info) svg = svg.replace(new RegExp(`__HREF_${c.k}__`, "g"), c.href);
    svg = svg.replace(/<svg /, '<svg class="sch sch2" ');
    svg = svg.replace(/class="part heavy"/g, `class="part heavy" style="fill:url(#hatch-${m.key})"`).replace(/class="part"/g, `class="part" style="fill:url(#hatch-${m.key})"`);
    const svgZoom = svg
      .replace(/ id="([^"]+)"/g, ' id="$1-z"')
      .replace(/aria-labelledby="([^"]+)"/g, 'aria-labelledby="$1-z"')
      .replace(new RegExp(`url\\(#hatch-${m.key}\\)`, "g"), `url(#hatch-${m.key}-z)`);
    return { ...m, svg, svgZoom };
  });
}

/** Linked highlight: hovering or focusing a key row, a callout, or a wear part lights up all three for that number.
 * Touch: pointerdown on a key row or callout shows the highlight at once, so the tap itself shows it.
 * Phones (max-width 720px): callouts are too small to tap reliably, so a pointer tap on a callout or wear part only
 * highlights the matching 44px link under the drawing. Keyboard activation (click detail 0) still follows the link. */
export const HIGHLIGHT_SCRIPT = `
(function(){
  document.querySelectorAll('.draw3').forEach(function(d){
    var sec=d.closest('section')||d.parentElement, hrefs={};
    var phone=window.matchMedia?window.matchMedia('(max-width:720px)'):null;
    function illustrative(e){ return phone&&phone.matches&&e.detail!==0; }
    sec.querySelectorAll('.key a[data-k]').forEach(function(a){ hrefs[a.getAttribute('data-k')]=a.getAttribute('href'); });
    function on(k){ sec.setAttribute('data-hl',k); }
    function off(){ sec.removeAttribute('data-hl'); }
    sec.querySelectorAll('.key a[data-k], .sch2 [data-k]').forEach(function(el){
      var k=el.getAttribute('data-k');
      el.addEventListener('mouseenter',function(){ on(k); });
      el.addEventListener('mouseleave',off);
      el.addEventListener('pointerdown',function(){ on(k); });
      el.addEventListener('focus',function(){ on(k); });
      el.addEventListener('blur',off);
      var tag=el.tagName.toLowerCase(), inDrawing=!!el.closest('.sch2');
      if(tag==='polygon'){ el.addEventListener('click',function(e){ if(illustrative(e)){ on(k); return; } if(hrefs[k]) window.location.href=hrefs[k]; }); }
      else if(tag==='a'&&inDrawing){ el.addEventListener('click',function(e){ if(illustrative(e)){ e.preventDefault(); on(k); } }); }
    });
  });
})();`;

/** Drawings plot themselves once (DESIGN_CHARACTERISTICS 10.12 moment 3, adapted from the HyperFrames svg-path-draw rule).
 * Only panels still below the fold at load are held, as paused Web Animations with no inline styles. As a panel reaches the
 * viewport its outlines draw like a plotter pass, hatching and labels fade in from 60 percent, leaders draw, then the callout
 * marks appear; panels arriving together start 120ms apart. Every owned animation is cancelled (static drawing restored) when
 * it finishes, when the reader points at, taps or focuses anything in that drawing section (so the linked highlight is never
 * masked), when the viewport width changes mid-draw, before printing, and when reduced motion is switched on.
 * Dash lengths: held with a generous length, then measured from the rendered size just before playback. Under
 * vector-effect non-scaling-stroke the dash space depends on the engine, so the length covers both user and screen space.
 * Reduced motion at load, no IntersectionObserver or no Web Animations: nothing is held and nothing moves. */
export const DRAW_SCRIPT = `
(function(){
  var mq=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)');
  if((mq&&mq.matches)||!('IntersectionObserver' in window)||!Element.prototype.animate) return;
  var GENTLE='cubic-bezier(.25,.46,.45,.94)', SETTLE='cubic-bezier(.215,.61,.355,1)', vh=window.innerHeight, vw=window.innerWidth, panels=new Map(), io=null;
  function scale(svg){ var m=svg.getScreenCTM(); return m?Math.abs(m.a):1; }
  function dash(L){ return [{strokeDasharray:L+' '+L,strokeDashoffset:L},{strokeDasharray:L+' '+L,strokeDashoffset:0}]; }
  function arm(p){
    var svg=p.querySelector(':scope > div > svg.sch2'); if(!svg) return null;
    var k=scale(svg), items=[];
    function each(sel,fn){ [].forEach.call(svg.querySelectorAll(sel),fn); }
    function add(el,kf,dur,delay,ease,len){ var a=el.animate(kf,{duration:dur,delay:delay,easing:ease,fill:'both'}); a.pause(); items.push({a:a,delay:delay,len:len}); }
    function draw(el,dur,delay){ if(typeof el.getTotalLength!=='function') return; var len=el.getTotalLength(); add(el,dash(Math.ceil(len*Math.max(3,k))+2),dur,delay,GENTLE,len); }
    each('.thin,.heavy,.part',function(el){ draw(el,900,0); });
    each('.part',function(el){ add(el,[{fillOpacity:0},{fillOpacity:1}],360,540,GENTLE); });
    each('.dash,.dot,.lab,.cap',function(el){ add(el,[{opacity:0},{opacity:1}],360,540,GENTLE); });
    each('.lead',function(el){ draw(el,300,700); });
    each('.sq,.n',function(el){ add(el,[{opacity:0},{opacity:1}],240,900,SETTLE); });
    return items.length?{svg:svg,items:items,running:false}:null;
  }
  function release(p){ var d=panels.get(p); if(!d) return; panels.delete(p); if(io) io.unobserve(p); d.items.forEach(function(x){ x.a.cancel(); }); }
  function releaseAll(){ panels.forEach(function(_,p){ release(p); }); if(io){ io.disconnect(); io=null; } }
  function play(p,i){
    var d=panels.get(p); if(!d||d.running) return;
    d.running=true; if(io) io.unobserve(p);
    var k=Math.max(1,scale(d.svg));
    d.items.forEach(function(x){
      if(x.len!=null) x.a.effect.setKeyframes(dash(Math.ceil(x.len*k)+2));
      x.a.effect.updateTiming({delay:x.delay+i*120}); x.a.play();
    });
    Promise.all(d.items.map(function(x){ return x.a.finished; })).then(function(){ release(p); },function(){});
  }
  document.querySelectorAll('.draw3 .dpanel').forEach(function(p){ if(p.getBoundingClientRect().top>vh){ var d=arm(p); if(d) panels.set(p,d); } });
  if(!panels.size) return;
  io=new IntersectionObserver(function(es){
    var hits=es.filter(function(e){ return e.isIntersecting&&panels.has(e.target); }).map(function(e){ return e.target; });
    hits.sort(function(a,b){ return a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1; });
    hits.forEach(play);
  });
  panels.forEach(function(_,p){ io.observe(p); });
  var sections=[];
  panels.forEach(function(_,p){ var s=p.closest('section')||p.parentElement; if(sections.indexOf(s)<0) sections.push(s); });
  sections.forEach(function(s){
    function rel(){ panels.forEach(function(_,p){ if(s.contains(p)) release(p); }); }
    s.querySelectorAll('.key a[data-k], .sch2 [data-k]').forEach(function(el){ el.addEventListener('mouseenter',rel); el.addEventListener('pointerdown',rel); });
    s.addEventListener('focusin',rel);
  });
  window.addEventListener('resize',function(){ if(window.innerWidth===vw) return; vw=window.innerWidth; panels.forEach(function(d,p){ if(d.running) release(p); }); });
  window.addEventListener('beforeprint',releaseAll);
  if(mq){ var onPref=function(e){ if(e.matches) releaseAll(); }; if(mq.addEventListener) mq.addEventListener('change',onPref); else if(mq.addListener) mq.addListener(onPref); }
})();`;

/** Enlarge drawing: each [data-zoom] button opens its full-screen dialog. Escape closes natively; buttons stay hidden without JS. */
export const ZOOM_SCRIPT = `
(function(){
  document.querySelectorAll('[data-zoom]').forEach(function(btn){
    var d=document.getElementById(btn.getAttribute('data-zoom'));
    if(!d||typeof d.showModal!=='function') return;
    btn.hidden=false;
    btn.addEventListener('click',function(){ d.showModal(); var bd=d.querySelector('.zbody'); if(bd){ bd.scrollLeft=0; bd.scrollTop=0; } });
    d.querySelectorAll('[data-close]').forEach(function(c){ c.addEventListener('click',function(){ d.close(); btn.focus(); }); });
    d.addEventListener('click',function(e){ if(e.target===d) d.close(); });
  });
})();`;
