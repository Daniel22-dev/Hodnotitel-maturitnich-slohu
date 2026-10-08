import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("src/manual/index.html");
const script=read("src/manual/pdf-download.js");
const guide=read("src/manual/manual.js");
if(!html.includes('data-ghrab-access="checking"')||!html.includes('src="./pdf-download.js"'))
  throw Error("Manual missing access gate or PDF launcher");
if(!script.includes('data-ghrab-access')||!script.includes('allowed()')||
   !script.includes('manualy/pdf-export.js')||!script.includes("downloadManualPdf"))
  throw Error("PDF must be dynamically fetched from authorized Studio, only after permit");
if(!guide.includes("GHRAB_MANUAL_EXPORT")||!guide.includes("MANUAL.tour")||!guide.includes("MANUAL.map"))
  throw Error("Hidden guide steps missing from printable PDF");
execFileSync(process.execPath,["--check",new URL("../src/manual/pdf-download.js",import.meta.url).pathname],{stdio:"pipe"});
console.log("[MANUAL PDF] PASS protected Studio module, full guide, no vendored engine.");
