import {createAccountDirectory,assertAllowedRequest,allowedOrigins,type InspectionRequest,type InspectionResult} from './config';
import {proxyForAccount} from './proxy';

export async function inspectAllowlistedPage(input:InspectionRequest):Promise<InspectionResult>{
 const requested=assertAllowedRequest(input);
 const profiles=process.env.BROWSER_LAB_PROFILE_DIR||'/app/profiles';
 process.umask(0o077);
 const userDataDir=await createAccountDirectory(profiles,input.accountKey);
 const proxy=await proxyForAccount(input.accountKey,process.env.BROWSER_LAB_PROXY_MAP_FILE);
 // Driver selectable only by operator. Patchright is restricted to test-only navigation.
 const chromium=input.driver==='patchright'
  ? (await import('patchright')).chromium as unknown as typeof import('playwright').chromium
  : (await import('playwright')).chromium;
 const browser=await chromium.launchPersistentContext(userDataDir,{
  executablePath:process.env.BROWSER_LAB_CHROMIUM_PATH||'/usr/bin/chromium',
  headless:false,viewport:{width:1280,height:800},
  ...(proxy?{proxy}:{}),timeout:25000,
 });
 try{
  const origins=allowedOrigins();
  // Abort cross-origin redirects and embedded requests. No social logins, posting or CAPTCHA bypass.
  await browser.route('**/*',route=>{
   let origin:string;
   try{origin=new URL(route.request().url()).origin;}catch{return route.abort();}
   return origins.has(origin)?route.continue():route.abort();
  });
  const page=browser.pages()[0]||await browser.newPage();
  await page.goto(requested.href,{waitUntil:'domcontentloaded',timeout:20000});
  if(!origins.has(new URL(page.url()).origin))throw new Error('Unapproved redirect');
  return {status:'completed',accountKey:input.accountKey,origin:requested.origin,
   title:(await page.title()).slice(0,160),checkedAt:new Date().toISOString(),driver:input.driver};
 }finally{await browser.close();}
}
