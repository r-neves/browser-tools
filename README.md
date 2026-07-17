# Browser Tools

A personal Chrome (MV3) extension that augments a handful of sites with small
productivity helpers, plus a **Spotlight-style command palette** for jumping to
frequently-used pages (GCP, GitLab, Jira, Confluence).

Plain JavaScript, no build step. Load it as an unpacked extension:
`chrome://extensions` → enable Developer mode → **Load unpacked** → pick this folder.

## Command palette

A fuzzy-search overlay for jumping to pages you don't have open.

- **Open/close:** `Alt+T` (Option+T on Mac). Configured via `chrome.commands`, so
  the browser handles the shortcut before any page sees it — it never collides
  with Vimium. Re-bind at `chrome://extensions/shortcuts`.
- **Search:** type space-separated keywords, e.g. `cloudrun aix uat`,
  `data logs prod`, `accounts pipelines`, `salesforce tags`.
- **Open:** `Enter` = new tab (next to the current one), `Cmd+Enter` = current tab,
  `Esc` / click-outside = close. Arrows or `Ctrl+N`/`Ctrl+P` move the selection.
- GCP and GitLab results show their brand icon for quick scanning.

The palette runs on all pages (except `chrome://`, the Web Store, and the PDF
viewer, where content scripts can't run).

### Editing the destinations

All destinations are generated from small config tables at the top of
[`palette_links.js`](palette_links.js) — edit a table, then reload the extension.

- **GCP** — `GCP_PROJECTS` (one row per domain: `data` / `app` / `aix`, each with
  its own `env → projectId` map) crossed with `GCP_SERVICES` (Cloud Run, Storage,
  Artifact Registry, Logs, Pub/Sub, BigQuery, IAM, Secrets, Cloud SQL, Monitoring,
  Load Balancing). A domain can add `extra:` entries for a service view it always
  wants (e.g. `data` → Cloud Run **Jobs**, `aix` → Cloud Run **Services**).
  `GCP_SHARED` holds cross-env projects that expose only specific services
  (e.g. the `ssv` shared-infra project → Artifact Registry only).
- **GitLab** — `GITLAB_GROUPS` (group path → repo list) crossed with
  `GITLAB_SUBPAGES` (Repo, Pipelines, Merge Requests, Branches, Tags).
- **Jira / Confluence / misc** — flat lists (`JIRA_LINKS`, `CONFLUENCE_LINKS`,
  `MISC_LINKS`).
- **Actions** — `ACTIONS` entries run a command instead of opening a URL. Currently:
  **Reload Browser Tools extension** (search "reload"), which reloads the extension
  and auto-refreshes the current tab so the palette works immediately.

### Keeping GitLab repos current

New repos appear in groups over time. The
[`update-gitlab-repos`](.claude/skills/update-gitlab-repos/) Claude Code skill
refreshes the `repos` lists from GitLab via the `glab` CLI:

```bash
# add/refresh specific groups
python3 .claude/skills/update-gitlab-repos/update_repos.py <group-path> ...
# refresh every group already in the config
python3 .claude/skills/update-gitlab-repos/update_repos.py
```

Lists only direct-child repos of each group; archived repos are excluded. Requires
`glab` installed and authenticated (`glab auth login`).

## Per-site helpers

Each is a content script scoped to one site (see [`manifest.json`](manifest.json)):

| Script | Site | What it does |
|---|---|---|
| `financas_home_shortcuts.js` | Portal das Finanças home | Injects quick-link cards |
| `seg_social_home.js` | Segurança Social home | Injects quick-link cards |
| `seg_social_login.js` | Segurança Social login | Auto-fills the OTP (via a Gmail broker) |
| `acesso_gov_login.js` | acesso.gov.pt login | Focuses the login field |
| `efatura_weekday.js` | e-Fatura pendências | Annotates dates with the weekday |
| `jira_copy_ticket.js` | Jira browse | "Copy ticket ID" button |
| `youtube_summarize.js` | YouTube watch | "Summarize" button → claude.ai |
| `create_mr.js` | GitLab new MR | Auto-checks "squash commits" |
| `mr_in_review.js` | GitLab MR | (disabled) MR → Jira link |
| `mrocare_fill_quote.js` | mrocare.pt quote form | Test form filler |

## OTP broker

`seg_social_login.js` fetches the OTP through [`background.js`](background.js)
(cross-origin fetch, no page CORS), which calls a Google Apps Script deployed
separately from [`seg_social_otp_broker.gs`](seg_social_otp_broker.gs). Set
`BROKER_URL` / `BROKER_TOKEN` at the top of `seg_social_login.js`.
