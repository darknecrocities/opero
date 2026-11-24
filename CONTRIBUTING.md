# Contributing to OPERO

OPERO follows strict local-first engineering discipline, a 500-line physical ceiling per source file, and verifiable Conventional Commits.

## Branching Model

| Branch Pattern | Purpose |
| :--- | :--- |
| `main` | Stable, release-ready production baseline. |
| `develop` | Integration branch for reviewed Release 1 features. |
| `feat/<scope>` | New features (e.g. `feat/opero-agent-skills`). |
| `fix/<scope>` | Bug fixes with regression tests. |
| `docs/<scope>` | Documentation, README, license, and governance updates. |
| `ci/<scope>` | CI/CD workflows, linters, and release distribution pipelines. |
| `refactor/<scope>` | Structural refactors (e.g. decomposing files approaching 350 lines). |

## Pull Request Title Convention

Every PR title is validated automatically by `.github/workflows/pr-title-lint.yml`:

```text
<type>(<scope>): <imperative summary>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Examples:
- `feat(studio): add keyboard nudge shortcuts for vector annotations`
- `fix(capture): prevent duplicate event sequence on rapid clicks`
- `ci(release): automate macOS .dmg and Windows .exe distribution`

## Pre-PR Verification Checklist

Before opening or updating a Pull Request, run:

```bash
python3 scripts/check_maintainability.py --strict
bash scripts/verify_all_skills.sh
```
