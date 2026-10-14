import {NativeConnection,Worker} from '@temporalio/worker';
import {requireLabEnabled} from './config';
import {inspectAllowlistedPage} from './browser';

async function main():Promise<void>{
 requireLabEnabled();
 if(process.env.BROWSER_LAB_ALLOW_SOCIAL_LOGIN==='true'||process.env.BROWSER_LAB_PUBLISHING_ENABLED==='true')
  throw new Error('The experimental read-only lab must not be used for social login or publishing');
 if(!process.env.DISPLAY)throw new Error('Headful Chromium requires Xvfb DISPLAY');
 const address=process.env.TEMPORAL_ADDRESS||'temporal:7233';
 const connection=await NativeConnection.connect({address});
 const worker=await Worker.create({
  connection,namespace:'default',taskQueue:'browser-lab-read-only',
  workflowsPath:require.resolve('./workflows'),
  activities:{inspectAllowlistedPage},
  maxConcurrentActivityTaskExecutions:1,
  maxConcurrentWorkflowTaskExecutions:1,
 });
 console.log('Experimental browser worker running: read-only, allowlisted, concurrency=1');
 try{await worker.run();}finally{await connection.close();}
}
void main().catch(()=>{console.error('Experimental browser worker unavailable');process.exitCode=1;});
