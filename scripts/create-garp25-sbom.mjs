#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve('.');
const out=path.resolve(process.argv[2]||'security/garp251/sbom.cdx.json');
const pkg=JSON.parse(await fsp.readFile(path.join(root,'package.json'),'utf8'));
const lock=JSON.parse(await fsp.readFile(path.join(root,'package-lock.json'),'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const decodeIntegrity=(s='')=>{const m=/^(sha(?:256|384|512))-(.+)$/i.exec(s);if(!m)return null;return {alg:m[1].toUpperCase().replace('SHA','SHA-'),content:Buffer.from(m[2],'base64').toString('hex')}};
const components=[];const dependencies=[];
const rootRef=`pkg:npm/${pkg.name}@${pkg.version}`;
const keyToRef=new Map();
for(const [key,v] of Object.entries(lock.packages||{})){
  if(!key)continue;
  const name=key.replace(/^node_modules\//,'');
  const purl=`pkg:npm/${encodeURIComponent(name).replace('%2F','/')}@${v.version}`;
  keyToRef.set(key,purl);
  const integ=decodeIntegrity(v.integrity);
  const c={type:'library',name,version:v.version,'bom-ref':purl,purl,scope:'required',properties:[{name:'ghrab:dependencyRole',value:(pkg.devDependencies||{})[name]?'dev-build':'transitive-build'}]};
  if(integ)c.hashes=[integ];
  if(v.license)c.licenses=[{license:{id:v.license}}];
  components.push(c);
}
for(const [key,v] of Object.entries(lock.packages||{})){
  if(!key)continue;const ref=keyToRef.get(key);const deps=[];
  for(const depName of Object.keys(v.dependencies||{})){
    const target=keyToRef.get(`node_modules/${depName}`);if(target)deps.push(target);
  }
  for(const depName of Object.keys(v.optionalDependencies||{})){
    const target=keyToRef.get(`node_modules/${depName}`);if(target&&!deps.includes(target))deps.push(target);
  }
  dependencies.push({ref,dependsOn:deps.sort()});
}
const rootDeps=Object.keys({...pkg.dependencies,...pkg.devDependencies}).map(n=>keyToRef.get(`node_modules/${n}`)).filter(Boolean).sort();
dependencies.unshift({ref:rootRef,dependsOn:rootDeps});
for(const [name,version,rel] of [
  ['GHRAB AI Core','1.0.0','vendor/ghrab-ai-core-1.0.0/ghrab-ai-core-1.0.0.js'],
  ['GHRAB Platform','1.1.2','vendor/ghrab-platform-1.1.2/ghrab-platform.js'],
  ['JSZip','3.10.1','src/vendor/jszip.min.js']
]){
  const ref=`urn:ghrab:vendored:${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}:${version}`;
  const c={type:'library',name,version,'bom-ref':ref,hashes:[{alg:'SHA-256',content:sha256(path.join(root,rel))}],properties:[{name:'ghrab:vendoredPath',value:rel}]};
  if(name==='JSZip')c.licenses=[{license:{id:'MIT'}}];
  components.push(c);dependencies[0].dependsOn.push(ref);dependencies.push({ref,dependsOn:[]});
}
dependencies[0].dependsOn=[...new Set(dependencies[0].dependsOn)].sort();
const bom={
  bomFormat:'CycloneDX',specVersion:'1.7',serialNumber:`urn:uuid:${crypto.randomUUID()}`,version:1,
  metadata:{timestamp:new Date().toISOString(),tools:{components:[{type:'application',name:'GHRAB GARP 2.5 SBOM generator',version:'1.0.0'}]},component:{type:'application',name:pkg.name,version:pkg.version,'bom-ref':rootRef,purl:rootRef},properties:[{name:'ghrab:lockfileSha256',value:sha256(path.join(root,'package-lock.json'))},{name:'ghrab:profile',value:'SHIELD-PREP'}]},
  components,dependencies
};
await fsp.mkdir(path.dirname(out),{recursive:true});
await fsp.writeFile(out,JSON.stringify(bom,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',output:out,components:components.length,lockPackages:Object.keys(lock.packages||{}).length-1,sha256:sha256(out)},null,2));
