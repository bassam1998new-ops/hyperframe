# AurorA Studio — Obsidian Knowledge UI

Obsidian is an optional UI for AurorA Studio's knowledge files.

## Principle
AurorA's source of truth is plain Markdown + JSON on disk.
Obsidian must never become required for the agent to work.

## If Obsidian is available
Use it to:
- browse the Studio brain
- search notes
- inspect linked skills/styles/lessons
- review/edit Markdown knowledge
- navigate project knowledge visually

The official Obsidian CLI may be used when installed.

## If Obsidian is missing
Do nothing. Agents continue reading/writing the same files directly.

## Vault
Prefer making the AurorA knowledge root readable as an Obsidian vault rather than duplicating knowledge into a second database.

## Do not
- store secrets in notes
- make Obsidian plugins mandatory for core behavior
- depend on proprietary plugin data formats for important Studio memory
