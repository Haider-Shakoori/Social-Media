import {Connection,Client} from '@temporalio/client';
import {randomUUID} from 'node:crypto';
import {assertAllowedRequest,type InspectionRequest} from './config';
import {browserLabInspection} from './workflows';

async function main(){
 const [accountKey,targetUrl,driver='playwright']=process.argv.slice(2);
 const input={accountKey,targetUrl,driver} as InspectionRequest;
 assertAllowedRequest(input);
 if(process.env.BROWSER_LAB_ALLOW_SOCIAL_LOGIN==='true'||process.env.BROWSER_LAB_PUBLISHING_ENABLED==='true')
  throw new Error('Read-only browser lab does not allow social logins or publishing');
 const connection=await Connection.connect({address:process.env.TEMPORAL_ADDRESS||'temporal:7233'});
 try{
  const client=new Client({connection});
  const outcome=await client.workflow.execute(browserLabInspection,{
   taskQueue:'browser-lab-read-only',workflowId:'inspection-'+randomUUID(),
   args:[input],workflowExecutionTimeout:'2 minutes',
  });
  console.log(JSON.stringify(outcome));
 }finally{await connection.close();}
}
void main().catch(err=>{console.error(err instanceof Error?err.message:'Unable to run inspection');process.exitCode=1;});
