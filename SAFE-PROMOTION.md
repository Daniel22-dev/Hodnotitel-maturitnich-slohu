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
8. `app-updated` is emitted only after successful production deployment.

## Required repository governance

`main` must be protected with:

- Require a pull request before merging,
- required status check `p5-release-gate`,
- no required human approval for this automated promotion path,
- administrator/bypass protection enabled so ordinary direct pushes cannot bypass the rule.

The repository secret `SAFE_PROMOTION_TOKEN` is used to create the promotion PR and to perform the verified merge/synchronization after GREEN P5 checks. A non-`GITHUB_TOKEN` credential is required so the resulting merge can trigger the protected `main` push workflows. Use a least-privilege fine-grained token scoped to this repository with Contents: Read and write, Pull requests: Read and write, and repository Metadata: Read. Do not grant Administration permission.

If the secret is missing, the controller fails closed and no promotion PR is created.
