import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyQaRelease} from '../scripts/ci/verify-qa-release-evidence.mjs';

const sha = 'a'.repeat(40);
const gates = ['project','technical','security','pwa','combinatorial','visual','critical'];
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ghrab-qa-parallel-'));
  fs.mkdirSync(path.join(root, 'qa-results'));
  fs.mkdirSync(path.join(root, 'qa'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({version:'1.5.30'}));
  fs.writeFileSync(path.join(root, 'qa/qa-manifest.json'), JSON.stringify({appId:'essay-evaluator',appVersion:'1.5.30',standard:'GHRAB-QA-1.0.2'}));
  const report = {appId:'essay-evaluator',version:'1.5.30',qaStandard:'GHRAB-QA-1.0.2',commit:sha,
    verdict:'AUTOMATED_READY',automaticVerdict:'AUTOMATED_READY',buildSha256:'b'.repeat(64),
    gates:gates.map(name=>({name,status:'PASS',findings:[]})),counts:{PASS:7,WARN:0,FAIL:0},blockerAndMajor:[]};
  fs.writeFileSync(path.join(root,'qa-results/qa-report.json'),JSON.stringify(report));
  fs.writeFileSync(path.join(root,'qa-results/release-verdict.txt'),'AUTOMATED_READY\n');
  return {root, report};
}
const clean = root=>fs.rmSync(root,{force:true,recursive:true});
const verify = root=>verifyQaRelease({root,sourceSha:sha,checkedOutSha:sha,runId:'123'});
const save = (root,report)=>fs.writeFileSync(path.join(root,'qa-results/qa-report.json'),JSON.stringify(report));

test('PASS QA release creates same-SHA digest-linked receipt',()=>{
  const {root}=fixture();
  try {
    const result=verify(root);
    assert.equal(result.status,'PASS'); assert.equal(result.requiredGateCount,7);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root,'qa-results/qa-release-ci-receipt.json'))).sourceSha,sha);
  } finally {clean(root);}
});
test('different checkout SHA blocks parallel admission',()=>{
  const {root}=fixture();try{assert.throws(()=>verifyQaRelease({root,sourceSha:sha,checkedOutSha:'c'.repeat(40)}),/SHA/);}finally{clean(root);}
});
test('missing required QA gate is blocking',()=>{
  const {root,report}=fixture();try{report.gates.pop();save(root,report);assert.throws(()=>verify(root),/gate critical/);}finally{clean(root);}
});
test('any FAIL gate or blocker is blocking',()=>{
  const {root,report}=fixture();try{report.gates[0].status='FAIL';report.counts.FAIL=1;save(root,report);assert.throws(()=>verify(root),/gate project/);}finally{clean(root);}
});
test('stale report commit and mismatched verdict are blocking',()=>{
  const {root,report}=fixture();try{report.commit='b'.repeat(40);save(root,report);assert.throws(()=>verify(root),/identity/);report.commit=sha;save(root,report);fs.writeFileSync(path.join(root,'qa-results/release-verdict.txt'),'NOT_READY\n');assert.throws(()=>verify(root),/not ready/);}finally{clean(root);}
});
test('missing QA report and malformed digest are blocking',()=>{
  const {root,report}=fixture();try{report.buildSha256='corrupt';save(root,report);assert.throws(()=>verify(root),/SHA-256/);fs.rmSync(path.join(root,'qa-results/qa-report.json'));assert.throws(()=>verify(root),/missing QA report/);}finally{clean(root);}
});
