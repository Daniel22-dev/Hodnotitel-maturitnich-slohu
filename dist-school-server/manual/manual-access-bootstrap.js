const APP_ID='essay-evaluator';
let studioUrl='/AI-Studio-GHRAB/';

function fail(error){
  console.error('GHRAB access bootstrap failed',error);
  document.documentElement.dataset.ghrabAccess='denied';
  document.body.style.visibility='visible';
  document.body.className='ghrab-access-gate-body';
  const main=document.createElement('main');
  main.className='ghrab-access-gate';
  main.setAttribute('role','alert');
  const mark=document.createElement('div');mark.className='ghrab-access-gate-mark';mark.textContent='⬡';
  const eyebrow=document.createElement('p');eyebrow.className='ghrab-access-gate-eyebrow';eyebrow.textContent='AI STUDIO GHRAB';
  const title=document.createElement('h1');title.textContent='Přístup k manuálu nelze ověřit';
  const message=document.createElement('p');message.textContent='Manuál používá stejné oprávnění jako aplikace. Otevřete jej z AI Studia nebo z povolené aplikace.';
  const actions=document.createElement('div');actions.className='ghrab-access-gate-actions';
  const link=document.createElement('a');link.className='ghrab-access-gate-primary';link.href=studioUrl;link.textContent='Otevřít AI Studio';
  actions.append(link);main.append(mark,eyebrow,title,message,actions);document.body.replaceChildren(main);
}

async function activatePage(){
  await import('./manual.js');
  document.documentElement.dataset.ghrabAccess='granted';
  document.body.style.visibility='visible';
}

const localPreview=location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname);
if(localPreview){
  await activatePage();
}else{
  try{
    const deploymentModule=await import('../access/deployment-config.js');
    const deployment=await deploymentModule.loadDeploymentConfig({appId:APP_ID});
    if(deployment.profile==='configuration-unavailable')throw new Error('Deployment konfigurace není dostupná nebo platná.');
    const urls=deploymentModule.deploymentUrls(deployment);studioUrl=urls.studioUrl;
    const guide=document.querySelector('[data-ghrab-guide-link]');if(guide)guide.href=urls.reporterGuideUrl;
    const {protectApp}=await import(urls.guardUrl);
    const allowed=await protectApp(APP_ID,{studioUrl,telemetry:false,errorReporter:false});
    if(allowed)await activatePage();
  }catch(error){fail(error);}
}
