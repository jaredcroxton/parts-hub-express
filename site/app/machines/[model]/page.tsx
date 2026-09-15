import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMachines, getMachine, getMachineProducts, getCategories, formatPrice, stockLabel, type Product } from "@/lib/catalogue";

const PER_GROUP = 24;
// Phones (max-width 720px) show the first PHONE_GROUP parts per group as compact rows, with a See all link.
const PHONE_GROUP = 6;

// Same mapping as app/machines/page.tsx. Kept inline so each route stays one file.
const TYPE_LABEL: Record<string, string> = {
  cone: "Cone crusher",
  jaw: "Jaw crusher",
  "mobile jaw": "Mobile jaw crusher",
  "mobile impact": "Mobile impact crusher",
  "mobile cone": "Mobile cone crusher",
  impact: "Impact crusher",
  screen: "Screen",
  unknown: "Type to confirm",
};
const typeLabel = (t: string) => TYPE_LABEL[t] ?? t;

export function generateStaticParams() {
  return getMachines().map((m) => ({ model: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/machines/[model]">): Promise<Metadata> {
  const { model } = await params;
  const m = getMachine(model);
  if (!m) return { title: "Machine not found" };
  const count = getMachineProducts(m.model).length;
  return {
    title: `${m.model} parts`,
    description: `${count} parts whose part name includes ${m.model} (${m.brand}, ${typeLabel(m.type).toLowerCase()}). Machine names are used for fitment reference only.`,
  };
}

const CSS = `
.mp .photo-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start;margin-bottom:32px}
.mp .photo-row .img{width:100%;height:260px;overflow:hidden}
.mp .photo-row .img img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;outline:0}
.mp .photo-row .credit{font-size:11px;margin-top:8px}
.mp .photo-row .about{display:flex;flex-direction:column;gap:12px;padding-top:4px}
.mp .photo-row .about p{font-size:15px}
.mp .grp{padding-top:40px}
.mp .grp:first-of-type{padding-top:0}
.mp .grp h2{font-size:22px;font-weight:600;letter-spacing:-0.02em}
.mp .grp h2 .cnt{font-family:var(--mono);font-size:14px;color:var(--muted);font-weight:400;margin-left:12px;font-variant-numeric:tabular-nums}
.mp .grp .gh{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.mp .grp .more{font-size:14px;font-weight:500}
.mp .prod .name a{display:block}
.mp .prod .name a:hover{text-decoration:underline;text-underline-offset:3px}
.mp .prod .img img{max-width:calc(100% - 32px);max-height:calc(100% - 32px)}
.mp .empty{padding:32px 0;color:var(--muted);font-size:15px}
@media (max-width:720px){.mp .photo-row{grid-template-columns:1fr}.mp .photo-row .img{height:200px}}
.mp .page-h h1{min-width:0;max-width:100%;overflow-wrap:anywhere}
.mp .prod .pbody{display:contents}
.mp .prod .nph{display:none;align-items:center;height:22px;padding:0 6px;border:1px solid var(--hair);font-family:var(--mono);font-size:12px;color:var(--muted)}
.mp .mob{display:none}
@media (max-width:720px){
  .mp .dsk{display:none!important}
  .mp .photo-row{margin-bottom:24px}
  .mp .jump{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 32px}
  .mp .jump a{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 12px;border:1px solid var(--ink);background:var(--surface);font-family:var(--mono);font-size:13px}
  .mp .jump a .c{color:var(--muted)}
  .mp .grp{scroll-margin-top:140px}
  .mp .grp .gh{margin-bottom:12px}
  .mp .grp h2{overflow-wrap:anywhere}
  .mp .seeall{display:flex;align-items:center;min-height:44px;margin-top:8px;font-size:15px;font-weight:600;text-decoration:underline;text-underline-offset:3px}
  .mp .lattice{grid-template-columns:1fr}
  .mp .prod.p6{display:none}
  .mp .prod{display:grid;grid-template-columns:72px minmax(0,1fr);column-gap:12px;align-items:start;padding:12px 16px;min-height:44px}
  .mp .prod .img{grid-column:1;grid-row:1;width:72px;height:72px}
  .mp .prod .img img{max-width:100%;max-height:100%}
  .mp .prod .img.type{display:none}
  .mp .prod .pbody{grid-column:2;grid-row:1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;min-width:0}
  .mp .prod.noimg .pbody{grid-column:1/-1}
  .mp .prod .pbody>*{flex:1 1 100%;min-width:0}
  .mp .prod .pbody>.price,.mp .prod .pbody>.stock,.mp .prod .pbody>.nph{flex:0 1 auto}
  .mp .prod .nph{display:inline-flex}
  .mp .prod .tb{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px;height:auto;margin-top:0;border-top:0}
  .mp .prod .tb .pn{display:block;padding-right:0;overflow:visible;white-space:normal;overflow-wrap:anywhere;font-size:14px;font-weight:600}
  .mp .prod .tb .mc{display:block;border-left:0;padding-left:0;min-width:0;overflow-wrap:anywhere}
  .mp .prod .name{display:block;overflow:visible;-webkit-line-clamp:unset;overflow-wrap:anywhere}
  .mp .prod .name a::after{content:"";position:absolute;inset:0}
  .mp .prod .name a:focus-visible{outline:0}
  .mp .prod:focus-within{outline:2px solid var(--ink);outline-offset:-2px;z-index:1}
  .mp .prod .price{margin-top:0;padding-top:0}
  .mp .prod .price .p{font-size:14px}
}
`;

export default async function MachinePage({ params }: PageProps<"/machines/[model]">) {
  const { model } = await params;
  const m = getMachine(model);
  if (!m) notFound();

  const products = getMachineProducts(m.model);
  const topSlugByName = new Map(getCategories().map((c) => [c.name, c.slug]));

  const groups = new Map<string, Product[]>();
  for (const p of products) {
    const g = p.category_path[0] ?? "Other";
    const list = groups.get(g) ?? [];
    list.push(p);
    groups.set(g, list);
  }
  const ordered = [...groups.entries()]
    .map(([name, list]) => ({ name, slug: topSlugByName.get(name) ?? list[0].category_slug.split("/")[0], list: [...list].sort((a, b) => a.sku.localeCompare(b.sku)) }))
    .sort((a, b) => b.list.length - a.list.length || a.name.localeCompare(b.name));

  const machineQuery = `?machine=${encodeURIComponent(m.model)}`;

  return (
    <main className="frame mp" style={{ paddingBottom: 48 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span>
        <a href="/machines">Machines</a><span aria-hidden="true">/</span>
        <span aria-current="page">{m.model}</span>
      </nav>
      <div className="page-h">
        <h1>{m.model} parts</h1>
        <span className="cnt">{products.length} {products.length === 1 ? "part" : "parts"}</span>
      </div>

      <div className="photo-row">
        {m.image ? (
          <div>
            <div className="img">
              <img src={m.image} alt={`${m.brand} ${m.model}`} />
            </div>
            {m.image_credit ? <p className="note credit">Photo: {m.image_credit}</p> : null}
          </div>
        ) : null}
        <div className="about">
          <p className="eyebrow">{m.brand} · {typeLabel(m.type)}</p>
          <p>These parts carry {m.model} in the part name. Fitment is not listed on this site, so confirm with our team before ordering.</p>
          <p className="note" style={{ marginTop: 0 }}>Independent supplier. Machine names are used for fitment reference only. Not an authorised dealer.</p>
        </div>
      </div>

      {ordered.length > 1 ? (
        <nav className="jump mob" aria-label="Part groups">
          {ordered.map((g) => (
            <a key={g.slug} href={`#g-${g.slug}`}>{g.name} <span className="c">· {g.list.length}</span></a>
          ))}
        </nav>
      ) : null}

      {ordered.length === 0 ? (
        <p className="empty">No parts are listed for {m.model} yet. Send us the part number and we will quote it.</p>
      ) : null}

      {ordered.map((g) => {
        const shown = g.list.slice(0, PER_GROUP);
        const truncated = g.list.length > PER_GROUP;
        return (
          <section className="grp" key={g.slug} id={`g-${g.slug}`} aria-labelledby={`grp-${g.slug}`}>
            <div className="gh">
              <h2 id={`grp-${g.slug}`}>{g.name}<span className="cnt">{g.list.length}</span></h2>
              {truncated ? (
                <a className="more dsk" href={`/parts/${g.slug}${machineQuery}`}>See all {g.list.length} in {g.name}</a>
              ) : null}
            </div>
            <div className="lattice">
              {shown.map((p, i) => (
                <article className={`cell prod${p.image_path ? "" : " noimg"}${i >= PHONE_GROUP ? " p6" : ""}`} key={p.slug}>
                  {p.image_path ? (
                    <div className="img">
                      <img src={p.image_path} width={p.image_w ?? undefined} height={p.image_h ?? undefined} alt={p.name} loading="lazy" />
                    </div>
                  ) : (
                    <div className="img type" aria-hidden="true">
                      <span className="pn">{p.sku}</span>
                      <small>No photo yet</small>
                    </div>
                  )}
                  <div className="pbody">
                    <div className="tb"><span className="pn">{p.sku}</span><span className="mc">{m.model}</span></div>
                    <h3 className="name"><a href={`/part/${p.slug}`}>{p.name}</a></h3>
                    <div className="attr">Appears in the part name</div>
                    <div className="price"><span className="p">{formatPrice(p)}</span></div>
                    <div className="stock q"><i aria-hidden="true"></i>{stockLabel(p)}</div>
                    {p.image_path ? null : <span className="nph" aria-hidden="true">No photo</span>}
                  </div>
                </article>
              ))}
            </div>
            {g.list.length > PHONE_GROUP ? (
              <a className="seeall mob" href={`/parts/${g.slug}${machineQuery}`}>See all {g.list.length} in {g.name}</a>
            ) : null}
            {truncated ? (
              <p className="note dsk">Showing the first {PER_GROUP} of {g.list.length}. <a href={`/parts/${g.slug}${machineQuery}`}>See all in {g.name}</a>.</p>
            ) : null}
          </section>
        );
      })}
    </main>
  );
}
