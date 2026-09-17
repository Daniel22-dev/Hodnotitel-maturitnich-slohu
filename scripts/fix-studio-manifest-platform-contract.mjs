#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const consumer = JSON.parse(fs.readFileSync(path.join(root, 'ghrab-platform.consumer.json'), 'utf8'));

const allowedStudioBridge = new Set(['ghrab-studio-handoff-v2', 2, 'not-applicable']);
const allowedArtifactEnvelope = new Set(['ghrab-artifact-envelope-v1', 1]);
const targets = ['studio-manifest.json', 'app-manifest.json'];
let processed = 0;

for (const name of targets) {
  const target = path.join(dist, name);
  if (!fs.existsSync(target)) continue;

  const manifest = JSON.parse(fs.readFileSync(target, 'utf8'));
  const previous = manifest.platform && typeof manifest.platform === 'object' ? manifest.platform : {};
  const studioBridge = previous.studioBridge ?? manifest.compatibility?.studioBridge ?? consumer.bridge.contract;
  const artifactEnvelope = previous.artifactEnvelope ?? consumer.artifact.schema;

  manifest.platform = {
    ...previous,
    schema: 'ghrab-platform-app-integration-v1',
    contract: consumer.platform.contract,
    requiredPlatformRange: consumer.platform.requiredRange,
    platformVersion: consumer.platform.version,
    brandVersion: consumer.brand.version,
    themeContract: 'ghrab-theme-v1',
    swContract: 1,
    studioBridge,
    artifactEnvelope,
    storagePrefix: `ghrab.${consumer.appId}.`,
    cacheName: consumer.cache.name,

    // Compatibility aliases retained for the P3 runtime/tooling layer.
    requiredRange: consumer.platform.requiredRange,
    storageContract: 'ghrab-storage-namespace-v1',
    bridgeContract: consumer.bridge.contract,
    artifactContract: consumer.artifact.schema,
    accessibilityContract: consumer.quality.accessibilityContract,
    performanceContract: consumer.quality.performanceContract,
    moduleContract: consumer.quality.moduleContract,
  };

  const platform = manifest.platform;
  const failures = [];
  if (platform.schema !== 'ghrab-platform-app-integration-v1') failures.push('schema');
  if (platform.contract !== 'ghrab-platform-v1') failures.push('contract');
  if (platform.requiredPlatformRange !== consumer.platform.requiredRange) failures.push('requiredPlatformRange');
  if (platform.platformVersion !== consumer.platform.version) failures.push('platformVersion');
  if (platform.brandVersion !== consumer.brand.version) failures.push('brandVersion');
  if (platform.themeContract !== 'ghrab-theme-v1') failures.push('themeContract');
  if (platform.swContract !== 1) failures.push('swContract');
  if (!allowedStudioBridge.has(platform.studioBridge)) failures.push('studioBridge');
  if (!allowedArtifactEnvelope.has(platform.artifactEnvelope)) failures.push('artifactEnvelope');
  if (platform.storagePrefix !== `ghrab.${consumer.appId}.`) failures.push('storagePrefix');
  if (platform.cacheName !== consumer.cache.name) failures.push('cacheName');
  if (manifest.compatibility?.platformRange !== consumer.platform.requiredRange) failures.push('compatibility.platformRange');

  if (failures.length) {
    throw new Error(`Studio manifest platform contract FAIL (${name}): ${failures.join(', ')}`);
  }

  fs.writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
  processed += 1;
}

if (processed === 0) {
  throw new Error('Studio manifest platform contract FAIL: v dist/ chybi studio-manifest.json i app-manifest.json.');
}

console.log(`[studio-manifest-contract] PASS · ${processed} manifest(u) · ${consumer.appId} ${consumer.appVersion}`);
