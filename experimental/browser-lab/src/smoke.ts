import {strict as assert} from 'node:assert';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

async function smoke(){
 const driver=process.argv[2];
 if(driver!=='playwright'&&driver!=='patchright')throw new Error('Unknown smoke driver');
 const server=createServer((_req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html'});
  res.end('<!doctype html><html><head><title>Browser Lab Fixture</title></head><body>Local-only smoke test</body></html>');
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const addr=server.address();
 if(!addr||typeof addr==='string')throw new Error('Local server failed');
 const profile=await mkdtemp(join(tmpdir(),'browser-lab-smoke-'));
 try{
  const chromium=(driver==='patchright'?(await import('patchright')).chromium:(await import('playwright')).chromium) as unknown as typeof import('playwright').chromium;
  const context=await chromium.launchPersistentContext(profile,{
   executablePath:'/usr/bin/chromium',headless:false,
  });
  try{
   const page=context.pages()[0]||await context.newPage();
   await page.goto('http://127.0.0.1:'+addr.port+'/',{waitUntil:'domcontentloaded',timeout:15000});
   assert.equal(await page.title(),'Browser Lab Fixture');
   console.log(driver+' + headful Chromium/Xvfb local fixture smoke PASSED');
  }finally{await context.close();}
 }finally{
  server.closeAllConnections();
  await new Promise<void>(resolve=>server.close(()=>resolve()));
  await rm(profile,{recursive:true,force:true});
 }
}
void smoke().catch(err=>{console.error(err instanceof Error?err.message:'Browser smoke failed');process.exitCode=1;});
