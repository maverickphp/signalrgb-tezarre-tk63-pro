// Runs the plugin against a fake SignalRGB runtime and checks the reports it sends.
//   node tools/test_plugin.mjs
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const reports = [];
let colorAt = () => [255, 0, 0];
globalThis.device = {
  setName() {}, setImageFromUrl() {}, log() {},
  color: (x, y) => colorAt(x, y),
  send_report: (data, len) => reports.push({ data: data.slice(), len }),
};
Object.assign(globalThis, { shutdownColor: "#000000", LightingMode: "Canvas", forcedColor: "#009bde" });

const src = readFileSync(new URL("../Tezarre_TK63_Pro.js", import.meta.url), "utf8");
const plugin = await import("data:text/javascript," + encodeURIComponent(src));
const checksumOk = d => ((0xFF - (d.slice(1, 8).reduce((a, b) => a + b, 0) & 0xFF)) & 0xFF) === d[8];

const realNow = Date.now;
let now = 1_000_000;
Date.now = () => now;

plugin.Initialize();
assert.equal(reports.length, 1);
assert.deepEqual(reports[0].data.slice(0, 9), [0x00, 0x07, 0x15, 0x04, 0x04, 0x07, 0x00, 0x00, 0xD4], "direct mode, as SignalRGB's Royuan plugin sends it");

plugin.Render();
let r = reports.at(-1);
assert.equal(r.len, 65); assert.equal(r.data.length, 65);
assert.deepEqual(r.data.slice(0, 5), [0x00, 0x0E, 255, 0, 0]);
assert.ok(checksumOk(r.data));

now += 40; plugin.Render();
assert.equal(reports.length, 2, "unchanged color isn't resent right away");
now += 1100; plugin.Render();
assert.equal(reports.length, 3, "keepalive after a second");

// Half the keyboard red, half blue -> the average.
colorAt = x => (x < 7 ? [255, 0, 0] : [0, 0, 255]);
now += 40; plugin.Render();
const [, cmd, red, green, blue] = reports.at(-1).data;
assert.equal(cmd, 0x0E);
assert.ok(red > 90 && red < 160 && blue > 90 && blue < 160 && green === 0, `average ${red},${green},${blue}`);

assert.ok(plugin.Validate({ interface: 0, usage: 6, usage_page: 1 }));
assert.ok(!plugin.Validate({ interface: 1, usage: 6, usage_page: 1 }));
Date.now = realNow;
console.log("all plugin checks passed");
