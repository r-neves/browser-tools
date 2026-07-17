---
name: update-gitlab-repos
description: Refresh the GitLab repo lists in the command palette's config (palette_links.js GITLAB_GROUPS) from GitLab using the `glab` CLI. Use when the user wants to add a new GitLab group to the palette, or pull in newly-created repos for groups already listed (e.g. "update the gitlab repos", "add group X to the palette", "refresh the palette repos").
---

# Update GitLab repos in the command palette

Fills the `repos` arrays in `palette_links.js` → `GITLAB_GROUPS` by querying GitLab
with `glab`, so newly-created repos show up in the palette without hand-editing.

Only **direct children** of each group are listed (subgroups are not descended
into) — this keeps palette titles clean (`repo-name Pipelines`) and matches the
config's flat `gitlab.com/{group}/{repo}` URL model. To include a subgroup's
repos, add that subgroup's full path as its own group.

## Prerequisites

- `glab` installed and authenticated. If a run fails with an auth error, the user
  must run `glab auth login` themselves (interactive) — suggest they type
  `! glab auth login` in the prompt.

## How to run

The helper script does the fetch and rewrites the config. From the repo root:

- **Add or refresh specific groups** — pass full namespace paths:
  ```
  python3 .claude/skills/update-gitlab-repos/update_repos.py <group-path> [<group-path> ...]
  ```
  Example:
  ```
  python3 .claude/skills/update-gitlab-repos/update_repos.py cynergybank/data-and-analytics/tools-and-utilities
  ```
  Each passed group's `repos` list is replaced with the current GitLab state. A
  group not already in the config is appended; groups already present but not
  passed are left untouched.

- **Refresh every group already in the config** — no arguments:
  ```
  python3 .claude/skills/update-gitlab-repos/update_repos.py
  ```

## Steps

1. Determine the group path(s). If the user named a group, pass it. If they said
   "refresh"/"update the repos" without naming one, run with no arguments.
2. Run the script (see above). It prints per-group counts to stderr and a summary.
3. Report the result: which groups changed and how many repos each has. If a group
   returned 0 repos, tell the user (likely wrong path, no access, or repos live in
   subgroups — which are not descended into by design).
4. Remind them to reload the extension at `chrome://extensions` so the palette
   picks up the new `palette_links.js`.

## Notes

- The script replaces each group's `repos` wholesale, so repos deleted on GitLab
  are removed here too. It never touches GCP / Jira / Confluence entries or any
  group it wasn't asked to update.
- `repos` is sorted and deduped. Repo slugs come from the `path` field of
  `glab repo list --group <g> -F json` (paginated).
