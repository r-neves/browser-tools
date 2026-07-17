# CLAUDE.md

Guidance for working in this repo.

## What this is

A personal Chrome **Manifest V3** extension. **Plain JavaScript, no build step, no
package.json, no bundler.** Chrome loads the files directly (unpacked extension).
Everything lives at the repo root except the Claude skill under `.claude/skills/`.

## Conventions

- **One feature = one content script + one `manifest.json` entry**, scoped to a
  specific site match. `common.js` (an XPath helper) is loaded before most feature
  scripts.
- Injected DOM element IDs are prefixed `ext-` (or `sso-` for Seg-Social).
- No CSS files; styling is inline (`Object.assign(el.style, …)` or `cssText`). The
  command palette is the exception — it uses a **Shadow DOM** for style isolation.
- Curated data lives in `const` tables at the top of the relevant script.
- After changing any extension file, it must be reloaded at `chrome://extensions`
  (or via the palette's "reload" action) — and already-open tabs need refreshing
  to pick up new content scripts.

## Verifying changes

No test runner. For any JS edit, at minimum run `node --check <file>` and, for
`palette_links.js`, evaluate it to confirm entries generate:

```bash
node --check palette_links.js
node -e 'eval(require("fs").readFileSync("palette_links.js","utf8").replace("var PALETTE_ENTRIES","global.PALETTE_ENTRIES")); console.log(PALETTE_ENTRIES.length)'
```

Validate `manifest.json` with `python3 -c "import json,sys; json.load(open(\"manifest.json\"))"`.

## Command palette (the main feature)

Three files, wired through the background worker:

- **`palette_links.js`** — builds one global, `PALETTE_ENTRIES`, an array of
  `{ title, keywords, url }` (or `{ title, keywords, action, hint }` for actions).
  Everything is inside an IIFE because all of this extension's content scripts
  **share one isolated world per page** — a duplicate top-level `const`/`let`
  would be a SyntaxError that kills the script. Only `PALETTE_ENTRIES` is global,
  declared with `var`.
  - GCP: `GCP_PROJECTS` (domain → `env→projectId` map, optional `extra:` services)
    × `GCP_SERVICES`, plus `GCP_SHARED` for cross-env single-service projects.
    `ENV_KW` adds env aliases (so "prod" matches "prd").
  - GitLab: `GITLAB_GROUPS` (group → repos) × `GITLAB_SUBPAGES`.
  - Flat: `JIRA_LINKS`, `CONFLUENCE_LINKS`, `MISC_LINKS`, `ACTIONS`.
- **`palette.js`** — the overlay (all in an IIFE). Shadow DOM host
  `#ext-palette-host`, `attachShadow({ mode: 'open' })` (**open, not closed** — so
  Vimium's insert-mode detection finds the focused input and ignores typed keys).
  Hand-rolled fuzzy scorer: every query token must match (substring beats
  subsequence; word-boundary/earlier-position bonuses). `iconFor()` picks an inline
  brand SVG by destination host (GCP/GitLab). Keydown handler always
  `stopPropagation()`s so the host page/Vimium never see keys typed in the palette.
- **`background.js`** — `chrome.commands.onCommand` (shortcut `Alt+T`) relays a
  `PALETTE_TOGGLE` message to the active tab. `PALETTE_OPEN_TAB` opens a result in
  a new adjacent tab. `PALETTE_ACTION` `reload-extension` stashes the tab id in
  `chrome.storage.local`, calls `chrome.runtime.reload()`, and the storage-read at
  the top of the file (runs on every worker start) reloads that tab afterward so
  the palette works immediately. Requires the `storage` permission.

**Why these choices matter (don't regress them):**
- Shortcut is `chrome.commands`, not a page keydown listener → never collides with
  Vimium. Keep it that way; "space+t"-style leader chords aren't expressible here.
- Shadow root must stay `open`. Icons must stay **inline SVG** (not fetched
  favicons) so they render under strict page CSPs.
- New tabs and `chrome.tabs.query/sendMessage/create` work **without** the `tabs`
  permission (only `storage` is declared). Don't add `tabs` unless reading tab
  `url`/`title`.

## `update-gitlab-repos` skill

`.claude/skills/update-gitlab-repos/` refreshes `GITLAB_GROUPS[].repos` from GitLab.
`update_repos.py` fetches direct-child repos via `glab api groups/<path>/projects`
(NOT `glab repo list --group`, which silently returns nothing for inherited-access
groups), paginated, archived excluded, and rewrites the `GITLAB_GROUPS` block in
place. Bad paths (e.g. a repo mistaken for a group → 404) are skipped with a
warning; every group that resolved is still written. `PALETTE_CONFIG` env var
overrides the target file (for testing on a copy).

## Attribution

Commits/PRs omit Claude attribution (`attribution: { commit: "", pr: "" }` in the
user's global `~/.claude/settings.json`).
