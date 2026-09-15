// /search: ranked results for ?q= (architecture/storefront.md). Server component, one file per route.
// Paginated with ?page=, 24 per page. Phones (max-width 720px) get compact product rows.
import type { Metadata } from "next";
import { search, getMachines, formatPrice, stockLabel, type SearchHit, type Product } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Search" };

const PER_PAGE = 24;
const fmt = (n: number) => n.toLocaleString("en-AU");

function pageHref(q: string, page: number): string {
  const u = new URLSearchParams({ q });
  if (page > 1) u.set("page", String(page));
  return `/search?${u.toString()}`;
}

// The catalogue reason string is "Part number", "Also known as <codes>", "Machine <TOKEN>" or "Name".
// The title block cell gets the short label; the codes or token go on an attr line under the name.
function reasonLabel(reason: string): { label: string; detail: string | null } {
  if (reason.startsWith("Also known as ")) return { label: "Also known as", detail: reason.slice("Also known as ".length) };
  if (reason.startsWith("Machine ")) return { label: "Machine", detail: reason.slice("Machine ".length) + " appears in the part name" };
  return { label: reason, detail: null };
}

function stockClass(p: Product): string {
  if (p.stock_status === "in_stock") return "stock ok";
  if (p.stock_status === "low_stock") return "stock low";
  return "stock q";
}

// Same tile as app/parts/[...slug]/page.tsx, with the hit reason in the right title block cell.
function Tile({ hit }: { hit: SearchHit }) {
  const p = hit.product;
  const r = reasonLabel(hit.reason);
  return (
    <article className={p.image_path && p.image_w && p.image_h ? "cell prod" : "cell prod noimg"} role="listitem">
      {p.image_path && p.image_w && p.image_h ? (
        <div className="img">
          <img src={p.image_path} width={p.image_w} height={p.image_h} alt={p.name} loading="lazy" />
        </div>
      ) : (
        <div className="img type" aria-label={`No photo for ${p.sku}`}>
          <span className="pn">{p.sku}</span>
          <small>No photo yet</small>
        </div>
      )}
      <div className="pbody">
        <div className="tb">
          <span className="pn">{p.sku}</span>
          <span className="mc">{r.label}</span>
        </div>
        <h3 className="name"><a href={`/part/${p.slug}`}>{p.name}</a></h3>
        {r.detail ? <div className="attr">{r.detail}</div> : null}
        <div className="attr">{p.category_path.join(" / ")}</div>
        <div className="price"><span className="p">{formatPrice(p)}</span></div>
        <div className={stockClass(p)}><i aria-hidden="true"></i>{stockLabel(p)}</div>
        {p.image_path && p.image_w && p.image_h ? null : <span className="nph" aria-hidden="true">No photo</span>}
        <div className="act">
          <a className="btn ghost sm" href={`/part/${p.slug}`} aria-label={`View ${p.sku}, ${p.name}`}>View</a>
        </div>
      </div>
    </article>
  );
}

// Previous and Next with the current page between them. Used above and below the results.
function Pager({ q, page, pages, label }: { q: string; page: number; pages: number; label: string }) {
  return (
    <nav className="pager spager" aria-label={label}>
      {page > 1 ? <a href={pageHref(q, page - 1)} rel="prev">Previous</a> : <span aria-disabled="true">Previous</span>}
      <span className="of">Page {fmt(page)} of {fmt(pages)}</span>
      {page < pages ? <a href={pageHref(q, page + 1)} rel="next">Next</a> : <span aria-disabled="true">Next</span>}
    </nav>
  );
}

const CSS = `
.sp{padding-top:8px;padding-bottom:48px}
.sp .page-h{margin-top:32px}
.sp .page-h h1{min-width:0;max-width:100%;overflow-wrap:anywhere}
.sp .lead{font-size:16px;color:var(--ink);max-width:48ch}
.sp .models a.chip:hover{text-decoration:none}
.sp .nores{font-size:15px;color:var(--ink);background:var(--surface);border:1px solid var(--hair);padding:24px;margin-top:24px;display:flex;flex-direction:column;gap:16px;align-items:flex-start}
.sp .nores p{margin:0;max-width:60ch;overflow-wrap:anywhere}
.sp .tb .mc{white-space:nowrap}
.sp .range{font-family:var(--mono);font-size:13px;color:var(--muted);margin:0 0 12px;max-width:none}
.sp .spager .of{border:0;color:var(--muted)}
.sp .top .spager{margin:0 0 16px}
.sp .prod .pbody{display:contents}
.sp .prod .nph{display:none;align-items:center;height:22px;padding:0 6px;border:1px solid var(--hair);font-family:var(--mono);font-size:12px;color:var(--muted)}
@media (max-width:720px){
  .sp .spager a,.sp .spager span{min-width:44px;min-height:44px;height:auto}
  .sp .spager .of{flex:1}
  .sp .lattice{grid-template-columns:1fr}
  .sp .prod{display:grid;grid-template-columns:72px minmax(0,1fr);column-gap:12px;align-items:start;padding:12px 16px;min-height:44px}
  .sp .prod .img{grid-column:1;grid-row:1;width:72px;height:72px}
  .sp .prod .img img{max-width:100%;max-height:100%}
  .sp .prod .img.type{display:none}
  .sp .prod .pbody{grid-column:2;grid-row:1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;min-width:0}
  .sp .prod.noimg .pbody{grid-column:1/-1}
  .sp .prod .pbody>*{flex:1 1 100%;min-width:0}
  .sp .prod .pbody>.price,.sp .prod .pbody>.stock,.sp .prod .pbody>.nph{flex:0 1 auto}
  .sp .prod .nph{display:inline-flex}
  .sp .prod .tb{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px;height:auto;margin-top:0;border-top:0}
  .sp .prod .tb .pn{display:block;padding-right:0;overflow:visible;white-space:normal;overflow-wrap:anywhere;font-size:14px;font-weight:600}
  .sp .prod .tb .mc{display:block;border-left:0;padding-left:0;min-width:0;white-space:normal;overflow-wrap:anywhere}
  .sp .prod .name{display:block;overflow:visible;-webkit-line-clamp:unset;overflow-wrap:anywhere}
  .sp .prod .attr{overflow-wrap:anywhere}
  .sp .prod .name a::after{content:"";position:absolute;inset:0}
  .sp .prod .name a:focus-visible{outline:0}
  .sp .prod:focus-within{outline:2px solid var(--ink);outline-offset:-2px;z-index:1}
  .sp .prod .price{margin-top:0;padding-top:0}
  .sp .prod .price .p{font-size:14px}
  .sp .prod .act{display:none}
}
`;

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const rawQ = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (rawQ || "").trim();

  if (!q) {
    const machines = getMachines();
    return (
      <main className="frame sp">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="page-h"><h1>Search parts</h1></div>
        <p className="lead">Search by part number, machine model or keyword.</p>
        <div className="rule" style={{ marginTop: 32 }}><span className="eyebrow">Or pick a machine</span></div>
        <nav className="models" aria-label="Machine models">
          {machines.map((m) => (
            <a key={m.slug} className="chip" href={`/machines/${m.slug}`}>{m.model} <span className="c">· {m.product_count}</span></a>
          ))}
        </nav>
        <p className="note">Model names are taken from the part names. Independent supplier, OEM names are for reference only.</p>
      </main>
    );
  }

  const all = search(q, Number.MAX_SAFE_INTEGER);
  const count = all.length;
  const rawPage = parseInt((Array.isArray(sp.page) ? sp.page[0] : sp.page) || "", 10);
  const pages = Math.max(1, Math.ceil(count / PER_PAGE));
  const page = Math.min(Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1, pages);
  const start = (page - 1) * PER_PAGE;
  const hits = all.slice(start, start + PER_PAGE);

  return (
    <main className="frame sp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page-h">
        <h1>Results for {q}</h1>
        <span className="cnt">{fmt(count)} {count === 1 ? "part" : "parts"}</span>
      </div>
      {count === 0 ? (
        <div className="nores">
          <p>No parts match {q}. Check the part number, try the machine model, or send it to us in a quote request.</p>
          <a className="btn" href={`/quote?q=${encodeURIComponent(q)}`}>Request a quote</a>
        </div>
      ) : (
        <>
          <p className="range" aria-live="polite">Showing {fmt(start + 1)} to {fmt(start + hits.length)} of {fmt(count)}</p>
          {pages > 1 ? <div className="top"><Pager q={q} page={page} pages={pages} label="Pages, top of results" /></div> : null}
          <div className="lattice" role="list" aria-label={`Results for ${q}`}>
            {hits.map((h) => <Tile key={h.product.slug} hit={h} />)}
          </div>
          {pages > 1 ? <Pager q={q} page={page} pages={pages} label="Pages" /> : null}
        </>
      )}
    </main>
  );
}
