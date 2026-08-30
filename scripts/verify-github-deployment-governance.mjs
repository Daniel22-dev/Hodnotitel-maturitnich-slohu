#!/usr/bin/env node
const isActions=process.env.GITHUB_ACTIONS==='true';
if(!isActions){console.log('GITHUB GOVERNANCE SKIP: mimo GitHub Actions');process.exit(0);}
const repo=String(process.env.GITHUB_REPOSITORY||'').trim();
const ref=String(process.env.GITHUB_REF_NAME||'').trim();
const token=String(process.env.GITHUB_TOKEN||'').trim();
if(!repo||!ref||!token){console.error('GITHUB GOVERNANCE FAIL: chybí GITHUB_REPOSITORY/GITHUB_REF_NAME/GITHUB_TOKEN');process.exit(1);}
if(ref!=='main'){console.error('GITHUB GOVERNANCE FAIL: veřejný deploy je povolen pouze z main');process.exit(1);}
const url=`https://api.github.com/repos/${repo}/branches/${encodeURIComponent(ref)}`;
const response=await fetch(url,{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'},redirect:'error'});
if(!response.ok){console.error(`GITHUB GOVERNANCE FAIL: branch metadata HTTP ${response.status}`);process.exit(1);}
const branch=await response.json();
if(branch?.protected!==true){console.error('GITHUB GOVERNANCE FAIL: main není chráněná; veřejný deploy je bezpečně zablokován');process.exit(1);}
console.log('GITHUB GOVERNANCE PASS: main je chráněná');
