// True mobile screenshots via Chrome DevTools Protocol: 375x812, mobile, touch, DPR 2, full page.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const OUT = process.argv[2];
const PAGES = JSON.parse(process.argv[3]);
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const prof = mkdtempSync(path.join(tmpdir(), "phx-cdp-"));
const chrome = spawn(CH, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${prof}`, "--remote-debugging-port=9333", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ver;
for (let i = 0; i < 40; i++) { try { ver = await (await fetch("http://127.0.0.1:9333/json/version")).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(); const events = [];
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else events.push(m); });
const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

for (const [name, url] of PAGES) {
  const { result: { targetId } } = await send("Target.createTarget", { url: "about:blank" });
  const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true }, sessionId);
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }, sessionId);
  await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" }, sessionId);
  await send("Page.enable", {}, sessionId);
  await send("Page.navigate", { url }, sessionId);
  await sleep(2500);
  const m = await send("Runtime.evaluate", { expression: "JSON.stringify({h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, vw: innerWidth})", returnByValue: true }, sessionId);
  const dims = JSON.parse(m.result.result.value);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 375, height: Math.min(dims.h, 7000), scale: 1 } }, sessionId);
  writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(shot.result.data, "base64"));
  console.log(name, JSON.stringify(dims));
  await send("Target.closeTarget", { targetId });
}
ws.close(); chrome.kill();
