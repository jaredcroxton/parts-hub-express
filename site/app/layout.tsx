import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { COMPANY } from "@/lib/company";
import { getCategories } from "@/lib/catalogue";
import LOGO from "@/lib/logo-paths.json";

const inter = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-inter", display: "swap" });

// Absolute base for share images and canonical URLs. Set NEXT_PUBLIC_SITE_URL per environment (preview: the vercel.app domain;
// launch: https://partshubexpress.com). Never default to the real domain before it serves this site, or share cards break.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3105")).replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: COMPANY.brand, template: `%s · ${COMPANY.brand}` },
  description: "Crusher, screen and conveyor wear parts. Search by part number or machine model. Prices include GST.",
  // Share cards (DESIGN_CHARACTERISTICS 10.13): the image comes from app/opengraph-image.png and twitter-image.png. No og:title here,
  // because Next would copy it onto every page; iMessage and Facebook use each page's own <title> instead.
  openGraph: { siteName: COMPANY.brand, locale: "en_AU", type: "website" },
  twitter: { card: "summary_large_image" },
  // Not indexed until launch (SITE_LIVE=1 on the real domain): contacts are placeholders and some content awaits ACBG sign-off.
  ...(process.env.SITE_LIVE === "1" ? {} : { robots: { index: false, follow: false } }),
};

// Zoom stays unrestricted. viewportFit cover pairs with the safe-area padding in globals.css.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Header type-ahead, cart and quote counters. Plain script so the layout stays one server file.
const HEADER_SCRIPT = `
(function(){
  var q=document.getElementById('q'),ac=document.getElementById('ac'),t;
  function close(){ if(!ac) return; var inside=ac.contains(document.activeElement); ac.classList.remove('open'); ac.innerHTML=''; if(inside&&q) q.focus(); }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function run(){
    var v=q.value.trim(); if(v.length<2){close();return;}
    fetch('/api/suggest?q='+encodeURIComponent(v)).then(function(r){return r.json();}).then(function(d){
      if(q.value.trim()!==v) return;
      var groups={},order=[];
      d.forEach(function(s){ if(!groups[s.group]){groups[s.group]=[];order.push(s.group);} groups[s.group].push(s); });
      var html='';
      order.forEach(function(g){ html+='<h4>'+esc(g)+'</h4><ul>'; groups[g].forEach(function(s){ html+='<li><a href="'+esc(s.href)+'"><span><span class="mono">'+esc(s.label)+'</span>'+(s.sub?' &nbsp;'+esc(s.sub):'')+'</span></a></li>'; }); html+='</ul>'; });
      if(!html) html='<p class="empty">No match for "'+esc(v)+'". Press Enter to search all parts, or send it to us in a quote request.</p>';
      ac.innerHTML=html; ac.classList.add('open');
    }).catch(close);
  }
  if(q&&ac){
    if(location.pathname==='/search'){ try{ var cur=new URLSearchParams(location.search).get('q'); if(cur&&!q.value) q.value=cur; }catch(e){} }
    q.addEventListener('input',function(){clearTimeout(t);t=setTimeout(run,120);});
    q.addEventListener('focus',function(){ if(q.value.trim().length>=2) run(); });
    document.addEventListener('click',function(e){ if(!q.closest('form').contains(e.target)) close(); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
  }
  function count(key){ try{ var a=JSON.parse(localStorage.getItem(key)||'[]'); return a.reduce(function(n,x){return n+(x.qty||1);},0); }catch(e){ return 0; } }
  function items(n){ return n+(n===1?' item':' items'); }
  function set(id,n,label){ var el=document.getElementById(id+'Count'),ln=document.getElementById(id+'Link'); if(el) el.textContent=n; if(ln) ln.setAttribute('aria-label',label+', '+items(n)); }
  function refresh(){ set('cart',count('phx_cart'),'Cart'); set('quote',count('phx_quote'),'Quote list'); }
  refresh(); window.addEventListener('storage',refresh); window.addEventListener('phx:change',refresh);
  // iOS Safari only applies :active (the press feedback in globals.css) when a touch listener exists.
  document.addEventListener('touchstart',function(){},{passive:true});
  // Canvas colour follows the end of the page in view: black once the footer reaches the upper half of the screen, light otherwise.
  // Overscroll and the area behind Safari's bottom toolbar then match the black footer, while pulling down at the top stays light.
  var foot=document.querySelector('.foot');
  if(foot&&'IntersectionObserver' in window){
    new IntersectionObserver(function(es){ document.documentElement.classList.toggle('at-foot',es[es.length-1].isIntersecting); },{rootMargin:'0px 0px -50% 0px'}).observe(foot);
  }
})();`;

// Logo lockup (DESIGN_CHARACTERISTICS 10.14): callout P symbol plus the outlined wordmark. Ink follows currentColor, the square is Markout Orange.
// Masters and the build script live in design/brand/logo; lib/logo-paths.json is generated there.
function Logo() {
  const [dx, dy, dw, dh] = LOGO.symbol.dot;
  return (
    <svg className="logo" viewBox={LOGO.lockup.viewBox} width={LOGO.lockup.width} height={LOGO.lockup.height} aria-hidden="true" focusable="false">
      <path d={LOGO.symbol.frame} fill="currentColor" />
      <path d={LOGO.symbol.p} fill="currentColor" fillRule="evenodd" />
      <rect className="dot" x={dx} y={dy} width={dw} height={dh} />
      <path d={LOGO.lockup.wordmark} fill="currentColor" />
    </svg>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const groups = getCategories();
  return (
    <html lang="en-AU" className={inter.variable}>
      <body>
        <header className="hdr" id="hdr">
          <div className="main">
            <div className="frame">
              <a className="wordmark" href="/" aria-label={`${COMPANY.brand}, home`}><Logo /></a>
              <form className="search" role="search" action="/search" method="get" autoComplete="off">
                <div className="sbox">
                  <label className="sr" htmlFor="q">Search by part number, machine model or keyword</label>
                  <input id="q" name="q" type="search" placeholder="Part number or model" enterKeyHint="search" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
                  <button className="go" type="submit">Find</button>
                </div>
                <div className="ac" id="ac"></div>
              </form>
              <div className="r">
                <a href="/parts">Parts</a>
                <a href="/machines">Machines</a>
              </div>
              <div className="hdr-util">
                <a href="/quote" id="quoteLink" aria-label="Quote list, 0 items" suppressHydrationWarning>
                  <svg className="icon qicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3"/><rect x="9" y="2.5" width="6" height="3" rx="0.5"/><path d="M9 11h6M9 15h6"/></svg>
                  <span className="qtxt">Quote</span>
                  <span className="mono num" id="quoteCount" suppressHydrationWarning>0</span>
                </a>
                <a href="/cart" id="cartLink" aria-label="Cart, 0 items" suppressHydrationWarning>
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.5"/><circle cx="9.5" cy="20" r="1"/><circle cx="17.5" cy="20" r="1"/></svg>
                  <span className="mono num" id="cartCount" suppressHydrationWarning>0</span>
                </a>
              </div>
            </div>
          </div>
        </header>
        <div className="sheet">{children}</div>
        <footer className="foot">
          <div className="frame">
            <span className="wordmark" role="img" aria-label={COMPANY.brand}><Logo /></span>
            <div className="cols">
              <div>
                <h3>Contact</h3>
                <ul>
                  <li><a href={COMPANY.phoneHref}>{COMPANY.phone}</a></li>
                  <li><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
                  <li>{COMPANY.legalName}</li>
                  <li>{COMPANY.dispatch}</li>
                  <li>{COMPANY.hours}</li>
                </ul>
                <p className="small">All prices in AUD, GST inclusive</p>
              </div>
              <div>
                <h3>Parts</h3>
                <ul>
                  {groups.map((g) => (
                    <li key={g.slug}><a className="row" href={`/parts/${g.slug}`}><span>{g.name}</span><span className="cnt">{g.product_count.toLocaleString("en-AU")}</span></a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Machines</h3>
                <ul>
                  <li><a href="/machines">All machines</a></li>
                  <li><a href="/search">Search parts</a></li>
                </ul>
                <p className="small">Independent supplier. OEM names are for fitment reference only. Not an authorised dealer.</p>
              </div>
              <div>
                <h3>Buying</h3>
                <ul>
                  <li><a href="/trade">Trade account</a></li>
                  <li><a href="/quote">Request a quote</a></li>
                  <li><a href="/cart">Cart</a></li>
                  <li><a href="/terms">Terms</a></li>
                  <li><a href="/privacy">Privacy</a></li>
                </ul>
              </div>
            </div>
            <div className="bottom">
              <span>&copy; {new Date().getFullYear()} {COMPANY.legalName}</span>
              <span className="pay"><span>Visa</span><span>Mastercard</span><span>Amex</span><span>Bank transfer</span></span>
            </div>
            <p className="fn">Prices and stock shown are placeholders until the Odoo sync is live.</p>
          </div>
        </footer>
        <script dangerouslySetInnerHTML={{ __html: HEADER_SCRIPT }} />
      </body>
    </html>
  );
}
