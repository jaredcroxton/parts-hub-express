// Render local HTML files to PNG at a given CSS size and DPR via Chrome DevTools Protocol. Usage: node render.mjs <w> <h> <dpr> <in.html> <out.png> [...pairs]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const [W, H, DPR, ...pairs] = process.argv.slice(2);
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prof = mkdtempSync(path.join(tmpdir(), "phx-render-"));
const chrome = spawn(CH, ["--headless=new", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${prof}`, "--remote-debugging-port=9336", "about:blank"], { stdio: "ignore" });
setTimeout(() => { chrome.kill("SIGKILL"); process.exit(2); }, 90000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver; for (let i = 0; i < 40; i++) { try { ver = await (await fetch("http://127.0.0.1:9336/json/version")).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}, s) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId: s })); });
for (let i = 0; i < pairs.length; i += 2) {
  const [inp, out] = [path.resolve(pairs[i]), path.resolve(pairs[i + 1])];
  const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId: S } } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: +DPR, mobile: false }, S);
  await send("Page.enable", {}, S);
  await send("Page.navigate", { url: "file://" + inp }, S);
  await sleep(1200);
  await send("Runtime.evaluate", { expression: "document.fonts.ready.then(()=>document.fonts.check('800 38px \"Inter Tight\"'))", awaitPromise: true, returnByValue: true }, S);
  await sleep(300);
  const r = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: +W, height: +H, scale: 1 } }, S);
  writeFileSync(out, Buffer.from(r.result.data, "base64"));
  console.log("rendered", out);
  await send("Target.closeTarget", { targetId });
}
ws.close(); chrome.kill();
