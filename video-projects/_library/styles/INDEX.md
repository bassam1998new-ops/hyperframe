# Style and skill index

Every saved look in this library, on one page: what it looks like, where its files are, and how to
reuse it in a new video. For the full rules of a look, open its style card (`style.md`) and its
skill (`SKILL.md`).

All paths are from the repo root. `styles/` = `video-projects/_library/styles/`,
`skills/` = `.claude/skills/`, `compositions/` = `video-projects/_library/compositions/`,
`kits/` = `video-projects/_library/assets/kits/`.

## Quick pick

| Look | Best for | Format | Ready-made parts |
|---|---|---|---|
| [Hatch Cosmos](#hatch-cosmos) | music-led teaser, mascot intro, channel bumper | 9:16 + 16:9 | kit + 2 demo blocks + 4 frames |
| [Neon Node Explainer](#neon-node-explainer) | AI / concept explainer with voice-over | 9:16 + 16:9 | kit + 2 demo blocks + 3 frames |
| [Versus Board](#versus-board) | "X vs Y" AI model comparison, two contenders | 9:16 | demo block on the node kit + 6 frames (draft) |
| [Midnight Kinetic Type](#midnight-kinetic-type) | direct offer, results reel, AI news told in type | 9:16 | card + skill only |
| [Swiss Motion Reel](#swiss-motion-reel) | brand sizzle, launch teaser, graphics-only | 16:9 (9:16 not built) | card + skill only |
| [Amber Grid Newsroom](#amber-grid-newsroom) | "breaking" AI news from a screen recording | 9:16 | card + skill only |
| [Midnight Screen Desk](#midnight-screen-desk) | calm AI news / tutorial from a screen recording | 9:16 | card + skill only |
| [Floating Desk Zoom](#floating-desk-zoom) | app demo / build show-off from a screen recording | 9:16 | card + skill only |
| [Mint Lecture Room](#mint-lecture-room) | lecture clip with a quiz card | 9:16 | card + skill only |
| [Warm Glass Face-cam](#warm-glass-facecam) | presenter on camera with glass overlays | 16:9 (9:16 not built) | card + skill only |

Nine cards are `status: approved`; Versus Board is `status: draft` until the owner approves it. Colours in every card are **roles**; your brand fills the hex.

## How to reuse any look

1. Start a HyperFrames project: `npx hyperframes init`.
2. Read the look's `styles/<slug>/style.md`, then copy `skills/style-<slug>/` into your project's
   `.claude/skills/`. Ask Claude Code for "a video in the <name> style".
3. If the look has a kit and demo blocks (Hatch Cosmos, Neon Node Explainer), copy the kit folder into
   your project's `assets/kits/` and start from the demo block instead of a blank file.
4. Fill the colour roles from your brand (never ship the reference hex unless it is your brand).
5. Check before you render: `npx hyperframes lint`, `npx hyperframes snapshot`, look at the frames.

Skill lines like `node tools/vid.mjs …` refer to a private helper CLI that is not in this repo. Do the
same step by hand (copy the block, set the variables, render a draft, look at the frames).

---

## Hatch Cosmos
`hatch-cosmos`

**Looks like:** a hand-drawn world with short diagonal pencil hatching and ink outlines. A small block
mascot (or a pair) walks, looks, blinks and does ^ ^ eyes, then the camera dives through its eye, which
turns into a rounded window, into a hatched galaxy of nebula blobs, tilted rings and needle stars. Two
looks: dark `space` or cream `paper`. No text in the canvas; music-led.

**Files:**
- Card: `styles/hatch-cosmos/style.md`
- Skill: `skills/style-hatch-cosmos/SKILL.md`
- Frames: `styles/hatch-cosmos/frames/` (01 pair happy eyes, 02 eye-window dive, 03 deep galaxy, 04 paper walk)
- Kit: `kits/hatch/hatch.js` (global `HATCH`) + `kits/hatch/README.md`
- Demo blocks (6 s each): `compositions/hatch-cosmos-16x9.html`, `compositions/portrait/hatch-cosmos-9x16.html`

**Reuse:** copy `kits/hatch/` and a demo block into your project. Set
`data-variable-values='{"theme":"<name>","look":"space|paper"}'`. For your brand pass your own roles to
`HATCH.kit({ theme: { canvas, ink, paper, hero, buddy, a1…a6, … } })`. Build new scenes from kit parts
(`K.blob`, `K.planet`, `K.galaxy`, `K.mascot`, `K.dive`) and draw only from `t`. Put any words outside
the canvas.

## Neon Node Explainer
`neon-node-explainer`

**Looks like:** a plain stage with one headline per spoken sentence and one small glowing diagram
(tiles, lines, packets, checks, a terminal, a tool list) that builds itself part by part. Hard cuts, no
camera moves. Arabic headlines with English mono labels.

**Files:**
- Card: `styles/neon-node-explainer/style.md`
- Skill: `skills/style-neon-node-explainer/SKILL.md`
- Frames: `styles/neon-node-explainer/frames/` (chain AI→MCP→APIs, hub fan-out, terminal steps)
- Kit: `kits/node-explainer/nx.css` + `nx.js` (global `NX`) + `README.md`
- Demo blocks: `compositions/node-explainer-16x9.html`, `compositions/portrait/node-explainer-9x16.html`

**Reuse:** copy `kits/node-explainer/` into `assets/kits/node-explainer/` and start from a demo block.
Theme it with `NX.theme(root, { bg, surface, border, text, dim, accent, "accent-2", "role-1"…"role-4", ok, warn, danger })`.
The accent goes on 1–3 headline words only; each role colour keeps one meaning for the whole video.

## Versus Board
`versus-board`

**Looks like:** a split screen with a tinted half per side. One prompt types once and forks into two
plain tiles (MODEL A / MODEL B), the answers race with live counters, a scoreboard ticks with Arabic
punch words («أسرع», «أرخص»), the tiles shrink and a verdict card drops: «حسب الشغلانة». It never
names a winner. The mascot points at the verdict. Snap punch-ins, no drift.

**Files:**
- Card: `styles/versus-board/style.md` (draft)
- Skill: `skills/style-versus-board/SKILL.md`
- Frames: `styles/versus-board/frames/` (slam, prompt, fork and race, scoreboard, verdict, mascot)
- Kits: `kits/node-explainer/` + `kits/hatch/` + `kits/aurora/aurora.js` (the Aurora mascot, global `AURORA`)
- Demo block (6 s, one round): `compositions/portrait/versus-board-9x16.html`

**Reuse:** copy the three kit folders and the demo block into your project. Set `--vb-a` / `--vb-b`
to two equally strong brand colours and theme the rest with `NX.theme`. One round per compared task;
same prompt on both sides; no logos.

## Midnight Kinetic Type
`midnight-kinetic-type`

**Looks like:** clean motion type on a flat dark field. Words rise from a mask one by one, one accent
word lands alone, icon strokes draw on, and every scene hard-cuts on the music's beat. No footage, no
face. Arabic (Cairo, per word) and English (Inter) versions.

**Files:** card `styles/midnight-kinetic-type/style.md` · skill `skills/style-midnight-kinetic-type/SKILL.md`.
The blocks the card names (`mk-hook-title-portrait`, `mk-cta-endcard-portrait`, …) are not in this repo.

**Reuse:** build the scenes from the card's type sizes and motion JSON. Cut on the beat grid of your
track; no crossfades.

## Swiss Motion Reel
`swiss-motion-reel`

**Looks like:** a Swiss-grid "instrument panel" with a thin HUD on every scene (corner brackets,
timecode, BPM squares, progress line), flat two-colour blocks, word slams, shape match-cuts and hard
cuts on a 128 BPM beat. Italic serif + heavy grotesk + mono labels.

**Files:** card `styles/swiss-motion-reel/style.md` · skill `skills/style-swiss-motion-reel/SKILL.md`.
No blocks or frames published; the HUD build is not public.

**Reuse:** map paper / blue / red to your brand's canvas / primary / accent. Vendor the real italic
serif font file. Built in 16:9 only; 9:16 is still to build.

## Amber Grid Newsroom
`amber-grid-newsroom`

**Looks like:** a hot "breaking news" desk. Near-black field with a faint grid, the real screen
recording in a framed window with instant reframes, an English title over an amber Arabic title line,
and karaoke captions where the spoken word turns amber.

**Files:** card `styles/amber-grid-newsroom/style.md` · skill `skills/style-amber-grid-newsroom/SKILL.md`.
Frames are listed in the card but not published.

**Reuse:** needs your screen recording and an Egyptian Arabic voice-over with word timings. Put reframes
on sentence starts; end on the black outro card.

## Midnight Screen Desk
`midnight-screen-desk`

**Looks like:** a calm news desk in three fixed zones: an Arabic info card on top, the screen recording
in a glowing band with punch-ins in the middle, and word-by-word captions (dim to bright) below.

**Files:** card `styles/midnight-screen-desk/style.md` · skill `skills/style-midnight-screen-desk/SKILL.md`.

**Reuse:** needs a screen recording and voice-over. Cut on word boundaries with a new punch-in on each
cut; order the story by beat (hook, what dropped, items, pick, takeaway, CTA).

## Floating Desk Zoom
`floating-desk-zoom`

**Looks like:** real app windows float as cards on warm paper with grain. A virtual camera hard-cuts in
on the action, follows the typing, then glides back out; the unused window greys out.

**Files:** card `styles/floating-desk-zoom/style.md` · skill `skills/style-floating-desk-zoom/SKILL.md`.
Frames are listed in the card but not published.

**Reuse:** needs an OBS screen recording and a voice-over. Rule: cut IN, glide OUT, a camera move every
3–6 s, never two moves less than 1.5 s apart.

## Mint Lecture Room
`mint-lecture-room`

**Looks like:** a calm classroom cut of a real lesson. One long take with slow zooms that follow the
point, a topic lower third, a quiz card that asks, counts down think-time and then answers, and karaoke
captions that light the current word.

**Files:** card `styles/mint-lecture-room/style.md` · skill `skills/style-mint-lecture-room/SKILL.md`.
The named blocks (`lecture-lower-third-9x16`, `lecture-question-card-9x16`) are not in this repo.

**Reuse:** needs a lecture recording. No cuts; place the lower third and quiz card in natural pauses.

## Warm Glass Face-cam
`warm-glass-facecam`

**Looks like:** the presenter talks to camera while frosted-glass panels with one warm glow land where
they point. Blur-punch text, a karaoke pill, small charts, then the face shrinks into a rounded
picture-in-picture for the demo part.

**Files:** card `styles/warm-glass-facecam/style.md` · skill `skills/style-warm-glass-facecam/SKILL.md`.

**Reuse:** needs a face-cam take with word timings. Swap the terracotta accent for your brand (it is
another product's brand colour). Source is English 16:9; the 9:16 and Arabic versions are still to build.

---

## Make a new look

Copy `styles/_template/style.md` and `styles/_template/SKILL.md`, fill every line (write "none — why"
where a line does not apply), save 3–6 style frames in `frames/`, and add a row to this index.
