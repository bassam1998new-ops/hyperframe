import fs from "node:fs";
import path from "node:path";

const GITIGNORE = `# AurorA Studio workspace memory is private/machine-local by default.
# Deliberately promote reviewed, shareable knowledge into normal tracked project files.
*
!.gitignore
!README.md
`;

const README = `# .aurora workspace

This folder contains AurorA Studio's local project brain and runtime state.

It may include:
- product/project context
- local file paths
- provider availability
- references and asset metadata
- run history and review frames
- usage/cost records
- learning/decision logs
- managed runtime/tool files

For privacy and repository hygiene, this folder is ignored by Git by default.

If a team wants to share stable AurorA knowledge, review it first and promote the useful parts into normal tracked project documentation, brand/style files, or another deliberately shared location.

Do not commit passwords, API keys, cookies, session tokens, private client media, or machine-specific secrets.
`;

export function ensureWorkspacePrivacyFiles(cwd = process.cwd()) {
  const aurora = path.join(cwd, ".aurora");
  fs.mkdirSync(aurora, { recursive: true });

  const gitignore = path.join(aurora, ".gitignore");
  const readme = path.join(aurora, "README.md");

  if (!fs.existsSync(gitignore)) fs.writeFileSync(gitignore, GITIGNORE);
  if (!fs.existsSync(readme)) fs.writeFileSync(readme, README);

  return { gitignore, readme };
}
