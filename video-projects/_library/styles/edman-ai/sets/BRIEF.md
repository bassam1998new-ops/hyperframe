# Brief: sets and camera for "ادمان الـAI"

Build the rooms and backgrounds for an Egyptian Arabic cartoon series about AI tools, and a camera that can travel
through them, so one scene can flow into the next without a cut. How you build it is your choice. This brief says
what I need, where to put it, and the exact formats, so I can drop our characters in and render.

The owner approves at the gates. Silence is not a yes. Where a step says **STOP**, open a pull request with the
previews and wait for his written answer before you build more.

## 1. What is in this folder
All paths in this brief are relative to `video-projects/_library/styles/edman-ai/`.
```
edman-ai/
├── style.md                   ← the series style card: palette roles, camera, transitions, what never to do
├── frames/01..06              ← the approved look of the host's room (the sets must feel like this)
├── characters/                ← the five characters: Blender 5.2 Grease Pencil rigs (Python) + README
│   ├── sheet-v3.jpg           ← the characters
│   ├── faces-v1/*.png         ← their 16 face expressions
│   └── rig-test-*.mp4         ← the characters moving
└── sets/BRIEF.md              ← this file; everything you make goes in sets/
```
Read `characters/README.md` for how the characters are drawn and rendered.

## 2. What I need
### Five sets
1. **Desk / studio**: the host's room from the style frames. Desk, monitor, chair, lamp, shelf, rug, window onto space.
2. **Living room**: sofa, TV, coffee table; the host and his friend talk here.
3. **AI world**: an inside-the-computer space where the three mascots (Claude, ChatGPT, DeepSeek) live. Same
   night-purple cosmos family as the room, more abstract: glowing floor or platforms, orbit rings, floating windows.
4. **Street / café**: an outdoor scene: a café front, a street and a sky.
5. **Sketch world**: a paper sketchbook world for typography, where words are drawn, bent, cut and scribbled.

### One connected world
The camera must be able to travel between the sets:
- street/café ⇄ living room, through the front door or window
- living room ⇄ desk/studio, through a doorway
- desk/studio → AI world, by pushing into the monitor (the screen fills the frame, then opens into the world)
- desk/studio → sketch world, by pushing into a notebook on the desk (the page fills the frame, then becomes the world)

### Two depth approaches, tried on the desk/studio first
- **A. 2.5D:** flat drawn layers at different depths (sky, wall, room, props, foreground), so near layers slide
  faster than far ones when the camera moves.
- **B. Full 3D:** real 3D room and furniture with a flat cartoon look that matches the flat characters.

### Both formats, day and night
- Every set works in **9:16 (1080×1920)** and **16:9 (1920×1080)**. Build each set big enough that no edge shows
  in either format at any shot.
- Every set has a **day** and a **night** version of the same set (not two copies). Night: dark sky with stars, warm
  lamp light, screen glow. Day: a lighter sky through the window, softer contrast.

## 3. Stages
1. **Trial (STOP after it):** the desk/studio in both approaches, A and B. For each approach, both formats, day and
   night:
   - one still
   - a 6–8 s camera move with the cast standing in the room: wide, push in to a medium shot on the host, pan to
     the window, then push into the monitor and end on a placeholder first frame of the AI world
   In the PR, compare A and B: how each looks, how long a room takes to build, render time per frame, what broke.
   The owner picks A or B (or a mix).
2. **The other four sets** in the chosen approach, each with its stills (STOP for review).
3. **The connected world and the travels between all sets** (STOP for review).

## 4. Formats and files
### Blender scene format (so the characters fit in)
- Deliver `.blend` files that open in **Blender 5.2.2**.
- Units and axes: X is right, Z is up, and the camera looks toward +Y. Characters stand on the plane Y = 0 with
  their feet at Z = 0. A human character is about 1.0 m tall; mascots are 0.25–0.45 m.
- One file per set: `sets/<set>/<set>.blend`, with these names:
  - Collection `SET_<set>`, and inside it one collection per depth layer: `L0_far`, `L1_back`, `L2_room`,
    `L3_props`, `L4_front`. In approach B, name them by the same idea: far, back, room, props, front.
  - Collections `DAY_ONLY` and `NIGHT_ONLY` for anything that exists at only one time of day (stars, lamp glow, sun).
  - Empties `MARK_<name>` where characters stand (feet position, facing): at least `MARK_host`, `MARK_friend`,
    `MARK_mascot_1..3` where they belong.
  - One camera per named shot and format: `SHOT_<shot>_9x16` and `SHOT_<shot>_16x9`. At least `wide`, `medium`,
    `close`, plus set-specific shots (`window`, `monitor`, `notebook`, `door`).
  - Empties `PORTAL_<to-set>` at each push-through point (monitor, notebook, door, window, doorway).
- `sets/<set>/palette.json`: day and night colours by material name: `{"day": {"<material>": "#rrggbb"}, "night": {...}}`.
  Switching day/night = apply that palette and show `DAY_ONLY` or `NIGHT_ONLY`. Nothing else changes.
- `sets/world.blend`: all sets linked in at their world positions, plus `sets/world.json`:
  `{"sets": {"<set>": {"offset": [x, y, z]}}, "portals": [{"from": "<set>", "to": "<set>", "portal": "PORTAL_x"}]}`.

### Camera moves
`sets/camera.json`: every shot and move as data, so I can rebuild them in any scene:
```json
{ "shots": { "<set>/<shot>/<9x16|16x9>": { "location": [x, y, z], "rotation_deg": [x, y, z], "lens_mm": 35 } },
  "moves": [ { "name": "desk_wide_to_medium", "from": "desk/wide", "to": "desk/medium", "seconds": 1.6, "ease": "power2.inOut" },
             { "name": "desk_into_monitor", "from": "desk/monitor", "through": "PORTAL_ai", "to": "ai/wide", "seconds": 1.2, "ease": "power2.in" } ] }
```
- Camera moves are smooth. Characters keep their stepped acting (on twos); never smooth-tween the characters.
- Same input, same output: no randomness in the camera.

### Arabic text (sketch world, and any sign or screen)
- Arabic must be joined and read right to left. Blender text objects break Arabic letters apart, so deliver words
  as shapes (curves, meshes or Grease Pencil strokes), not live text objects.
- In the sketch world each word is its own object named `WORD_<n>`, with a draw order that can be revealed stroke
  by stroke, so I can bend, cut and scribble it.
- Never split a word into separate letters for animation; animate whole words or the stroke reveal.
- Free fonts only (e.g. Alexandria, Lalezar, Aref Ruqaa). List each font in `sets/ASSETS.md`.

### Previews (committed, so they can be seen in the PR)
- Stills: `sets/previews/<set>/<A|B>_<day|night>_<9x16|16x9>.png`, full resolution.
- Moves: `sets/previews/<set>/<A|B>_<day|night>_<9x16|16x9>.mp4`, H.264, about 720p, under 5 MB each.
- One contact sheet per stage: `sets/previews/<stage>-sheet.png`.
- Keep `.blend` files under 50 MB each. Do not commit raw frame folders.
- This repo ignores `*.mp4`, so add each preview MP4 by its path with `git add -f`.

### Assets
- Draw what you can yourself. Any image, texture or font you did not make must be free to ship commercially:
  list it in `sets/ASSETS.md` with its source link and licence. Nothing copyrighted, no logos except the three
  mascots that already exist in `characters/`.

## 5. Things that broke before in Blender (if you deliver Grease Pencil)
- A layer mask is ignored past layer index 256 in one Grease Pencil object; keep objects well under that.
- A mask is dropped when its mask layer is fully off camera, so a big cover that relies on a mask to hide it
  paints over the frame in close-ups. Make covers hug their part.
- A stroke fills only when it has a `fill_id`.
- New Grease Pencil materials get a node tree that makes them lit and dark; clear it for flat colour.
- Fills triangulate in the drawing's local XY plane: draw in XY and turn the object 90° on X.

## 6. Done means
Look at every still, and step through every move where the camera travels, before each PR. Then state in the PR
that:
- near layers move more than far ones, and no edge or gap shows at any shot in either format
- there are no flat-colour blocks, missing fills or mask artifacts, including in close-ups
- feet are on the floor and the characters are at the right size for the room
- night looks lit by the lamp and screen, not just darker
- Arabic is joined and reads right to left
- every push-through lands cleanly on the next set
- anything that still looks wrong is listed

## 7. Rules
- No personal data, keys, emails or machine paths in files, commits or PRs.
- Nothing paid: no paid tools, credits or stock.
- Small commits; one PR per stage.
- When a choice changes the look, ask in the PR. Do not guess creative calls.
