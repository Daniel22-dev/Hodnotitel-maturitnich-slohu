#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync} from 'node:fs';import{join,resolve}from'node:path';
const studio=resolve(process.argv[2]||'../AI-Studio-GHRAB');const cfg=join(studio,'src','config');
if(!existsSync(cfg)){console.error('Použití: node scripts/patch-ai-studio.mjs CESTA_K_REPO_AI_STUDIO');process.exit(1)}
const reg=JSON.parse(readFileSync(new URL('../src/studio-integration/essay-evaluator-registration.json',import.meta.url),'utf8'));
function file(n){return join(cfg,n)}function load(n){return JSON.parse(readFileSync(file(n),'utf8'))}function save(n,x){writeFileSync(file(n),JSON.stringify(x,null,2)+'\n')}
let sources=load('sources.json');if(!sources.some(x=>x.id==='essay-evaluator'))sources.push(reg.source);save('sources.json',sources);
let fallback=load('apps.fallback.json');fallback=fallback.filter(x=>x.id!=='essay-evaluator');fallback.push(reg.fallbackManifest);save('apps.fallback.json',fallback);
let policy=load('access-policy.json');policy.applications['essay-evaluator']=reg.accessPolicy;save('access-policy.json',policy);
let permissions=load('permissions.json');permissions.apps['essay-evaluator']=reg.permission;save('permissions.json',permissions);
console.log('AI Studio doplněno o essay-evaluator ve 4 konfiguračních souborech.');
