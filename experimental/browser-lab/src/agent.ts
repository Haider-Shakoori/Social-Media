import {readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {Connection,Client} from '@temporalio/client';
import {browserLabInspection} from './workflows';
import type {InspectionRequest} from './config';

type Job={id:string;accountKey:string;proxyKey:string|null;driver:'playwright'|'patchright';targetUrl:string};
const TARGET='https://example.org/';
export function bridgeConfigured(env:NodeJS.ProcessEnv=process.env):boolean{
 return env.EXPERIMENTAL_BROWSER_LAB_ENABLED==='true' &&
  env.BROWSER_LAB_MAX_SESSIONS==='1' &&
  /^([a-fA-F0-9]{64,128})$/.test(env.BROWSER_LAB_AGENT_TOKEN||'') &&
  env.BROWSER_LAB_CONTROL_API_URL==='https://socials.businessos.af/api/v1';
}
async function proxyKeys():Promise<string[]>{
 const path=process.env.BROWSER_LAB_PROXY_MAP_FILE;
 if(!path)return [];
 try{
  const raw=await readFile(path,'utf8');
  const data:unknown=JSON.parse(raw);
  if(!data||Array.isArray(data)||typeof data!=='object')return [];
  return Object.keys(data).filter(x=>/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/.test(x)).slice(0,100);
 }catch{return [];}
}
async function api<T>(endpoint:string,body:object):Promise<T>{
 const response=await fetch(process.env.BROWSER_LAB_CONTROL_API_URL+'/browser-lab/agent/'+endpoint,{
  method:'POST',redirect:'error',signal:AbortSignal.timeout(9000),
  headers:{'Authorization':'Bearer '+process.env.BROWSER_LAB_AGENT_TOKEN,
   'Content-Type':'application/json','Origin':'https://socials.businessos.af'},
  body:JSON.stringify(body),
 });
 if(!response.ok)throw new Error('Agent bridge unavailable');
 return await response.json() as T;
}
function safeJob(job:Job):InspectionRequest {
 if(job.targetUrl!==TARGET)throw new Error('Unapproved target');
 if(!/^[a-z0-9-]{36}$/.test(job.id))throw new Error('Invalid test identifier');
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(job.accountKey))throw new Error('Invalid test label');
 if(job.proxyKey&&!/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/.test(job.proxyKey))throw new Error('Invalid proxy reference');
 if(job.driver!=='playwright'&&job.driver!=='patchright')throw new Error('Invalid browser driver');
 return {accountKey:job.accountKey,proxyKey:job.proxyKey||undefined,
  driver:job.driver,targetUrl:job.targetUrl};
}
/** No background social sessions. At most one read-only Temporal workflow in flight. */
export async function runConnectorAgent(signal:AbortSignal):Promise<void>{
 if(!bridgeConfigured()){
  console.log('Browser management bridge disabled; operator can still run local read-only tests');
  return;
 }
 console.log('Browser management bridge active: one session, read-only, fixed test origin');
 const connection=await Connection.connect({address:process.env.TEMPORAL_ADDRESS||'temporal-dev:7233'});
 const client=new Client({connection});
 try{
  while(!signal.aborted){
   try{
    await api('heartbeat',{maxSessions:1,workerMode:'read_only',agentVersion:'lab-1.1',
     proxyKeys:await proxyKeys()});
    const {job}=await api<{job:Job|null}>('claim',{});
    if(job){
     try{
      const request=safeJob(job);
      const result=await client.workflow.execute(browserLabInspection,{
       workflowId:'browser-lab-console-'+job.id,
       taskQueue:'browser-lab-read-only',args:[request],
       workflowExecutionTimeout:'105 seconds',
      });
      await api('result',{jobId:job.id,state:'SUCCEEDED',title:result.title});
     }catch(error){
      const code=error instanceof Error && /proxy/i.test(error.message)?'proxy_unavailable':'test_failed';
      try{await api('result',{jobId:job.id,state:'FAILED',failureCode:code});}catch{}
      console.warn('One read-only browser test failed');
     }
    }
   }catch{
    console.warn('Browser management bridge unavailable; will retry heartbeat');
   }
   try{await delay(15_000,undefined,{signal});}catch{break;}
  }
 }finally{await connection.close();}
}
