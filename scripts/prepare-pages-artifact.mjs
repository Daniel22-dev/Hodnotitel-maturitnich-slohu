#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const dist=path.join(root,'dist');
if(!fs.existsSync(dist)) throw new Error('Chybí dist/. Nejprve spusť build a QA.');
const explicit=[
  'quality-report.json','qa-p3-browser-report.json','qa-p3-reflow-runtime-report.json','qa-p3-axe-report.json',
  'qa-p4-a11y-report.json','qa-p4-release-report.json','qa-p5-runtime-report.json','qa-p5-xss-sinks-report.json',
  'qa-p5-axe-runtime-report.json','qa-p5-release-report.json','qa-p5-acceptance-report.json','config/quality-manifest.json'
];
for(const rel of explicit) fs.rmSync(path.join(dist,...rel.split('/')),{force:true});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?walk(p):[p]});}
const forbidden=walk(dist).filter(file=>{
  const rel=path.relative(dist,file).split(path.sep).join('/');
  return /(?:^|\/)qa-[^/]*\.json$/i.test(rel)||/(?:^|\/)(?:quality-report|quality-manifest)\.json$/i.test(rel);
});
if(forbidden.length) throw new Error(`Ve veřejném Pages artefaktu zůstaly QA soubory: ${forbidden.map(f=>path.relative(dist,f)).join(', ')}`);
console.log('Pages artifact clean: QA-only reporty byly odstraněny z dist/.');
