// Deterministic timestamp for content-addressed builds. This is a source-build
// identity, not evidence of when Pages finished publishing.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

function epochToIso(raw) {
  if (!/^(?:0|[1-9]\d{0,11})$/.test(String(raw || ''))) {
    throw new Error('SOURCE_DATE_EPOCH must be a nonnegative integer (seconds)');
  }
  const milliseconds = Number(raw) * 1000;
  if (!Number.isSafeInteger(milliseconds) || milliseconds > 8640000000000000) {
    throw new Error('SOURCE_DATE_EPOCH is outside the supported UTC date range');
  }
  return new Date(milliseconds).toISOString();
}

export function sourceBuildTime({ root, env = process.env, git = execFileSync } = {}) {
  // CI always derives the time from its checked-out HEAD. User-set overrides
  // cannot silently perturb the same-SHA Pages digest in a protected release.
  if (env.GITHUB_ACTIONS === 'true') {
    let timestamp;
    try {
      timestamp = git('git', ['log', '-1', '--format=%ct', 'HEAD'], {
        cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch (error) {
      throw new Error('Cannot resolve checked-out commit timestamp for CI build: ' + error.message);
    }
    return epochToIso(timestamp);
  }
  if (env.SOURCE_DATE_EPOCH !== undefined) return epochToIso(env.SOURCE_DATE_EPOCH);
  // Source ZIPs have no .git. The tracked registration provides a stable
  // source timestamp rather than silently falling back to wall-clock time.
  const registration = JSON.parse(readFileSync(join(root, 'src/studio-integration/essay-evaluator-registration.json'), 'utf8'));
  const candidate = registration?.fallbackManifest?.publishedAt;
  const time = Date.parse(candidate);
  if (typeof candidate !== 'string' || !Number.isFinite(time) || new Date(time).toISOString() !== candidate) {
    throw new Error('Tracked registration publishedAt must be a canonical ISO UTC timestamp');
  }
  return candidate;
}
