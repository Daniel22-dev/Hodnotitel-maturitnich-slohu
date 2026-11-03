// Feedback bridge v1.2: durable at-most-once Gmail operations, NO delivery guarantee.
const APP_SCHEMA='ghrab-essay-feedback-v1';
const MAX_ITEMS=20;
const LEDGER_PREFIX='GHRAB_FEEDBACK_V12_';
function doGet(){return jsonResponse_({ok:true,service:'Hodnotitel Gmail Bridge',version:'1.2'});}
function doPost(e){
  let lock=null,locked=false;
  try{
    const raw=(e&&e.parameter&&e.parameter.payload)||(e&&e.postData&&e.postData.contents)||'{}';
    const payload=JSON.parse(raw),secret=validatePayload_(payload);
    lock=LockService.getScriptLock();
    locked=lock.tryLock(25000);
    if(!locked)throw Error('DELIVERY_LOCK_BUSY');
    return jsonResponse_(deliverLocked_(payload,secret));
  }catch(error){
    const code=String(error&&error.message||'');
    return jsonResponse_({ok:false,code:/^DELIVERY_[A-Z_]+$/.test(code)?code:'DELIVERY_UNCONFIRMED',
      message:'Distribuci nelze bezpečně potvrdit. Před další akcí zkontrolujte Gmail.'});
  }finally{if(locked&&lock)lock.releaseLock();}
}
function validatePayload_(p){
  if(!p||p.schema!==APP_SCHEMA)throw Error('DELIVERY_INVALID_REQUEST');
  const secret=PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if(!secret||p.secret!==secret)throw Error('DELIVERY_UNAUTHORIZED');
  if(!/^req_[a-f0-9]{32}$/i.test(String(p.requestId||''))||
     !p.series||typeof p.series.id!=='string'||!p.series.id.trim()||p.series.id.length>160||
     !['send','createDrafts'].includes(p.action)||
     !Array.isArray(p.items)||!p.items.length||p.items.length>MAX_ITEMS)
    throw Error('DELIVERY_INVALID_REQUEST');
  const codes=new Set(),emails=new Set();
  p.items.forEach(function(i){
    if(!i||i.approved!==true||typeof i.code!=='string'||!i.code.trim()||i.code.length>160||
       !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(i.email||''))||
       !i.subject||(!i.plainBody&&!i.htmlBody))throw Error('DELIVERY_INVALID_REQUEST');
    const c=i.code.trim(),m=String(i.email).trim().toLowerCase();
    if(codes.has(c)||emails.has(m))throw Error('DELIVERY_DUPLICATE_ITEM');
    codes.add(c);emails.add(m);
  });
  return secret;
}
function digest_(value,secret){
  return Utilities.computeHmacSha256Signature(String(value),secret).map(function(b){
    return ('0'+(b&255).toString(16)).slice(-2);
  }).join('');
}
function ledgerKey_(type,id,secret){return LEDGER_PREFIX+type+'_'+digest_(id,secret);}
function deliverLocked_(p,secret){
  const props=PropertiesService.getScriptProperties();
  const reqKey=ledgerKey_('REQUEST',p.requestId,secret);
  const fingerprint=digest_(JSON.stringify({
    requestId:p.requestId,series:p.series.id,action:p.action,senderName:p.senderName||'',
    items:p.items.map(function(i){return {code:i.code,email:i.email,subject:i.subject,
      plainBody:i.plainBody||'',htmlBody:i.htmlBody||'',approved:i.approved};})
  }),secret);
  const old=props.getProperty(reqKey);
  if(old!==null){
    let previous;try{previous=JSON.parse(old);}catch(e){throw Error('DELIVERY_LEDGER_CONFLICT');}
    if(previous.fingerprint!==fingerprint)throw Error('DELIVERY_LEDGER_CONFLICT');
    throw Error('DELIVERY_DUPLICATE_REQUEST');
  }
  // One student/series reservation blocks both drafts and direct sending.
  const keys=p.items.map(function(i){return ledgerKey_('ITEM',p.series.id+'\u001f'+i.code.trim(),secret);});
  if(keys.some(function(k){return props.getProperty(k)!==null;}))throw Error('DELIVERY_DUPLICATE_ITEM');
  const at=new Date().toISOString(),requestTag=ledgerKey_('ID',p.requestId,secret);
  const reserve={};
  reserve[reqKey]=JSON.stringify({fingerprint,status:'reserved',count:p.items.length,at});
  keys.forEach(function(k){reserve[k]=JSON.stringify({request:requestTag,status:'reserved',at});});
  // Persist and read back BEFORE ANY Gmail side effect. A partial/failed
  // reservation is never automatically resumed or cleared.
  props.setProperties(reserve,false);
  Object.keys(reserve).forEach(function(k){
    if(props.getProperty(k)!==reserve[k])throw Error('DELIVERY_LEDGER_UNCONFIRMED');
  });
  const results=[];
  for(let n=0;n<p.items.length;n++){
    const i=p.items[n],status=p.action==='send'?'sent':'draft-created';
    try{
      const text=i.plainBody||stripHtml_(i.htmlBody);
      const options={htmlBody:i.htmlBody||undefined,name:p.senderName||undefined};
      if(p.action==='send')GmailApp.sendEmail(i.email,i.subject,text,options);
      else GmailApp.createDraft(i.email,i.subject,text,options);
      props.setProperty(keys[n],JSON.stringify({request:requestTag,status,at}));
      results.push({code:i.code,status});
    }catch(error){
      // Gmail could have accepted the action before raising an error.
      return {ok:false,code:'DELIVERY_UNCONFIRMED',count:results.length,results,
        message:'Částečná nebo nejistá distribuce. Před opakováním ověřte Gmail.'};
    }
  }
  try{props.setProperty(reqKey,JSON.stringify({fingerprint,status:'completed',count:results.length,at}));}
  catch(error){return {ok:false,code:'DELIVERY_UNCONFIRMED',count:results.length,
    message:'Výsledek distribuce nelze potvrdit. Ověřte Gmail.'};}
  return {ok:true,action:p.action,count:results.length,results,requestId:p.requestId};
}
function stripHtml_(html){
  return String(html||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,'')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function jsonResponse_(value){
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
