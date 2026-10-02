import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import fs from "fs";
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("file:///tmp/claude-0/laptop/gen.html");
const views = {
  front: { yaw: 0, pitch: 14, lid: 14, dist: 2400, screenPx: 1920, pad: 60, padBottom: 40, ink: 6 },
  "hero-left": { yaw: -32, pitch: 20, lid: 16, dist: 1100, screenPx: 1700, pad: 60, padBottom: 40, ink: 6 },
  hero:  { yaw: 32, pitch: 20, lid: 16, dist: 1100, screenPx: 1700, pad: 60, padBottom: 40, ink: 6 },
};
const meta = {};
for (const [name, opt] of Object.entries(views)) {
  const r = await p.evaluate((opt) => {
    const r = renderLaptop(opt), o = {};
    for (const k in r.layers) o[k] = r.layers[k].toDataURL("image/png");
    return { w: r.w, h: r.h, corners: r.corners, png: o };
  }, opt);
  for (const k in r.png) fs.writeFileSync(`${out}/laptop-${name}-${k}.png`, Buffer.from(r.png[k].split(",")[1], "base64"));
  meta[name] = { size: [r.w, r.h], corners: r.corners, view: opt };
  console.log(name, r.w, r.h, JSON.stringify(r.corners));
}
const tc = await p.evaluate(() => testCard(1920, 1080).toDataURL("image/png"));
fs.writeFileSync(`${out}/test-card-1920x1080.png`, Buffer.from(tc.split(",")[1], "base64"));
fs.writeFileSync(`${out}/laptop.json`, JSON.stringify(meta, null, 2));
await b.close();
