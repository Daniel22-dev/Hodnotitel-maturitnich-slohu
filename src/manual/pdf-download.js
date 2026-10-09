const allowed=()=>document.documentElement.dataset.ghrabAccess === "granted";
function refreshPdfControl(){
  const old=document.querySelector("#manual-pdf"),status=document.querySelector("#manual-pdf-status");
  if(!allowed()){old?.remove();status?.remove();return}
  if(old)return;
  const main=document.querySelector("main");if(!main)return;
  const b=document.createElement("button"),s=document.createElement("span");
  b.id="manual-pdf";b.type="button";s.id="manual-pdf-status";s.setAttribute("role","status");
  b.textContent=window.GHRAB_MANUAL_DOC_INFO?.reviewStatus==="verified"?"↓ Stáhnout manuál PDF":"↓ Náhled PDF (čeká na obsahovou revizi)";
  b.style.cssText="padding:12px;margin:12px;border-radius:10px;min-height:44px;cursor:pointer";
  b.addEventListener("click",async()=>{
    if(!allowed())return;
    b.disabled=true;s.textContent="Připravuji PDF…";
    try{
      const base=document.querySelector("[data-ghrab-studio-link]")?.href||
        window.__GHRAB_DEPLOYMENT_CONFIG__?.studioBaseUrl||"/AI-Studio-GHRAB/";
      const {downloadManualPdf}=await import(new URL("manualy/pdf-export.js",new URL(base,location.href)).href);
      if(!allowed())throw Error("Oprávnění zaniklo.");
      await downloadManualPdf(document,{title:document.title,filename:"GHRAB-"+document.documentElement.dataset.ghrabAppId+"-manual.pdf",extras:window.GHRAB_MANUAL_EXPORT||[]});
      s.textContent="PDF připraveno.";
    }catch(e){s.textContent="PDF se nepodařilo vytvořit: "+String(e.message||e)}
    finally{b.disabled=false}
  });
  main.prepend(b,s);
}
new MutationObserver(refreshPdfControl).observe(document.documentElement,{attributes:true,attributeFilter:["data-ghrab-access"]});
refreshPdfControl();
