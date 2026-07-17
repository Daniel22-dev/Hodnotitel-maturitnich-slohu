import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
async function collect(dir){let out="";for(const e of await readdir(dir,{withFileTypes:true}).catch(()=>[])){const p=path.join(dir,e.name);if(e.isDirectory())out+=await collect(p);else if(/\.(?:js|mjs|html|md)$/.test(e.name))out+='\n'+await readFile(p,'utf8').catch(()=>"");}return out;}
export async function validateScenario(s,{root}) {
  const source=(await collect(path.join(root,"src")))+(await collect(path.join(root,"tests")))+(await collect(path.join(root,"scripts")));
  const checks=[/PTN1/i,/PTN2/i,/PTN3/i,/(word|slov).{0,30}(count|počet)/i,/(B2|známk|grade)/i,/osm|eight/i];
  const pass=checks.every(r=>r.test(source));
  return {pass,evidence:`${s.input}/${s.length}/${s.assignment}/${s.ptn}/${s.aiIndicator}; rubricInvariants=${pass}`};
}
