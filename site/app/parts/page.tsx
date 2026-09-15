// /parts: the parts landing. 12 groups in a lattice, then the annotated crusher drawing (architecture/storefront.md).
// Group cards are plain containers: the heading links the group, each subcategory row links its own route.
// Phones get per-drawing category links and an Enlarge viewer, the same as the homepage.
import type { Metadata } from "next";
import { getActiveProducts, getCategories, resolveSku, type Category } from "@/lib/catalogue";
import { DRAW_SCRIPT, HIGHLIGHT_SCRIPT, ZOOM_SCRIPT, calloutInfo, getDrawings } from "@/lib/drawings";

export const metadata: Metadata = { title: "All parts" };

const nf = (n: number) => n.toLocaleString("en-AU");

const PAGE_CSS = `
.parts-page .fits{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;align-items:start}
.parts-page .fits .copy{grid-column:span 4}
.parts-page .fits .copy h2{font-size:28px;font-weight:700;margin-bottom:12px}
.parts-page .fits .copy p{font-size:15px;color:var(--ink);max-width:40ch}
.parts-page .fits .copy p+p{margin-top:12px}
.parts-page .fits .copy .note{margin-top:16px}
.parts-page .fits{margin-bottom:20px;align-items:end}
.parts-page .fits .dkey{grid-column:span 8}
.parts-page .fits .dkey .key{margin-top:0;grid-template-columns:repeat(3,1fr)}
.parts-page .cat .img img{width:auto;height:auto}
.parts-page .lattice .cell{color:var(--ink)}
.parts-page .cat h3 .gl::after{content:"";position:absolute;inset:0}
.parts-page .cat h3 .gl:focus-visible{outline:0}
.parts-page .cat:has(.gl:focus-visible){outline:2px solid var(--ink);outline-offset:-2px;z-index:1}
.parts-page .cat li{padding:0}
.parts-page .cat li a{position:relative;z-index:2;display:flex;justify-content:space-between;gap:12px;flex:1;min-width:0;padding:6px 0}
.parts-page .cat li a:hover{text-decoration:none}
.parts-page .cat li a:hover .nm{text-decoration:underline;text-underline-offset:3px}
@media (max-width:1024px){.parts-page .fits .copy,.parts-page .fits .dkey{grid-column:span 12}}
@media (max-width:720px){
  .parts-page .fits .dkey{display:none}
  .parts-page .cat h3 .gl::after{content:none}
  .parts-page .cat h3 .gl{text-decoration:underline;text-underline-offset:3px}
  .parts-page .cat li a{align-items:center;min-height:44px;padding:0;font-size:15px}
}
`;

export default function PartsPage() {
  const groups = getCategories();
  const total = getActiveProducts().length;
  const drawings = getDrawings();
  const calloutsInfo = calloutInfo();

  const topChildren = (g: Category) => [...g.children].sort((a, b) => b.product_count - a.product_count).slice(0, 3);

  return (
    <main className="parts-page">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="frame">
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Parts</span>
        </nav>
        <div className="page-h">
          <h1>All parts</h1>
          <span className="cnt">{nf(total)} parts in {groups.length} groups</span>
        </div>

        <div className="lattice">
          {groups.map((g) => {
            const hero = g.hero_sku ? resolveSku(g.hero_sku) : undefined;
            const photo = hero && hero.image_path && hero.image_w && hero.image_h ? hero : null;
            return (
              <div className="cell cat" key={g.slug}>
                {photo ? (
                  <div className="img">
                    <img src={photo.image_path!} width={photo.image_w!} height={photo.image_h!} alt="" loading="lazy" />
                  </div>
                ) : (
                  <div className="img type" aria-hidden="true">{nf(g.product_count)}</div>
                )}
                <h3><a className="gl" href={`/parts/${g.slug}`}>{g.name}</a></h3>
                <span className="cnt">{nf(g.product_count)} parts</span>
                {g.children.length > 0 && (
                  <ul aria-label={`Largest categories in ${g.name}`}>
                    {topChildren(g).map((c) => (
                      <li key={c.slug}><a href={`/parts/${c.slug}`}><span className="nm">{c.name}</span> <span className="cnt mono">{nf(c.product_count)}</span></a></li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <section className="sec deep" aria-labelledby="fitsTitle">
          <div className="rule"><span className="eyebrow">Where each part fits</span></div>
          <div className="fits">
            <div className="copy">
              <h2 id="fitsTitle">Where each part fits</h2>
              <p>Three crushers in section. The hatched parts are the wear parts we stock. Each number matches a part name. Pick a name to open that category.</p>
              <p className="note">Schematics, not to scale. Cheek plates line the side walls and are shown behind the jaws. Fitment to a specific machine is not listed, confirm with our team before ordering.</p>
            </div>
            <div className="dkey">
              <nav className="key" id="key" aria-label="Callout key">
                {calloutsInfo.map((c) => (
                  <a href={c.href} key={c.k} data-k={c.k}><span className="ksq">{String(c.k).padStart(2, "0")}</span><span className="name">{c.name}</span>{c.count != null && <span className="cnt">{nf(c.count)}</span>}</a>
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
                    <a href={c.href} key={c.k} data-k={c.k}><span className="ksq">{String(c.k).padStart(2, "0")}</span><span className="name">{c.name}</span>{c.count != null && <span className="cnt">{nf(c.count)}</span>}</a>
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
        </section>
      </div>
    </main>
  );
}
