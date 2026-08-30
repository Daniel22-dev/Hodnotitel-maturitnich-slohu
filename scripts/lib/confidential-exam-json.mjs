function hasNonEmptyTaskText(value){
  if(Array.isArray(value)) return value.some(hasNonEmptyTaskText);
  if(!value || typeof value!=='object') return false;
  if(typeof value.taskText==='string' && value.taskText.trim()) return true;
  return Object.values(value).some(hasNonEmptyTaskText);
}

function hasLegacyExamObject(value){
  if(Array.isArray(value)) return value.some(hasLegacyExamObject);
  if(!value || typeof value!=='object') return false;
  if(value.set==='exam' && typeof value.taskText==='string' && value.taskText.trim()) return true;
  return Object.values(value).some(hasLegacyExamObject);
}

export function containsConfidentialExamJson(text){
  const source=String(text??'');
  try{
    const parsed=JSON.parse(source);
    if(parsed && typeof parsed==='object'){
      if(Object.prototype.hasOwnProperty.call(parsed,'exam') && hasNonEmptyTaskText(parsed.exam)) return true;
      if(hasLegacyExamObject(parsed)) return true;
    }
  }catch(_){
    // Secret scan must still catch the older legacy marker in malformed/partial JSON.
  }
  return /"set"\s*:\s*"exam"[\s\S]{0,6000}?"taskText"\s*:\s*"(?!")/i.test(source);
}
