// True mobile screenshots via Chrome DevTools Protocol: 375x812, mobile, touch, DPR 2, full page.
// Seeded variant: seeds phx_quote before the quote shot and phx_cart before the cart shot, and runs a phone audit per page.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const OUT = process.argv[2];
const PAGES = JSON.parse(process.argv[3]);
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prof = mkdtempSync(path.join(tmpdir(), "phx-cdp-"));
const chrome = spawn(CH, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${prof}`, "--remote-debugging-port=9334", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CART = [
  { sku: "6/4D-AHR-R55-E4147R", qty: 2, name: "6/4D AHR Bare Shaft Pump R/Lin", slug: "6-4d-ahr-r55-e4147r-6-4d-ahr-bare-shaft-pump-r-lin" },
  { sku: "MM1155334", qty: 1, name: "C130 Toggle Plate", slug: "mm1155334-c130-toggle-plate-mm1006270" },
  { sku: "19.30.1119", qty: 3, name: "Disc Return Roller (Finlay) 1119FL", slug: "19-30-1119-disc-return-roller-finlay-1119fl" },
];
const QUOTE = [
  { sku: "MM1155334", qty: 1, name: "C130 Toggle Plate", slug: "mm1155334-c130-toggle-plate-mm1006270" },
  { sku: "19.30.1119", qty: 4, name: "Disc Return Roller (Finlay) 1119FL", slug: "19-30-1119-disc-return-roller-finlay-1119fl" },
];

const AUDIT = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && !(cs.clip && cs.clip.startsWith('rect(0')) && !(cs.clipPath && cs.clipPath.includes('inset(50%')); };
  const desc = (el) => { const t = (el.getAttribute('aria-label') || el.textContent || el.value || el.name || el.id || '').trim().replace(/\\s+/g,' ').slice(0,40); const c = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : ''; return el.tagName.toLowerCase() + c + ' "' + t + '"'; };
  const out = { scrollWidth: document.documentElement.scrollWidth, innerWidth: innerWidth, overflowX: document.documentElement.scrollWidth > innerWidth };
  out.wide = [...document.body.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && vis(e); }).slice(0,8).map(desc);
  out.smallFont = [...document.querySelectorAll('input,select,textarea')].filter(vis).filter(e => e.type !== 'hidden' && e.type !== 'checkbox' && e.type !== 'radio' && parseFloat(getComputedStyle(e).fontSize) < 16).map(e => desc(e) + ' ' + getComputedStyle(e).fontSize);
  const ctrls = [...document.querySelectorAll('a,button,select,input,summary,textarea')].filter(vis).filter(e => e.type !== 'hidden');
  out.short = []; out.narrow = [];
  for (const e of ctrls) {
    const r = e.getBoundingClientRect();
    const inline = e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.closest('p,li.note,.msg');
    if (r.height < 44) out.short.push(desc(e) + ' h=' + Math.round(r.height) + (inline ? ' (inline text link)' : ''));
    const t = (e.textContent || '').trim();
    if (r.width < 44 && t.length <= 3) out.narrow.push(desc(e) + ' w=' + Math.round(r.width));
  }
  out.controls = ctrls.length;
  const hdr = document.querySelector('header, .hdr');
  out.headerOverlap = [];
  if (hdr) {
    const els = [...hdr.querySelectorAll('a,button,input,select,img,svg,form,span,strong,b,label')].filter(vis).filter(e => !e.closest('.ac') && getComputedStyle(e).position !== 'absolute' || e.matches('a,button,input'));
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i], b = els[j]; if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ox > 1 && oy > 1) out.headerOverlap.push(desc(a) + ' x ' + desc(b) + ' (' + Math.round(ox) + 'x' + Math.round(oy) + ')');
    }
    out.headerHeight = Math.round(hdr.getBoundingClientRect().height);
  }
  out.brokenImages = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src'));
  return JSON.stringify(out);
})()`;

let ver;
for (let i = 0; i < 40; i++) { try { ver = await (await fetch("http://127.0.0.1:9334/json/version")).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const evalv = async (expression, sessionId) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId)).result.result.value;

const audits = {};
for (const [name, url] of PAGES) {
  const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }, sessionId);
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }, sessionId);
  await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" }, sessionId);
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  if (name === "cart" || name === "quote") {
    await send("Page.navigate", { url: "http://localhost:3105/" }, sessionId);
    await sleep(1500);
    const key = name === "cart" ? "phx_cart" : "phx_quote";
    const val = name === "cart" ? CART : QUOTE;
    await evalv(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(val))}); localStorage.getItem(${JSON.stringify(key)})`, sessionId);
  }
  await send("Page.navigate", { url }, sessionId);
  await sleep(2500);
  // Scroll through so lazy images load, then back to top.
  const h0 = JSON.parse(await evalv("JSON.stringify({h: document.documentElement.scrollHeight})", sessionId)).h;
  for (let y = 0; y < h0; y += 700) { await evalv(`window.scrollTo(0, ${y})`, sessionId); await sleep(120); }
  await evalv("window.scrollTo(0,0)", sessionId); await sleep(1200);
  audits[name] = JSON.parse(await evalv(AUDIT, sessionId));
  const dims = JSON.parse(await evalv("JSON.stringify({h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, vw: innerWidth})", sessionId));
  const CHUNK = 6000; let part = 0;
  for (let y = 0; y < dims.h; y += CHUNK, part++) {
    const hh = Math.min(CHUNK, dims.h - y);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y, width: 375, height: hh, scale: 1 } }, sessionId);
    writeFileSync(path.join(OUT, dims.h > CHUNK ? `${name}__p${part}.png` : `${name}.png`), Buffer.from(shot.result.data, "base64"));
  }
  console.log(name, JSON.stringify(dims));
  await send("Target.closeTarget", { targetId });
}
writeFileSync(path.join(OUT, "audit.json"), JSON.stringify(audits, null, 2));
ws.close(); chrome.kill();
