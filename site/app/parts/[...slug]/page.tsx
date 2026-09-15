// Category listing for any depth: /parts/<group>[/<sub>[/<leaf>]].
// Data only through lib/catalogue.ts (architecture/storefront.md). Filters and paging come from the query string,
// so the page renders on the server with no browser state. 24 products per page.
// Phones (max-width 720px): compact product rows, filters behind a disclosure, Previous, Page X of Y and Next above and below results.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategory, getCategoryProducts, formatPrice, stockLabel, type Product } from "@/lib/catalogue";

const PER_PAGE = 24;
const MAX_CHIPS = 12;

type Query = { machine: string; photo: boolean; sort: "sku" | "name"; page: number };

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] || "" : v || "";
}

function readQuery(sp: Record<string, string | string[] | undefined>): Query {
  const page = parseInt(first(sp.page), 10);
  return {
    machine: first(sp.machine).trim(),
    photo: first(sp.photo) === "1",
    sort: first(sp.sort) === "name" ? "name" : "sku",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Build a href for this category with some params changed. Empty or default values drop out of the URL.
function link(base: string, q: Query, patch: Partial<Query>): string {
  const n = { ...q, ...patch };
  const u = new URLSearchParams();
  if (n.machine) u.set("machine", n.machine);
  if (n.photo) u.set("photo", "1");
  if (n.sort !== "sku") u.set("sort", n.sort);
  if (n.page > 1) u.set("page", String(n.page));
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}

function stockClass(p: Product): string {
  if (p.stock_status === "in_stock") return "stock ok";
  if (p.stock_status === "low_stock") return "stock low";
  return "stock q";
}

const fmt = (n: number) => n.toLocaleString("en-AU");

export async function generateStaticParams() {
  // The 12 top groups prerender. Deeper categories render on demand.
  return getCategories().map((c) => ({ slug: [c.slug] }));
}

export async function generateMetadata(props: PageProps<"/parts/[...slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const cat = getCategory(slug.join("/"));
  if (!cat) return { title: "Category not found" };
  return {
    title: cat.name,
    description: `${fmt(cat.product_count)} ${cat.path.join(" ")} parts. Search by part number or machine model. Prices include GST.`,
  };
}

export default async function CategoryPage(props: PageProps<"/parts/[...slug]">) {
  const { slug } = await props.params;
  const cat = getCategory(slug.join("/"));
  if (!cat) notFound();

  const q = readQuery(await props.searchParams);
  const base = `/parts/${cat.slug}`;
  const all = getCategoryProducts(cat.slug);

  // Machine tokens present in this category, top 12 by count. Shown as a filter, never as fitment.
  const tokenCount = new Map<string, number>();
  for (const p of all) for (const t of p.machine_tokens) tokenCount.set(t, (tokenCount.get(t) || 0) + 1);
  const tokens = [...tokenCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, MAX_CHIPS);
  const withPhoto = all.filter((p) => p.image_path).length;

  let list = all;
  if (q.machine) list = list.filter((p) => p.machine_tokens.includes(q.machine));
  if (q.photo) list = list.filter((p) => p.image_path);
  list = [...list].sort((a, b) => (q.sort === "name" ? a.name.localeCompare(b.name) || a.sku.localeCompare(b.sku) : a.sku.localeCompare(b.sku)));

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(q.page, pages);
  const start = (page - 1) * PER_PAGE;
  const shown = list.slice(start, start + PER_PAGE);
  const filtered = Boolean(q.machine || q.photo);

  // Breadcrumb: slug segments line up with the path names.
  const segs = cat.slug.split("/");
  const crumbs = cat.path.map((name, i) => ({ name, href: `/parts/${segs.slice(0, i + 1).join("/")}` }));

  // Pager window: first, last, and two either side of the current page.
  const pageNums: number[] = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 2) pageNums.push(i);

  // Phone filter disclosure: count and summary of what is switched on.
  const activeCount = (q.machine ? 1 : 0) + (q.photo ? 1 : 0);
  const activeText = [q.machine ? `Machine ${q.machine}` : "", q.photo ? "Has photo" : ""].filter(Boolean).join(", ");

  return (
    <main className="catpage">
      <style>{`
        .catpage .crumbs li{display:flex;gap:6px;list-style:none}
        .catpage .crumbs ol{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0}
        .catpage .crumbs [aria-current="page"]{color:var(--ink)}
        .catpage .sub{margin-bottom:24px}
        .catpage .sub .models{margin-top:8px}
        .catpage .chip.on{background:var(--ink);color:var(--on-ink)}
        .catpage .chip.on .c{color:var(--foot-muted)}
        .catpage .band .frame{align-items:center;min-height:0;padding-top:16px;padding-bottom:16px}
        .catpage .band .lead{padding-bottom:0;min-width:0}
        .catpage .band .models{margin-top:0;flex:1;min-width:0}
        .catpage .band .hint{font-size:12px;color:var(--muted);max-width:none}
        .catpage .tools{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;margin:20px 0 24px;font-family:var(--mono);font-size:13px}
        .catpage .tools .grp{display:flex;align-items:center;gap:8px}
        .catpage .tools .lbl{margin:0}
        .catpage .tools .sort{display:inline-flex;align-items:center;height:32px;padding:0 10px;border:1px solid var(--hair)}
        .catpage .tools .sort[aria-current="true"]{border-color:var(--ink);background:var(--ink);color:var(--on-ink)}
        .catpage .tools .sort:hover{border-color:var(--ink);text-decoration:none}
        .catpage .tools .range{margin-left:auto;color:var(--muted)}
        .catpage .prod .name a:hover{text-decoration:underline;text-underline-offset:3px}
        .catpage .empty{padding:48px 0;border-top:1px solid var(--hair);color:var(--muted)}
        .catpage .empty a{color:var(--ink);text-decoration:underline;text-underline-offset:3px}
        .catpage .pager .gap{border:0;min-width:0;padding:0;color:var(--muted)}
        .catpage h1{min-width:0;max-width:100%;overflow-wrap:anywhere}
        .catpage .prod .pbody{display:contents}
        .catpage .prod .nph{display:none;align-items:center;height:22px;padding:0 6px;border:1px solid var(--hair);font-family:var(--mono);font-size:12px;color:var(--muted)}
        .catpage .mob{display:none}
        @media (max-width:720px){
          .catpage .tools .range{margin-left:0;flex:1 1 100%}
          .catpage .dsk{display:none!important}
          .catpage .mob{display:block}
          .catpage .tools{margin:16px 0}
          .catpage .tools .sort{min-height:44px;height:auto;padding:0 14px}
          .catpage .mfilt{margin:0 0 8px}
          .catpage .mfilt summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:0 14px;border:1px solid var(--ink);border-radius:4px;background:var(--surface);font-size:15px;font-weight:600;cursor:pointer;list-style:none}
          .catpage .mfilt summary::-webkit-details-marker{display:none}
          .catpage .mfilt summary::after{content:"";width:8px;height:8px;border-right:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);transform:rotate(45deg);margin-top:-4px;flex:none}
          .catpage .mfilt[open] summary::after{transform:rotate(-135deg);margin-top:4px}
          .catpage .mfilt .panel{padding:16px 0 8px;display:flex;flex-direction:column;gap:20px}
          .catpage .mfilt .models{margin-top:8px}
          .catpage .mfilt .chip{min-height:44px;height:auto;padding:0 12px}
          .catpage .mfilt .hint{font-size:13px;color:var(--muted);margin-top:4px}
          .catpage .active{display:flex;flex-wrap:wrap;align-items:center;gap:0 12px;font-size:14px;margin-bottom:8px}
          .catpage .active a{display:inline-flex;align-items:center;min-height:44px;text-decoration:underline;text-underline-offset:3px}
          .catpage .pager a,.catpage .pager span{min-width:44px;min-height:44px;height:auto}
          .catpage .pager.ptop{display:flex;margin:0 0 16px}
          .catpage .pager.pbot{display:flex;flex-wrap:nowrap;margin:16px 0 0}
          .catpage .pager.ptop{flex-wrap:nowrap}
          .catpage .pager .of{border:0;flex:1;color:var(--muted)}
          .catpage .empty a{display:inline-flex;align-items:center;min-height:44px}
          .catpage .lattice{grid-template-columns:1fr}
          .catpage .prod{display:grid;grid-template-columns:72px minmax(0,1fr);column-gap:12px;align-items:start;padding:12px 16px;min-height:44px}
          .catpage .prod .img{grid-column:1;grid-row:1;width:72px;height:72px}
          .catpage .prod .img img{max-width:100%;max-height:100%}
          .catpage .prod .img.type{display:none}
          .catpage .prod .pbody{grid-column:2;grid-row:1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;min-width:0}
          .catpage .prod.noimg .pbody{grid-column:1/-1}
          .catpage .prod .pbody>*{flex:1 1 100%;min-width:0}
          .catpage .prod .pbody>.price,.catpage .prod .pbody>.stock,.catpage .prod .pbody>.nph{flex:0 1 auto}
          .catpage .prod .nph{display:inline-flex}
          .catpage .prod .tb{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px;height:auto;margin-top:0;border-top:0}
          .catpage .prod .tb .pn{display:block;padding-right:0;overflow:visible;white-space:normal;overflow-wrap:anywhere;font-size:14px;font-weight:600}
          .catpage .prod .tb .mc{display:block;border-left:0;padding-left:0;min-width:0;overflow-wrap:anywhere}
          .catpage .prod .name{display:block;overflow:visible;-webkit-line-clamp:unset;overflow-wrap:anywhere}
          .catpage .prod .name a::after{content:"";position:absolute;inset:0}
          .catpage .prod .name a:focus-visible{outline:0}
          .catpage .prod:focus-within{outline:2px solid var(--ink);outline-offset:-2px;z-index:1}
          .catpage .prod .price{margin-top:0;padding-top:0}
          .catpage .prod .price .p{font-size:14px}
          .catpage .prod .act{display:none}
        }
      `}</style>

      <div className="frame">
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="/parts">Parts</a><span aria-hidden="true">/</span></li>
            {crumbs.map((c, i) => (
              <li key={c.href}>
                {i < crumbs.length - 1 ? (
                  <>
                    <a href={c.href}>{c.name}</a>
                    <span aria-hidden="true">/</span>
                  </>
                ) : (
                  <span aria-current="page">{c.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="page-h">
          <h1>{cat.name}</h1>
          <span className="cnt num">
            {filtered ? `${fmt(list.length)} of ${fmt(all.length)} parts` : `${fmt(all.length)} parts`}
          </span>
        </div>

        {cat.children.length > 0 && (
          <section className="sub dsk" aria-labelledby="subTitle">
            <div className="rule"><h2 className="eyebrow" id="subTitle">Within {cat.name}</h2></div>
            <div className="models">
              {cat.children.map((c) => (
                <a key={c.slug} className="chip" href={`/parts/${c.slug}`}>
                  {c.name} <span className="c">· {fmt(c.product_count)}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {tokens.length > 0 && (
        <section className="band dsk" aria-labelledby="machTitle">
          <div className="frame">
            <div className="lead">
              <h2 className="eyebrow" id="machTitle">Machine</h2>
              <p className="hint">Model appears in the part name. Fitment not listed, confirm with our team.</p>
            </div>
            <div className="models">
              <a className={q.machine ? "chip" : "chip on"} href={link(base, q, { machine: "", page: 1 })} aria-current={q.machine ? undefined : "true"}>
                All <span className="c">· {fmt(all.length)}</span>
              </a>
              {tokens.map(([t, n]) => {
                const on = t === q.machine;
                return (
                  <a key={t} className={on ? "chip on" : "chip"} href={link(base, q, { machine: on ? "" : t, page: 1 })} aria-current={on ? "true" : undefined}>
                    {t} <span className="c">· {fmt(n)}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="frame">
        <details className="mfilt mob">
          <summary>{activeCount > 0 ? `Filter, ${activeCount} active` : "Filter"}</summary>
          <div className="panel">
            {cat.children.length > 0 && (
              <div>
                <h2 className="eyebrow">Within {cat.name}</h2>
                <div className="models">
                  {cat.children.map((c) => (
                    <a key={c.slug} className="chip" href={`/parts/${c.slug}`}>
                      {c.name} <span className="c">· {fmt(c.product_count)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {tokens.length > 0 && (
              <div>
                <h2 className="eyebrow">Machine</h2>
                <p className="hint">Model appears in the part name. Fitment not listed, confirm with our team.</p>
                <div className="models">
                  <a className={q.machine ? "chip" : "chip on"} href={link(base, q, { machine: "", page: 1 })} aria-current={q.machine ? undefined : "true"}>
                    All <span className="c">· {fmt(all.length)}</span>
                  </a>
                  {tokens.map(([t, n]) => {
                    const on = t === q.machine;
                    return (
                      <a key={t} className={on ? "chip on" : "chip"} href={link(base, q, { machine: on ? "" : t, page: 1 })} aria-current={on ? "true" : undefined}>
                        {t} <span className="c">· {fmt(n)}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <h2 className="eyebrow">Photo</h2>
              <div className="models">
                <a className={q.photo ? "chip on" : "chip"} href={link(base, q, { photo: !q.photo, page: 1 })} aria-pressed={q.photo}>
                  Has photo <span className="c">· {fmt(withPhoto)}</span>
                </a>
              </div>
            </div>
          </div>
        </details>
        {activeCount > 0 && (
          <p className="active mob">
            <span>Active: {activeText}</span>
            <a href={base}>Clear filters</a>
          </p>
        )}

        <div className="tools">
          <div className="grp dsk">
            <a className={q.photo ? "chip on" : "chip"} href={link(base, q, { photo: !q.photo, page: 1 })} aria-pressed={q.photo}>
              Has photo <span className="c">· {fmt(withPhoto)}</span>
            </a>
          </div>
          <div className="grp" role="group" aria-label="Sort">
            <span className="lbl">Sort</span>
            <a className="sort" href={link(base, q, { sort: "sku", page: 1 })} aria-current={q.sort === "sku" ? "true" : undefined}>Part number</a>
            <a className="sort" href={link(base, q, { sort: "name", page: 1 })} aria-current={q.sort === "name" ? "true" : undefined}>Name</a>
          </div>
          <span className="range num" aria-live="polite">
            {list.length ? `Showing ${fmt(start + 1)} to ${fmt(start + shown.length)} of ${fmt(list.length)}` : "No parts match"}
          </span>
        </div>

        {pages > 1 && (
          <nav className="pager ptop mob" aria-label="Pages, top of results">
            {page > 1 ? <a href={link(base, q, { page: page - 1 })} rel="prev">Previous</a> : <span aria-disabled="true">Previous</span>}
            <span className="of">Page {fmt(page)} of {fmt(pages)}</span>
            {page < pages ? <a href={link(base, q, { page: page + 1 })} rel="next">Next</a> : <span aria-disabled="true">Next</span>}
          </nav>
        )}

        {shown.length === 0 ? (
          <div className="empty">
            <p>No parts match these filters. <a href={base}>Clear filters</a> or <a href="/quote">request a quote</a> for a part not listed.</p>
          </div>
        ) : (
          <div className="lattice" role="list" aria-label={`${cat.name} parts`}>
            {shown.map((p) => {
              const token = p.machine_tokens[0] || "";
              const stock = stockLabel(p);
              return (
                <article key={p.slug} className={p.image_path && p.image_w && p.image_h ? "cell prod" : "cell prod noimg"} role="listitem">
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
                      <span className="mc">{token}</span>
                    </div>
                    <h3 className="name"><a href={`/part/${p.slug}`}>{p.name}</a></h3>
                    <div className="price"><span className="p">{formatPrice(p)}</span></div>
                    <div className={stockClass(p)}><i aria-hidden="true"></i>{stock}</div>
                    {p.image_path && p.image_w && p.image_h ? null : <span className="nph" aria-hidden="true">No photo</span>}
                    <div className="act">
                      <a className="btn ghost sm" href={`/part/${p.slug}`} aria-label={`View ${p.sku}, ${p.name}`}>View</a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <nav className="pager pbot mob" aria-label="Pages, end of results">
            {page > 1 ? <a href={link(base, q, { page: page - 1 })} rel="prev">Previous</a> : <span aria-disabled="true">Previous</span>}
            <span className="of">Page {fmt(page)} of {fmt(pages)}</span>
            {page < pages ? <a href={link(base, q, { page: page + 1 })} rel="next">Next</a> : <span aria-disabled="true">Next</span>}
          </nav>
        )}

        {pages > 1 && (
          <nav className="pager dsk" aria-label="Pages">
            {page > 1 ? <a href={link(base, q, { page: page - 1 })} rel="prev">Previous</a> : <span aria-disabled="true">Previous</span>}
            {pageNums.map((n, i) => (
              <span key={n} style={{ display: "contents" }}>
                {i > 0 && pageNums[i - 1] !== n - 1 && <span className="gap" aria-hidden="true">…</span>}
                <a href={link(base, q, { page: n })} aria-current={n === page ? "page" : undefined} aria-label={`Page ${n}`}>{n}</a>
              </span>
            ))}
            {page < pages ? <a href={link(base, q, { page: page + 1 })} rel="next">Next</a> : <span aria-disabled="true">Next</span>}
          </nav>
        )}
      </div>
    </main>
  );
}
