// Product page. Contract: architecture/storefront.md (/part/[slug]). Data only through lib/catalogue.ts.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProduct, resolveSku, getCategoryProducts, getMachines, altCodes, formatPrice, stockLabel, type Product } from "@/lib/catalogue";
import { COMPANY } from "@/lib/company";

const SIBLINGS = 6;

function findBySlugOrCode(slug: string): { product?: Product; canonical?: string } {
  const direct = getProduct(slug);
  if (direct) return { product: direct };
  let byCode: Product | undefined;
  try { byCode = resolveSku(slug); } catch { byCode = undefined; }
  if (byCode) return { product: byCode, canonical: byCode.slug };
  return {};
}

function crumbTrail(p: Product): { name: string; href: string }[] {
  const segs = p.category_slug.split("/").filter(Boolean);
  return p.category_path.map((name, i) => ({ name, href: "/parts/" + segs.slice(0, i + 1).join("/") }));
}

export async function generateMetadata({ params }: PageProps<"/part/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { product } = findBySlugOrCode(slug);
  if (!product) return { title: "Part not found" };
  return {
    title: `${product.name} · ${product.sku}`,
    description: `${product.sku}, ${product.category_path.join(" / ")} from ${COMPANY.brand}. ${formatPrice(product)}.`,
  };
}

// Cart and quote list live in localStorage (phx_cart, phx_quote: [{sku, qty, name, slug}]).
// Static script, product facts come from data attributes React has already escaped.
// It must not change DOM attributes before hydration (React would report a mismatch), so quantity is clamped, never disabled.
// The only attribute changes (hidden, the bar's "on" class) follow a tap or a scroll past the main action.
const ACTION_SCRIPT = `
(function(){
  var root=document.getElementById('pp'); if(!root) return;
  var out=document.getElementById('ppQty'),dec=document.getElementById('ppDec'),inc=document.getElementById('ppInc'),msg=document.getElementById('ppMsg');
  var item={sku:root.getAttribute('data-sku'),name:root.getAttribute('data-name'),slug:root.getAttribute('data-slug')};
  var primary=root.getAttribute('data-primary');
  var bar=document.getElementById('ppBar'),barAct=document.getElementById('ppBarAct'),barNext=document.getElementById('ppBarNext');
  var qty=1;
  function show(){ out.textContent=String(qty); }
  dec.addEventListener('click',function(){ if(qty>1){qty--;show();} });
  inc.addEventListener('click',function(){ if(qty<999){qty++;show();} });
  function add(key){
    var list=[]; try{ list=JSON.parse(localStorage.getItem(key)||'[]'); if(!Array.isArray(list)) list=[]; }catch(e){ list=[]; }
    var hit=null; for(var i=0;i<list.length;i++){ if(list[i]&&list[i].sku===item.sku){hit=list[i];break;} }
    if(hit){ hit.qty=(Number(hit.qty)||0)+qty; hit.name=item.name; hit.slug=item.slug; }
    else list.push({sku:item.sku,qty:qty,name:item.name,slug:item.slug});
    try{ localStorage.setItem(key,JSON.stringify(list)); }catch(e){ msg.textContent='Could not save. Your browser is blocking site storage.'; return false; }
    window.dispatchEvent(new Event('phx:change'));
    return true;
  }
  function added(kind,nextId){
    var next=document.getElementById(nextId); if(next) next.hidden=false;
    if(kind===primary&&barAct&&barNext){
      var refocus=document.activeElement===barAct;
      barNext.hidden=false; barAct.hidden=true;
      if(refocus) barNext.focus();
    }
  }
  document.getElementById('ppCart').addEventListener('click',function(){
    if(!add('phx_cart')) return;
    msg.textContent='Added '+qty+' to your cart.';
    added('cart','ppViewCart');
  });
  document.getElementById('ppQuote').addEventListener('click',function(){
    if(!add('phx_quote')) return;
    msg.textContent='Added '+qty+' to your quote list.';
    added('quote','ppReview');
  });
  if(barAct) barAct.addEventListener('click',function(){ document.getElementById(primary==='cart'?'ppCart':'ppQuote').click(); });
  var buy=document.getElementById('ppBuy');
  if(bar&&buy&&'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      var e=entries[entries.length-1];
      var past=!e.isIntersecting&&e.boundingClientRect.top<0;
      if(past!==bar.classList.contains('on')) bar.classList.toggle('on',past);
    }).observe(buy);
  }
  show();
})();`;

// Desktop and tablet: photo plate on the left spanning the rows, text on the right, as before.
// 720px and below: one column in DOM order (identity, price and stock, action, fitment note, photo, specification).
const PAGE_CSS = `
.pp [hidden]{display:none!important}
.pp .grid{display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:auto auto auto auto 1fr;column-gap:32px;row-gap:0;margin-top:20px}
.pp .grid > *{min-width:0}
.pp .plate{grid-column:1 / span 5;grid-row:1 / span 5}
.pp .head{grid-column:6 / span 7;grid-row:1}
.pp .grid > dl{grid-column:6 / span 7;grid-row:2}
.pp .fit{grid-column:6 / span 7;grid-row:3}
.pp .act{grid-column:6 / span 7;grid-row:4}
.pp .sum,.pp .nophoto{display:none}
.pp .plate .img{border:1px solid var(--hair);min-height:360px;padding:32px}
.pp .plate .img.type{flex-direction:column;gap:8px;font-size:28px}
.pp .plate .img.type .pn{overflow-wrap:anywhere;text-align:center;min-width:0;max-width:100%}
.pp .plate .img.type small{font-family:var(--sans);font-size:13px;color:var(--muted);font-weight:400;letter-spacing:0}
.pp .plate .cap{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:8px;max-width:none}
.pp .sku{font-family:var(--mono);font-size:13px;font-variant-numeric:tabular-nums;color:var(--muted);letter-spacing:0.02em;overflow-wrap:anywhere;min-width:0}
.pp h1{font-size:32px;font-weight:700;margin-top:6px;overflow-wrap:anywhere;min-width:0}
.pp dl{margin:24px 0 0;border-top:1px solid var(--hair)}
.pp dl > div{display:grid;grid-template-columns:200px minmax(0,1fr);gap:16px;padding:10px 0;border-bottom:1px solid var(--hair);font-size:15px}
.pp dt{font-family:var(--mono);font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted);padding-top:3px}
.pp dd{margin:0;min-width:0;overflow-wrap:anywhere}
.pp dd.mono{font-size:14px}
.pp dd ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.pp .fit{font-size:14px;color:var(--ink);margin-top:16px;max-width:none}
.pp .buy{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:24px}
.pp .buy .qty{height:44px}
.pp .buy .qty button{width:44px}
.pp .buy .qty output{width:48px;font-size:14px}
.pp .msg{font-size:14px;color:var(--ok);margin-top:12px;min-height:21px;max-width:none}
.pp .next{display:flex;gap:0 12px;flex-wrap:wrap}
.pp .next a{margin-top:8px}
.pp .more{padding-top:48px}
.pp .more .rule .eyebrow{font-weight:500}
.pp .prod .img img{max-width:calc(100% - 32px);max-height:calc(100% - 32px)}
.pp .more .prod .pbody{display:contents}
.pp .more .prod .nph{display:none}
.pp-bar{display:none}
@media (max-width:820px){
  .pp .plate{grid-column:1 / -1;grid-row:1;margin-bottom:32px}
  .pp .head,.pp .grid > dl,.pp .fit,.pp .act{grid-column:1 / -1}
  .pp .head{grid-row:2}
  .pp .grid > dl{grid-row:3}
  .pp .fit{grid-row:4}
  .pp .act{grid-row:5}
  .pp .plate .img{min-height:280px;padding:24px}
}
@media (max-width:720px){
  .pp .grid{grid-template-columns:minmax(0,1fr);grid-template-rows:none}
  .pp .grid > *,.pp .grid > dl{grid-column:1 / -1;grid-row:auto}
  .pp .plate{margin:24px 0 0}
  .pp .sum{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 16px;margin-top:12px;max-width:none}
  .pp .sum .p{font-size:20px;font-weight:600}
  .pp .sum .s{font-size:14px;color:var(--muted)}
  .pp .grid > dl .ps{display:none}
  .pp .act{display:block}
  .pp .buy{margin-top:16px;width:100%}
  .pp .buy .qty + .btn{flex:1 1 0;min-width:0}
  .pp .buy .btn + .btn{flex:1 1 100%}
  .pp .next .btn{flex:1 1 100%}
  .pp .plate .img.type{display:none}
  .pp .nophoto{display:block;font-size:14px;color:var(--muted);padding:12px 0;border-top:1px solid var(--hair);border-bottom:1px solid var(--hair);max-width:none}
  .pp dd a:not(.chip){display:inline-flex;align-items:center;min-height:44px}
  .pp dd .chip{height:44px;padding:0 14px}
  .pp .more .rule .right{display:inline-flex;align-items:center;min-height:44px}
  .pp .more .lattice{grid-template-columns:1fr}
  .pp .more .prod{display:grid;grid-template-columns:72px minmax(0,1fr);column-gap:12px;align-items:start;padding:12px 16px}
  .pp .more .prod .img{grid-column:1;grid-row:1;width:72px;height:72px}
  .pp .more .prod .img img{max-width:100%;max-height:100%}
  .pp .more .prod .img.type{display:none}
  .pp .more .prod .pbody{grid-column:2;grid-row:1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;min-width:0}
  .pp .more .prod.noimg .pbody{grid-column:1 / -1}
  .pp .more .prod .pbody > *{flex:1 1 100%;min-width:0}
  .pp .more .prod .pbody > .price,.pp .more .prod .pbody > .stock,.pp .more .prod .pbody > .nph{flex:0 1 auto}
  .pp .more .prod .nph{display:inline-flex;align-items:center;height:22px;padding:0 6px;border:1px solid var(--hair);font-family:var(--mono);font-size:12px;color:var(--muted)}
  .pp .more .prod .tb{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px;margin-top:0;border-top:0}
  .pp .more .prod .tb .pn{display:block;padding:0;font-size:14px;font-weight:600}
  .pp .more .prod .tb .mc{display:block;border-left:0;padding-left:0;min-width:0}
  .pp .more .prod .tb .mc:empty{display:none}
  .pp .more .prod .price{margin-top:0;padding-top:0}
  .pp .more .prod .price .p{font-size:14px}
  .pp-bar{display:flex;gap:12px;position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--surface);border-top:1px solid var(--ink);padding:12px 16px calc(12px + env(safe-area-inset-bottom));transform:translateY(100%);visibility:hidden;transition:transform var(--t),visibility 0s linear 150ms}
  .pp-bar.on{transform:none;visibility:visible;transition:transform var(--t),visibility 0s}
  .pp-bar .btn{flex:1 1 0;min-width:0}
  .pp-bar .call{flex:0 0 auto;min-width:96px}
  body:has(.pp-bar) .foot .frame{padding-bottom:calc(24px + 69px + env(safe-area-inset-bottom))}
}
@media (max-width:480px){
  .pp h1{font-size:26px}
  .pp dl > div{grid-template-columns:1fr;gap:4px}
}
`;

export default async function PartPage({ params }: PageProps<"/part/[slug]">) {
  const { slug } = await params;
  const { product, canonical } = findBySlugOrCode(slug);
  if (!product) notFound();
  if (canonical && canonical !== slug) redirect(`/part/${canonical}`);

  const crumbs = crumbTrail(product);
  const leaf = product.category_path[product.category_path.length - 1] ?? "this category";
  const machines = getMachines();
  const machineLinks = product.machine_tokens.map((t) => ({ token: t, slug: machines.find((m) => m.model === t)?.slug ?? null }));
  const siblings = getCategoryProducts(product.category_slug).filter((p) => p.sku !== product.sku).slice(0, SIBLINGS);
  const weight = product.weight_kg == null ? "To confirm" : `${product.weight_kg.toLocaleString("en-AU")} kg`;
  const stockText = stockLabel(product);
  const alts = altCodes(product);
  const priceText = formatPrice(product);
  // No price yet means the quote is the main action; a priced part sells through the cart.
  const primary: "quote" | "cart" = product.price_aud_inc_gst == null ? "quote" : "cart";
  const quoteBtn = <button type="button" className={primary === "quote" ? "btn" : "btn ghost"} id="ppQuote" key="quote">Add to quote</button>;
  const cartBtn = <button type="button" className={primary === "cart" ? "btn" : "btn ghost"} id="ppCart" key="cart">Add to cart</button>;

  return (
    <main className="pp frame" id="pp" data-sku={product.sku} data-name={product.name} data-slug={product.slug} data-primary={primary}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/parts">Parts</a>
        {crumbs.map((c) => (
          <span key={c.href}>
            <span aria-hidden="true">/ </span>
            <a href={c.href}>{c.name}</a>
          </span>
        ))}
        <span><span aria-hidden="true">/ </span><span aria-current="page">{product.sku}</span></span>
      </nav>

      <div className="grid">
        <div className="head">
          <p className="sku">{product.sku}</p>
          <h1>{product.name}</h1>
        </div>

        <p className="sum">
          <span className="p mono">{priceText}</span>
          <span className="s">{stockText}</span>
        </p>

        <div className="act">
          <div className="buy" id="ppBuy">
            <div className="qty" role="group" aria-label="Quantity">
              <button type="button" id="ppDec" aria-label="Decrease quantity">&minus;</button>
              <output id="ppQty" aria-label="Quantity" aria-live="polite">1</output>
              <button type="button" id="ppInc" aria-label="Increase quantity">+</button>
            </div>
            {primary === "quote" ? [quoteBtn, cartBtn] : [cartBtn, quoteBtn]}
          </div>
          <p className="msg" id="ppMsg" role="status" aria-live="polite"></p>
          <div className="next">
            <a className={primary === "quote" ? "btn" : "btn ghost"} id="ppReview" href="/quote" hidden>Review quote</a>
            <a className={primary === "cart" ? "btn" : "btn ghost"} id="ppViewCart" href="/cart" hidden>View cart</a>
          </div>
        </div>

        <p className="fit">Fitment not listed. Confirm with our team before ordering.</p>

        <div className="plate">
          {product.image_path ? (
            <>
              <div className="img">
                <img src={product.image_path} width={product.image_w ?? undefined} height={product.image_h ?? undefined} alt={product.name} />
              </div>
              <p className="cap">Photo at catalogue size. Larger photos to come.</p>
            </>
          ) : (
            <>
              <div className="img type" role="img" aria-label={`No photo yet for ${product.sku}`}>
                <span className="pn">{product.sku}</span>
                <small>Photo to come</small>
              </div>
              <p className="nophoto">No photo yet</p>
            </>
          )}
        </div>

        <dl>
          <div>
            <dt>Category</dt>
            <dd><a href={crumbs[crumbs.length - 1]?.href ?? "/parts"}>{product.category_path.join(" / ")}</a></dd>
          </div>
          {alts.length > 0 && (
            <div>
              <dt>Also known as</dt>
              <dd className="mono">{alts.join(", ")}</dd>
            </div>
          )}
          {machineLinks.length > 0 && (
            <div>
              <dt>Appears in the part name</dt>
              <dd>
                <ul aria-label="Machine models named in this part">
                  {machineLinks.map((m) => (
                    <li key={m.token}>
                      {m.slug ? <a className="chip" href={`/machines/${m.slug}`}>{m.token}</a> : <span className="chip">{m.token}</span>}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {product.brand_tokens.length > 0 && (
            <div>
              <dt>Brand names in the part name</dt>
              <dd>{product.brand_tokens.join(", ")}</dd>
            </div>
          )}
          <div className="ps">
            <dt>Price</dt>
            <dd className="mono">{priceText}</dd>
          </div>
          <div className="ps">
            <dt>Stock</dt>
            <dd className="mono">{stockText}</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd className="mono">{weight}</dd>
          </div>
        </dl>
      </div>

      {siblings.length > 0 && (
        <section className="more" aria-labelledby="moreH">
          <div className="rule">
            <h2 className="eyebrow" id="moreH">More in {leaf}</h2>
            <a className="right" href={crumbs[crumbs.length - 1]?.href ?? "/parts"}>All {leaf} parts</a>
          </div>
          <div className="lattice three">
            {siblings.map((p) => (
              <a className={p.image_path ? "cell prod" : "cell prod noimg"} href={`/part/${p.slug}`} key={p.sku}>
                {p.image_path ? (
                  <div className="img"><img src={p.image_path} width={p.image_w ?? undefined} height={p.image_h ?? undefined} alt={p.name} loading="lazy" /></div>
                ) : (
                  <div className="img type" aria-hidden="true"><span className="pn">{p.sku}</span><small>Photo to come</small></div>
                )}
                <div className="pbody">
                  <div className="tb"><span className="pn">{p.sku}</span><span className="mc">{p.machine_tokens[0] ?? ""}</span></div>
                  <h3 className="name">{p.name}</h3>
                  <div className="price"><span className="p">{formatPrice(p)}</span></div>
                  <div className="stock q"><i aria-hidden="true"></i>{stockLabel(p)}</div>
                  {p.image_path ? null : <span className="nph" aria-hidden="true">No photo</span>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <aside className="pp-bar" id="ppBar" aria-label="Part actions">
        <button type="button" className="btn" id="ppBarAct">{primary === "quote" ? "Add to quote" : "Add to cart"}</button>
        <a className="btn" id="ppBarNext" href={primary === "quote" ? "/quote" : "/cart"} hidden>{primary === "quote" ? "Review quote" : "View cart"}</a>
        <a className="btn ghost call" href={COMPANY.phoneHref} aria-label={`Call ${COMPANY.phone}`}>Call</a>
      </aside>

      <script dangerouslySetInnerHTML={{ __html: ACTION_SCRIPT }} />
    </main>
  );
}
