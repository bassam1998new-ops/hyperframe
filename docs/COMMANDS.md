# CLI contract

| Command | Purpose |
|---|---|
| `aurora init <folder>` | create workspace files/folders |
| `aurora setup` | one-time product/resource setup |
| `aurora mode direct` | fast execution mode |
| `aurora mode director` | concept + controlled steps mode |
| `aurora status` | show state |
| `aurora resources` | show resources |
| `aurora doctor` | detect production tools |
| `aurora config set ...` | change settings |
| `aurora finalize <video> --approved` | preserve approved final + receipt |
| `aurora clean` | dry-run temp cleanup |
| `aurora clean --yes` | delete only `tmp/` contents |
| `aurora update --check` | future release/update check |

## Community updater target
```bash
aurora update --check
aurora update
aurora config check
aurora config migrate
```

Rules: versioned releases, signed/checksummed release manifest, show changes before migrations, never silently overwrite workspace knowledge, and expose machine-readable update state to agents.
