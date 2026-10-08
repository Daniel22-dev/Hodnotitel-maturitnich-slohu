const authorized=()=>document.documentElement.dataset.ghrabAccess==="granted";
function mount(){
  if(!authorized()||document.querySelector("#manual-pdf"))return;
  const root=document.querySelector("main");if(!root)return;
  const bar=document.createElement("div");
  bar.style.cssText="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0;padding:12px;border:1px solid #6799aa;border-radius:13px";
  const button=document.createElement("button");button.id="manual-pdf";button.type="button";button.textContent="↓ Stáhnout celý manuál PDF";
  button.style.cssText="padding:11px 14px;min-height:44px;border-radius:10px;cursor:pointer";
  const status=document.createElement("span");status.setAttribute("role","status");
  bar.append(button,status);root.insertBefore(bar,root.firstChild);
  button.addEventListener("click",async()=>{
    if(!authorized())return;
    button.disabled=true;status.textContent="Připravuji PDF…";
    try{
      const base=document.querySelector("[data-ghrab-studio-link]")?.href||
        window.__GHRAB_DEPLOYMENT_CONFIG__?.studioBaseUrl||
        new URL("/AI-Studio-GHRAB/",location.href).href;
      const url=new URL("manualy/pdf-export.js",base);
      const {downloadManualPdf}=await import(url.href);
      const extras=Array.isArray(window.GHRAB_MANUAL_EXPORT)?window.GHRAB_MANUAL_EXPORT:[];
      const result=await downloadManualPdf(document,{title:document.title,filename:"GHRAB-manual-"+document.documentElement.dataset.ghrabAppId+".pdf",extras});
      status.textContent="PDF staženo ("+result.pages+" stran).";
    }catch(error){status.textContent="PDF se nepodařilo vytvořit: "+String(error?.message||error)}
    finally{button.disabled=false}
  });
}
const observer=new MutationObserver(()=>{if(authorized()){observer.disconnect();mount()}else if(document.documentElement.dataset.ghrabAccess==="denied"){observer.disconnect()}});
observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-ghrab-access"]});
if(authorized()){observer.disconnect();mount()}
