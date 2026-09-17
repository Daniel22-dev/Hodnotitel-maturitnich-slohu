# Safe Promotion — candidate -> protected main

This repository uses a durable `candidate` branch as the normal update entry point.

Release path:

1. upload/update `candidate`,
2. `p5-release-gate` runs on the candidate SHA,
3. only a GREEN candidate may open/reuse the promotion PR `candidate -> main`,
4. the PR runs the same required `p5-release-gate` again,
5. the Safe Promotion controller merges only the exact GREEN head SHA,
6. production deploy is triggered only by `main`,
7. deploy verifies that the current main SHA is associated with a merged `candidate -> main` PR,
8. the deploy job verifies the actually published release before notifying AI Studio,
9. `app-updated` is emitted only after that live verification passes.

## Live release verification before `app-updated`

`scripts/verify-live-release.mjs` runs between the production deploy and the AI Studio
dispatch. GitHub Pages can need a short moment before the new bytes are readable
everywhere, so a single immediate fetch must not decide a permanent FAIL — but the retry
window is bounded (default 8 attempts with capped backoff and a per-request timeout) and
never loops forever. After the attempts are exhausted the job fails closed and no
`app-updated` event is sent.

The verification requires the expected deployment origin over HTTPS and compares the live
`release-integrity.json` and `studio-manifest.json` against the release identity produced by
the gate: `appId`, `version`, `sourceCommit`, `artifactDigest`, `manifestSha256` and the
SHA-256 of the live manifest bytes themselves.

The dispatch payload then carries that release identity — version, artifact digest, manifest
/ SBOM / provenance / evidence digests, assurance mode and the workflow run — so AI Studio
can bind a promotion to a concrete artifact rather than to a version string. `app_id` is
deliberately unchanged for contract compatibility; the canonical appId is sent alongside it
as `canonical_app_id`.

The merge controller resolves the canonical open `candidate -> main` pull request from the exact GREEN candidate commit association; it does not depend on a runner-local event payload path.

## Required repository governance

`main` must be protected with:

- Require a pull request before merging,
- required status check `p5-release-gate`,
- no required human approval for this automated promotion path,
- administrator/bypass protection enabled so ordinary direct pushes cannot bypass the rule.

The repository secret `SAFE_PROMOTION_TOKEN` is used to create the promotion PR and to perform the verified merge/synchronization after GREEN P5 checks. A non-`GITHUB_TOKEN` credential is required so the resulting merge can trigger the protected `main` push workflows. Use a least-privilege fine-grained token scoped to this repository with Contents: Read and write, Pull requests: Read and write, and repository Metadata: Read. Do not grant Administration permission.

If the secret is missing, the controller fails closed and no promotion PR is created.
