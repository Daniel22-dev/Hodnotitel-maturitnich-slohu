async function bootstrapApplication(){
  const suiteSessionModuleUrl=new URL('./access/suite-session-cleanup.js',import.meta.url);
  const {createSuiteSessionLifecycle}=await import(suiteSessionModuleUrl.href);
  suiteSessionLifecycle=createSuiteSessionLifecycle({
    platform:window.GHRAB_PLATFORM,
    beforeCleanup:async()=>prepareSuiteSessionCleanup(),
    afterCleanup:async()=>scrubSuiteSessionRuntime(),
    onFailure:suiteCleanupFailure,
    reload:()=>location.reload(),
  });
  const suiteStart=await suiteSessionLifecycle.start();
  if(suiteStart.startupCleanup) return;
  init();
  initSeriesWorkflow();
  initReportEnhancements();
  registerAppServiceWorker();
  renderBuildLabel();
  document.documentElement.dataset.appReady='1';
  window.__HODNOTITEL_READY__=true;
}
await bootstrapApplication();
