#!/usr/bin/env python3
"""Refresh the GITLAB_GROUPS repo lists in palette_links.js using `glab`.

Usage:
    python3 update_repos.py                       # refresh repos for every group already in the config
    python3 update_repos.py <group> [<group> ...] # add/refresh only the given group path(s)

A "group" is a full GitLab namespace path, e.g.
    cynergybank/data-and-analytics/ingestion-pipelines

Only repos that are DIRECT children of the group are listed (subgroups are not
descended into) — this keeps palette titles clean (`repo-name Pipelines`) and
matches the config's flat `gitlab.com/{group}/{repo}` URL model. To include a
subgroup's repos, add that subgroup's full path as its own group.

Repos are fetched via the GitLab API (`glab api groups/<path>/projects`), which
is reliable for inherited-access groups; `glab repo list --group` silently
returns nothing for those. Archived repos are excluded.

Groups that don't resolve (e.g. a path that is actually a repo, or no access)
are skipped with a warning — every group that DID resolve is still written.
"""

import json
import os
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

# Repo root is three levels up: .claude/skills/update-gitlab-repos/ -> repo root.
# PALETTE_CONFIG overrides the target file (used for testing).
CONFIG = Path(os.environ.get("PALETTE_CONFIG")
               or Path(__file__).resolve().parents[3] / "palette_links.js")
PER_PAGE = 100

# Matches:  const GITLAB_GROUPS = [ ...anything... \n    ];
BLOCK_RE = re.compile(r"const GITLAB_GROUPS = \[.*?\n    \];", re.DOTALL)


class GroupError(Exception):
    """A single group could not be listed (skip it, keep the rest)."""


def fail(msg: str) -> "None":
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def list_repos(group: str) -> list:
    """Return sorted repo slugs that are DIRECT children of `group`.

    Raises GroupError if the group path does not resolve (404) or glab errors.
    """
    enc = urllib.parse.quote(group, safe="")
    repos = set()
    page = 1
    while True:
        # No include_subgroups -> direct children only. archived=false -> skip dead repos.
        endpoint = (f"groups/{enc}/projects"
                    f"?per_page={PER_PAGE}&page={page}"
                    f"&archived=false&order_by=path&sort=asc&simple=true")
        proc = subprocess.run(["glab", "api", endpoint], capture_output=True, text=True)
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout).strip().splitlines()
            first = err[0] if err else "unknown error"
            if "404" in first:
                raise GroupError(f"'{group}' is not a group (a repo path, typo, or no access)")
            raise GroupError(f"glab api failed for '{group}': {first}")
        try:
            batch = json.loads(proc.stdout or "[]")
        except json.JSONDecodeError:
            raise GroupError(f"could not parse glab JSON for '{group}'")
        if not batch:
            break
        for r in batch:
            slug = r.get("path")
            if slug:
                repos.add(slug)
        if len(batch) < PER_PAGE:
            break
        page += 1
    return sorted(repos)


def js_str(s: str) -> str:
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def render_block(groups: list) -> str:
    """Build the `const GITLAB_GROUPS = [...]` source block (matching file style)."""
    lines = ["const GITLAB_GROUPS = ["]
    for g in groups:
        repos = ", ".join(js_str(r) for r in g["repos"])
        note = "" if g["repos"] else "  // no repos found"
        lines.append(f"        {{ group: {js_str(g['group'])}, repos: [{repos}] }},{note}")
    lines.append("    ];")
    return "\n".join(lines)


def main() -> "None":
    if not CONFIG.exists():
        fail(f"config not found at {CONFIG}")
    src = CONFIG.read_text()

    m = BLOCK_RE.search(src)
    if not m:
        fail("could not locate the `const GITLAB_GROUPS = [...]` block in palette_links.js")

    old_block = m.group(0)
    existing_order = re.findall(r"group:\s*'([^']*)'", old_block)
    existing_repos = dict(zip(
        existing_order,
        [re.findall(r"'([^']*)'", chunk)
         for chunk in re.findall(r"repos:\s*\[([^\]]*)\]", old_block)],
    ))

    args = sys.argv[1:]
    if args:
        targets = args
        order = existing_order + [g for g in args if g not in existing_order]
    else:
        if not existing_order:
            fail("no groups in the config and none passed as arguments.\n"
                 "Pass one or more group paths, e.g.:\n"
                 "  python3 update_repos.py cynergybank/data-and-analytics/ingestion-pipelines")
        targets = existing_order
        order = existing_order

    fetched, skipped = {}, []
    for g in dict.fromkeys(targets):  # dedupe, keep order
        print(f"fetching repos for {g} ...", file=sys.stderr)
        try:
            fetched[g] = list_repos(g)
            print(f"  -> {len(fetched[g])} repos", file=sys.stderr)
        except GroupError as e:
            skipped.append((g, str(e)))
            print(f"  ! skipped: {e}", file=sys.stderr)

    # Keep a group in the config if it resolved now, or already had repos.
    # Drop groups that were requested but failed AND have nothing to fall back to.
    groups = []
    for g in order:
        if g in fetched:
            groups.append({"group": g, "repos": fetched[g]})
        elif g in existing_repos and existing_repos[g]:
            groups.append({"group": g, "repos": existing_repos[g]})
        # else: requested-but-failed with no prior repos -> omit from config

    new_block = render_block(groups)
    CONFIG.write_text(src[:m.start()] + new_block + src[m.end():])

    total = sum(len(x["repos"]) for x in groups)
    print(f"updated {CONFIG.name}: {len(groups)} groups, {total} repos total")
    if skipped:
        print("\nskipped (left out of the config):", file=sys.stderr)
        for g, why in skipped:
            print(f"  - {g}\n      {why}", file=sys.stderr)


if __name__ == "__main__":
    main()
