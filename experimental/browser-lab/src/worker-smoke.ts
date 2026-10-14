import {NativeConnection,Worker} from '@temporalio/worker';
import {inspectAllowlistedPage} from './browser';
import {singleSessionWorkerLimits} from './worker-limits';

async function smoke():Promise<void>{
 if(singleSessionWorkerLimits.maxConcurrentActivityTaskExecutions!==1)
  throw new Error('Browser concurrency must remain one');
 const connection=await NativeConnection.connect({address:process.env.TEMPORAL_ADDRESS||'127.0.0.1:27233'});
 // CI process exits immediately after initialization, releasing its disposable worker.
  await Worker.create({
   connection,namespace:'default',taskQueue:'browser-lab-read-only',
   workflowsPath:require.resolve('./workflows'),
   activities:{inspectAllowlistedPage},...singleSessionWorkerLimits,
  });
  console.log('PASS: Temporal worker initialized with exactly one browser activity executor');
}
void smoke().then(()=>process.exit(0)).catch(error=>{
 console.error('Temporal worker initialization failed:',error instanceof Error?error.message:'unknown');
 process.exit(1);
});
