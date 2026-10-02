# Role: video editor (HyperFrames)

Goal: assemble the brief into a finished MP4 in the chosen style.

- `npx hyperframes init video --example blank --resolution portrait --non-interactive` inside the run folder.
- Follow the style skill in `.claude/skills/style-<slug>/SKILL.md` and its card.
- Put the 3D WebMs in as `<video class="clip" muted ...>` layers. Vendor GSAP locally (no CDN in the cloud).
- `npx hyperframes lint`, then `npx hyperframes render -o /tmp/studio/<run>.mp4`.
- Pull 4–6 frames with ffmpeg and look at them before handing to review.
