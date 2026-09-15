import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMachines, type Machine } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Parts by machine",
  description: "Crusher and screen parts listed by machine model. Metso, Extec, Finlay, McCloskey, Kleemann and Sandvik models. Machine names are used for fitment reference only.",
};

// Type field values from machines.json to a readable label. Unknown stays honest.
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
function typeLabel(t: string): string {
  return TYPE_LABEL[t] ?? t;
}

const UNKNOWN_BRAND = "Make to confirm";

const CSS = `
.mx .brand-sec{padding-top:40px}
.mx .brand-sec:first-of-type{padding-top:0}
.mx .cell.mach{min-height:300px}
.mx .cell.mach .img{width:100%;height:200px;overflow:hidden}
.mx .cell.mach .img.photo img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;outline:0}
.mx .cell.mach .img.type{font-size:28px}
.mx .cell.mach h3{font-size:20px;font-weight:600;margin-top:8px}
.mx .cell.mach .meta{display:flex;justify-content:space-between;gap:12px;font-family:var(--mono);font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.mx .cell.mach .credit{font-size:11px;margin-top:auto;padding-top:8px;line-height:1.35}
.mx .disclaimer{margin-top:32px}
.mx .page-h h1{min-width:0;overflow-wrap:anywhere}
.mx .cell.mach .br{display:none}
@media (max-width:720px){
  .mx .lattice{grid-template-columns:1fr}
  .mx .cell.mach{min-height:0}
  .mx .cell.mach.noimg{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:2px 12px;min-height:44px;padding:12px 16px}
  .mx .cell.mach.noimg .img{display:none}
  .mx .cell.mach.noimg h3{grid-column:1;grid-row:1;margin:0;font-size:18px;overflow-wrap:anywhere}
  .mx .cell.mach.noimg .meta{display:contents}
  .mx .cell.mach.noimg .meta .t{grid-column:1 / -1;grid-row:2}
  .mx .cell.mach.noimg .meta .num{grid-column:2;grid-row:1;color:var(--ink)}
  .mx .cell.mach.noimg .br{display:inline}
}
`;

export default async function MachinesPage({ searchParams }: PageProps<"/machines">) {
  // Machine finder forms post ?model=<slug> here when JavaScript is off; send them straight to that model.
  const sp = await searchParams;
  const pick = Array.isArray(sp.model) ? sp.model[0] : sp.model;
  if (pick && getMachines().some((m) => m.slug === pick)) redirect(`/machines/${pick}`);
  const machines = getMachines();
  const byBrand = new Map<string, Machine[]>();
  for (const m of machines) {
    const list = byBrand.get(m.brand) ?? [];
    list.push(m);
    byBrand.set(m.brand, list);
  }
  const brands = [...byBrand.entries()]
    .map(([brand, list]) => ({ brand, list: [...list].sort((a, b) => b.product_count - a.product_count), total: list.reduce((n, m) => n + m.product_count, 0) }))
    .sort((a, b) => {
      if (a.brand === UNKNOWN_BRAND) return 1;
      if (b.brand === UNKNOWN_BRAND) return -1;
      return b.total - a.total || a.brand.localeCompare(b.brand);
    });
  const totalParts = machines.reduce((n, m) => n + m.product_count, 0);

  return (
    <main className="frame mx" style={{ paddingBottom: 48 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Machines</span>
      </nav>
      <div className="page-h">
        <h1>Parts by machine</h1>
        <span className="cnt">{machines.length} models, {totalParts.toLocaleString("en-AU")} parts</span>
      </div>

      {brands.map(({ brand, list, total }) => (
        <section className="brand-sec" key={brand} aria-labelledby={`brand-${slugify(brand)}`}>
          <div className="rule">
            <h2 className="eyebrow" id={`brand-${slugify(brand)}`}>{brand}</h2>
            <span className="right num">{total.toLocaleString("en-AU")} parts</span>
          </div>
          <div className="lattice">
            {list.map((m) => (
              <a className={m.image ? "cell mach" : "cell mach noimg"} href={`/machines/${m.slug}`} key={m.slug}>
                {m.image ? (
                  <div className="img photo">
                    <img src={m.image} alt={`${m.brand} ${m.model}`} loading="lazy" />
                  </div>
                ) : (
                  <div className="img type" aria-hidden="true">{m.model}</div>
                )}
                <h3>{m.model}</h3>
                <div className="meta">
                  <span className="t"><span className="br">{m.brand} · </span>{typeLabel(m.type)}</span>
                  <span className="num">{m.product_count} {m.product_count === 1 ? "part" : "parts"}</span>
                </div>
                {m.image && m.image_credit ? <p className="note credit">Photo: {m.image_credit}</p> : null}
              </a>
            ))}
          </div>
        </section>
      ))}

      <p className="note disclaimer">Independent supplier. Machine names are used for fitment reference only. Not an authorised dealer.</p>
    </main>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
