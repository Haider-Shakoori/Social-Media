import {proxyActivities} from '@temporalio/workflow';
import type {InspectionRequest,InspectionResult} from './config';

const {inspectAllowlistedPage}=proxyActivities<{
 inspectAllowlistedPage(input:InspectionRequest):Promise<InspectionResult>
}>({startToCloseTimeout:'1 minute',retry:{maximumAttempts:1}});
/** Read-only test workflow; no account authorization, writes, or scheduled posting. */
export async function browserLabInspection(input:InspectionRequest):Promise<InspectionResult>{
 return await inspectAllowlistedPage(input);
}
