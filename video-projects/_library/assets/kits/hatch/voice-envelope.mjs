// voice-envelope.mjs — turn a voice-over into per-frame loudness (0..1) for Aurora's mouth and voice bars.
//   node voice-envelope.mjs vo.mp3 [fps=30] > env.json
//   then: AURORA.pose("talk", t, { env: ENV, fps: 30 })   (t = seconds from the start of the audio)
// Needs ffmpeg on PATH. Quiet gaps go to 0 so her mouth closes between phrases.
import { execFileSync } from "node:child_process";

const [file, fpsArg] = process.argv.slice(2);
if (!file) { console.error("usage: node voice-envelope.mjs <audio> [fps]"); process.exit(1); }
const fps = Number(fpsArg) || 30, rate = 16000;
const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(rate), "-f", "s16le", "-"], { maxBuffer: 1 << 30 });
const samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
const win = Math.round(rate / fps), rms = [];
for (let i = 0; i < samples.length; i += win) {
  let s = 0, n = Math.min(win, samples.length - i);
  for (let j = 0; j < n; j++) { const v = samples[i + j] / 32768; s += v * v; }
  rms.push(Math.sqrt(s / Math.max(n, 1)));
}
const sorted = [...rms].sort((a, b) => a - b), hi = sorted[Math.floor(sorted.length * 0.95)] || 1, floor = hi * 0.12;
let prev = 0;
const env = rms.map((v) => {
  const x = Math.min(1, Math.max(0, (v - floor) / (hi - floor)));
  prev = x > prev ? x : prev * 0.55 + x * 0.45; // fast open, softer close
  return Math.round(prev * 100) / 100;
});
process.stdout.write(JSON.stringify(env) + "\n");
