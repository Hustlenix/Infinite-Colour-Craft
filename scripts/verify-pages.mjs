import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Verify the built GitHub Pages path, model asset and worker in a real browser.
// This server belongs to this script and is stopped when the checks finish.
const url='http://127.0.0.1:43138/Infinite-Colour-Craft/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','43138','--strictPort'],{stdio:'pipe',windowsHide:true,env:{...process.env,GITHUB_PAGES:'true'}});
server.stderr.on('data',data=>process.stderr.write(data));
try {
  let ready=false;
  for(let attempt=0;attempt<60;attempt++){
    if(server.exitCode!==null)throw Error('The preview server could not start.');
    try{const response=await fetch(url);if(response.ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!ready)throw Error('The built Pages route did not become ready.');
  const run=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test','--grep','drawing survives|real board mix|touch drawing','--reporter=line','--output=test-results-pages'],{
    stdio:'inherit',windowsHide:true,env:{...process.env,PLAYWRIGHT_BASE_URL:url},
  });
  const [code]=await once(run,'exit');process.exitCode=code??1;
} finally {server.kill();}
