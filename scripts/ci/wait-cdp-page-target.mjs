// Wait until a launched Chromium exposes a genuine page CDP target.
// /json/version can be ready before /json contains its initial about:blank page.
import { setTimeout as sleep } from 'node:timers/promises';

export async function waitCdpPageTarget(url, {
  fetchImpl = fetch,
  now = Date.now,
  delay = sleep,
  timeoutMs = 12000,
  pollMs = 50,
} = {}) {
  if (!/^http:\/\/127\.0\.0\.1:\d{1,5}\/json$/.test(url)) {
    throw new Error('CDP page target URL must be a loopback JSON endpoint');
  }
  if (!(Number.isFinite(timeoutMs) && timeoutMs > 0 && timeoutMs <= 60000)) {
    throw new Error('Invalid CDP page target timeout');
  }
  const deadline = now() + timeoutMs;
  do {
    try {
      const remaining = Math.max(1, deadline - now());
      const response = await fetchImpl(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(Math.min(1500, remaining)),
      });
      if (response.ok) {
        const targets = await response.json();
        if (Array.isArray(targets)) {
          const page = targets.find((target) =>
            target?.type === 'page' &&
            typeof target.webSocketDebuggerUrl === 'string' &&
            /^wss?:\/\//.test(target.webSocketDebuggerUrl)
          );
          if (page) return page;
        }
      }
    } catch {
      // Chromium's localhost CDP listener can be transiently unavailable.
    }
    const remaining = deadline - now();
    if (remaining <= 0) break;
    await delay(Math.min(pollMs, remaining));
  } while (now() < deadline);
  throw new Error('Chromium page target timeout (no page WebSocket exposed)');
}
