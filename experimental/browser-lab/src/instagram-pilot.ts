import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium} from 'playwright';

/** This pilot supports only a human at the remote screen. No scripted logins, posting or scraping. */
export const instagramDomains=[
 'instagram.com','cdninstagram.com','facebook.com','fbcdn.net','fbsbx.com','meta.com'
] as const;
export function permittedInstagramResource(raw:string):boolean{
 try{
  const url=new URL(raw);
  if(url.protocol==='data:'||url.protocol==='blob:')return true;
  if(url.protocol!=='https:'||url.username||url.password)return false;
  const host=url.hostname.toLowerCase();
  return instagramDomains.some(root=>host===root||host.endsWith('.'+root));
 }catch{return false;}
}
export function assertInstagramPilotEnabled(env:NodeJS.ProcessEnv=process.env):void{
 if(env.INSTAGRAM_PILOT_ENABLED!=='true')throw new Error('Instagram pilot requires operator opt-in');
 if(env.BROWSER_LAB_MAX_SESSIONS!=='1')throw new Error('Only one browser session is allowed');
 if(env.INSTAGRAM_PILOT_PUBLISHING_ENABLED==='true')throw new Error('Publishing is not supported in Instagram pilot');
 if(env.BROWSER_LAB_ALLOW_SOCIAL_LOGIN==='true')throw new Error('The browser lab cannot enable automated social login');
 if(!env.DISPLAY)throw new Error('A private Xvfb display is required');
}
export async function runInstagramPilot():Promise<void>{
 assertInstagramPilotEnabled();
 process.umask(0o077);
 // Ephemeral tmpfs; browser login data is destroyed when the container exits.
 const profile=await mkdtemp(join(tmpdir(),'instagram-private-pilot-'));
 try{
  const context=await chromium.launchPersistentContext(profile,{
   executablePath:process.env.BROWSER_LAB_CHROMIUM_PATH||'/usr/bin/chromium',
   headless:false,
   viewport:{width:1280,height:800},
   acceptDownloads:false,
   timeout:25_000,
  });
  try{
   // No internal IP / arbitrary URL access from a logged-in browser.
   await context.route('**/*',route=>{
    if(permittedInstagramResource(route.request().url()))return route.continue();
    return route.abort();
   });
   const page=context.pages()[0]||await context.newPage();
   // No credential interception, network recording, session export or automation.
   await page.goto('https://www.instagram.com/accounts/login/',{
    waitUntil:'domcontentloaded',timeout:30_000,
   });
   console.log('Instagram manual login screen is ready. Viewer remains private to the SSH tunnel.');
   const abort=new AbortController();
   const onExit=()=>abort.abort();
   process.once('SIGTERM',onExit);
   process.once('SIGINT',onExit);
   try{
    // End session after 15 minutes even if left open. Credentials are not captured.
    await new Promise<void>(resolve=>{
     const timer=setTimeout(resolve,15*60_000);
     abort.signal.addEventListener('abort',()=>{clearTimeout(timer);resolve();},{once:true});
    });
   }finally{
    process.removeListener('SIGTERM',onExit);
    process.removeListener('SIGINT',onExit);
   }
  }finally{await context.close();}
 }finally{await rm(profile,{recursive:true,force:true});}
}
if(require.main===module){
 void runInstagramPilot().catch(error=>{
  console.error('Instagram pilot ended:',error instanceof Error?error.message:'unavailable');
  process.exitCode=1;
 });
}
