# AurorA Studio

**One agent workspace for programmable motion, 3D and finishing.**

If all the new video, motion and 3D tools feel scattered, AurorA Studio gives your coding agent one simple workflow:

> Give it a brief or a reference.  
> It understands your product, checks what you already have, chooses the right available tools, builds, reviews, and learns from approved work.

AurorA Studio is designed for Claude Code, Codex and compatible coding agents.

## Two modes

### Direct

Ask for the video and let the agent work with minimum interruption.

Good for:
- social videos
- explainers
- kinetic typography
- repeatable brand content
- fast variants

### Director

Use when you want more creative control.

The agent:
1. understands the brief/reference
2. reads your saved product context
3. proposes a few genuinely different concepts
4. waits for your choice
5. defines a tool-agnostic mood
6. checks reusable assets/styles
7. chooses the production path
8. builds and reviews
9. finalizes only after approval

## Production engines

AurorA routes work across what is actually available:

- **HyperFrames** — programmable 2D motion, captions, UI, explainers and variants
- **Blender** — optional true 3D, characters, products, lighting, rigs and camera work
- **After Effects** — optional compositing/VFX/finishing

Missing optional tools are not errors.

## The important part: the Studio Brain

AurorA Studio is not just three creative apps glued together.

Each workspace keeps structured knowledge for:

- your product/service
- audience and brand
- references
- approved styles
- reusable assets
- tool capabilities
- production decisions
- provider usage/cost
- review results
- lessons from approved work

The agent searches that knowledge **before** deciding what to build or which tool to use.

Example:

```text
Reference needs a premium 3D avatar
        ↓
Search project/AurorA asset library
        ↓
No close approved avatar found
        ↓
Asset decision = BUILD_NEW
Required capability = true 3D + rigging
        ↓
Router selects Blender
        ↓
Blender renders transparent overlay
        ↓
HyperFrames handles editable typography/layout
        ↓
Structured review
        ↓
Owner approval
        ↓
Useful lesson/assets saved
```

## Optional creative resources

AurorA can also use resources the user already has access to, such as:

- Google Flow
- ChatGPT Images
- Meta AI
- ElevenLabs
- open asset libraries

These are optional. AurorA checks live availability/cost instead of assuming old prices or credits.

## Assets first, generation second

Before spending credits, the agent checks:

1. current project assets
2. approved AurorA library
3. saved styles
4. open-license asset sources
5. procedural HyperFrames/Blender build
6. configured generation providers

The Studio includes license-aware asset metadata and live Poly Haven search.

## Community install target

AurorA Studio is still in foundation development and is **not published to npm yet**.

The release target is:

```bash
npx <final-package>@latest setup
```

Then users should mostly talk to their agent rather than learn internal CLI commands.

For current development details, see:

- [`aurora-studio/README.md`](aurora-studio/README.md)
- [`aurora-studio/docs/FOUNDATION.md`](aurora-studio/docs/FOUNDATION.md)

## Existing HyperFrames style library

The reusable styles/kits that originally lived in this repo are still here and are imported by AurorA's library layer.

Their original documentation is preserved at:

[`docs/HYPERFRAMES-STYLE-LIBRARY.md`](docs/HYPERFRAMES-STYLE-LIBRARY.md)

## Current development status

The foundation currently includes:

- Direct + Director workflows
- project/reference/mood knowledge
- asset/style library
- tool routing
- per-shot build planning
- HyperFrames core integration
- Blender adapter
- optional After Effects adapter
- browser-generation playbooks
- structured post-render review
- approved-only learning
- safe project hooks for Claude/Codex
- portable workspace runtime
- Windows + Ubuntu CI
- real packaged-install smoke tests
- package leak/security checks

The final UI/UX comes **after** the workflow contracts are stable.

## Project principles

AurorA Studio should stay:

- simple for users
- strong for agents
- optional where possible
- reproducible
- license-aware
- cost-aware
- honest about uncertainty
- resistant to feature bloat

If a new feature does not improve quality, reliability, cost, or setup, it probably does not belong yet.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Security

See [`SECURITY.md`](SECURITY.md).

## License

AurorA Studio code in this repository is released under MIT unless a subcomponent states otherwise.

Third-party tools/assets keep their own licenses.
