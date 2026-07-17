import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function validateSecurity({root, finding}) {
  const read=rel=>readFile(path.join(root,rel),'utf8');
  const [access,sw,contract,manual,workflow,stateUi,release,privacy,tests]=await Promise.all([
    read('src/access-bootstrap.js'),read('src/sw.js'),read('src/js/45-evaluation-contract.js'),
    read('src/js/50-wordcount-offline.js'),read('src/js/65-evaluation-workflow.js'),
    read('src/js/95-workflow-ui.js'),read('src/js/00-release-rubric.js'),read('src/js/30-privacy-input.js'),read('tests/test.mjs')
  ]);
  const findings=[];
  const require=(ok,code,message,evidence='')=>{if(!ok)findings.push(finding('security','MAJOR',code,message,evidence));};
  require(!/Nouzový offline režim|addOfflineWarning/.test(access) && !/catch\s*\([^)]*\)\s*\{[\s\S]{0,350}loadApplication\s*\(/.test(access),'OFFLINE_GUARD_FAIL_OPEN','Hodnotitel nesmí při chybě guardu spustit aplikaci bez ověření.');
  require(/c\.addAll\(CORE\)/.test(sw) && !/\.add\([^)]*\)\.catch\s*\(/.test(sw),'PRECACHE_NOT_ATOMIC','PWA instalace musí selhat viditelně, pokud chybí povinný precache soubor.');
  require(/responseSchema|RESPONSE_SCHEMA|EVALUATION_RESPONSE_SCHEMA/i.test(contract) && /JSON\.parse[\s\S]{0,1200}finalizeEvaluation/i.test(manual) && /evaluationToLegacyResult/.test(manual),'MANUAL_AI_NOT_AUTHORITATIVE','Ruční AI import musí používat stejné schéma, deterministické vyhodnocení a převod výsledku jako API cesta.');
  require(/serializableBatchJob/.test(stateUi) && !/batchJob\s*:\s*state\.batchJob/.test(stateUi),'RAW_BATCH_PERSISTENCE','Ukládaný stav musí serializovat Batch úlohu přes whitelist bez surových odpovědí.');
  require(/metadata\?\.key|metadata\.key/.test(workflow) && !/responses?\s*\[\s*(?:i|index)\s*\]/i.test(workflow),'BATCH_INDEX_FALLBACK','Batch výsledek bez stabilního identifikačního klíče se nesmí přiřadit podle pořadí.');
  require(/MAX_TOKENS/.test(workflow+tests) && /finishReason/.test(workflow+tests),'TRUNCATED_AI_RESPONSE','Oříznutá AI odpověď musí být rozpoznána podle finishReason/MAX_TOKENS a nesmí vytvořit falešný úspěch.');
  require(/ignoruj|ignore/i.test(contract) && /(instrukc|pokyn|role|žádost)/i.test(contract),'PROMPT_INJECTION_BOUNDARY','Prompt musí výslovně označit studentský text za data a odmítnout instrukce vložené studentem.');
  require(/15\s*\*\s*1024\s*\*\s*1024|15\s*MB/i.test(release+privacy+tests),'PDF_SIZE_LIMIT','Vstupní PDF musí mít jednotný limit 15 MB ve všech relevantních cestách.');
  require(/confirm|potvr/i.test(stateUi+tests) && /api.*kl[ií]č|kl[ií]č.*api/i.test(stateUi+tests),'PERSISTENT_KEY_CONFIRMATION','Trvalé uložení API klíče musí vyžadovat explicitní potvrzení.');
  return {findings,details:{profile:'essay-evaluator-audit-1.5',controls:9}};
}
