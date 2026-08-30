import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function read(root, rel) { return readFileSync(path.join(root, rel), 'utf8'); }
function block(prompt, name) {
  const start=`<<<${name}_START>>>`, end=`<<<${name}_END>>>`;
  const startCount=prompt.split(start).length-1, endCount=prompt.split(end).length-1;
  const i=prompt.indexOf(start), j=prompt.indexOf(end);
  return {startCount,endCount,text:i>=0&&j>i?prompt.slice(i+start.length,j).trim():''};
}

export function runPromptBoundaryChecks(root) {
  const release=read(root,'src/js/00-release-rubric.js');
  const rubric=read(root,'src/js/05-rubric-spec.js');
  const contract=read(root,'src/js/45-evaluation-contract.js');
  const corpus=JSON.parse(read(root,'tests/fixtures/ai-red-prompt-corpus.json'));
  const ctx=vm.createContext({
    console,
    state:{taskText:'Task body',taskTitle:'Task title',taskReqs:'R1: requirement',genre:'opinion',studentText:'Essay',studentCode:'STUDENT_001'},
    currentTask:()=>({title:'Fallback title'}),
    normalizeMatchText:value=>String(value||'').toLowerCase(),
    normalizePlainForCount:value=>String(value||'').toLowerCase(),
    localWordCountReport:()=>({rawCount:200,deductTotal:0,finalCount:200,paraCounts:[200],firstSentence:'Essay',lastSentence:'Essay'}),
    getOutboundStudentTextFromValues:text=>({text,map:[]}),
    getOutboundStudentText:()=>({text:ctx.state.studentText,map:[]}),
    formatWordCountAuditForPrompt:()=>ctx.__wordCountAudit,
    RUBRIC_PROMPT:'RUBRIKA',
  });
  vm.runInContext(`${release}\n${rubric}\n${contract}`,ctx,{timeout:2500});
  ctx.__wordCountAudit='WORD_COUNT_AUDIT';
  const channels=['studentText','taskTitle','taskText','taskReqs','wordCountAudit','genre','repairValidation'];
  const failures=[];
  let attempts=0;
  for(const poison of corpus){
    for(const channel of channels){
      attempts++;
      ctx.state.taskTitle='Task title';
      ctx.state.taskText='Task body';
      ctx.state.taskReqs='R1: requirement';
      ctx.state.studentText='Essay';
      ctx.state.genre='opinion';
      ctx.__wordCountAudit='WORD_COUNT_AUDIT';
      let student='Essay';
      if(channel==='studentText') student=poison;
      else if(channel==='taskTitle') ctx.state.taskTitle=poison;
      else if(channel==='taskText') ctx.state.taskText=poison;
      else if(channel==='taskReqs') ctx.state.taskReqs=poison;
      else if(channel==='wordCountAudit') ctx.__wordCountAudit=poison;
      else if(channel==='genre') ctx.state.genre=poison;
      ctx.__studentText=student;
      ctx.__repairIssues=[poison];
      let prompt;
      try{
        prompt=vm.runInContext(channel==='repairValidation'?"buildRepairPrompt({code:'STUDENT_001',text:__studentText,files:[]},__repairIssues)":"buildPrompt({code:'STUDENT_001',text:__studentText,files:[]},false)",ctx,{timeout:1200});
      }catch(error){
        failures.push({channel,poison,error:`build failed: ${error.message}`});
        continue;
      }
      const task=block(prompt,'TASK_CONTEXT_JSON');
      const wc=block(prompt,'WORD_COUNT_AUDIT_JSON');
      const studentBlock=block(prompt,'STUDENT_TEXT_JSON');
      const repairBlock=block(prompt,'REPAIR_VALIDATION_JSON');
      const genreLine=(prompt.match(/ÚTVAR \(aplikační enum\): ([^\n]*)/)||[])[1]||'';
      if(genreLine!=='Opinion essay'){failures.push({channel,poison,error:'genre whitelist'});continue;}
      if([task,wc,studentBlock].some(x=>x.startCount!==1||x.endCount!==1)){
        failures.push({channel,poison,error:'boundary marker count'});continue;
      }
      if(channel==='repairValidation'&&(repairBlock.startCount!==1||repairBlock.endCount!==1)){
        failures.push({channel,poison,error:'repair boundary marker count'});continue;
      }
      if(channel!=='repairValidation'&&(repairBlock.startCount!==0||repairBlock.endCount!==0)){
        failures.push({channel,poison,error:'unexpected repair boundary'});continue;
      }
      try{
        const taskData=JSON.parse(task.text), wcData=JSON.parse(wc.text), studentData=JSON.parse(studentBlock.text);
        const expectedTask={title:ctx.state.taskTitle,text:ctx.state.taskText,requirements:String(ctx.state.taskReqs||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map((r,i)=>/^R\d+\s*:/i.test(r)?r:`R${i+1}: ${r}`).join('\n')};
        const repairData=channel==='repairValidation'?JSON.parse(repairBlock.text):null;
        if(JSON.stringify(taskData)!==JSON.stringify(expectedTask) || wcData!==ctx.__wordCountAudit || studentData!==student || (channel==='repairValidation'&&JSON.stringify(repairData)!==JSON.stringify([poison]))){
          failures.push({channel,poison,error:'round-trip mismatch'});
        }
      }catch(error){ failures.push({channel,poison,error:`JSON decode failed: ${error.message}`}); }
    }
  }
  return {ok:failures.length===0,corpusCount:corpus.length,channels,attempts,failures};
}
