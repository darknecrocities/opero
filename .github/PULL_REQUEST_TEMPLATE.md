<!--
PR TITLE FORMAT (enforced by CI):
  <type>(<scope>): <short imperative summary>
  Examples:
    feat(studio): add spotlight opacity slider
    fix(rag): clamp zero-norm query vectors
    docs(license): add Japanese MIT reference translation
    ci(release): publish macOS dmg and Windows exe artifacts
-->

## Why
<!-- Briefly explain the user problem, MMI requirement, or bug root cause. -->

## What Changed
<!-- Bullet list of concrete changes grouped by crate/package/app. -->
-

## Type of Change
- [ ] `feat` — New user-facing capability
- [ ] `fix` — Bug fix (includes regression test)
- [ ] `docs` — Documentation, README, license, or governance
- [ ] `ci` — CI/CD, linting, maintainability, or installer distribution
- [ ] `refactor` — Structural improvement without behavior change
- [ ] `test` — Test coverage or stress/E2E suite expansion

## Verification Evidence
<!-- Paste measured outputs from local checks. -->
- [ ] `python3 scripts/check_maintainability.py --strict`
- [ ] `cargo test --workspace`
- [ ] `pnpm typecheck && pnpm test:vitest`
- [ ] `python3 -m unittest discover -s tests`
- [ ] `pnpm --filter @opero/desktop test:e2e` (if UI/routing changed)

## Maintainability & Security Checklist
- [ ] Every modified/added source file is strictly under the 500-line ceiling (target 150–300 lines)
- [ ] Zero secrets, `.env`, SQLite DBs (`*.sqlite*`), model weights, or raw captures staged
- [ ] Zero raw emojis inside interactive UI controls; every `<button>` specifies `type="button|submit"`
- [ ] Offline-first & local-only invariants preserved (`OPERO_OFFLINE_STRICT=true`, zero cloud leakage)
- [ ] Any reversible Studio blur vs. irreversible export redaction changes verified

## Rollback Plan
<!-- State how to safely revert this PR if issues arise post-merge. -->
Revert this PR commit on the target branch; database migrations remain additive and backward-compatible.
