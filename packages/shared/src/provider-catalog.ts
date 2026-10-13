import { SOCIAL_NETWORKS, type SocialNetwork } from './index';

export type ProviderRollout =
  | 'planned' | 'manual_only' | 'awaiting_approval' | 'testing'
  | 'production_ready' | 'restricted' | 'disabled';
export type DraftContentType =
  | 'text' | 'image' | 'video' | 'carousel' | 'document' | 'pin' | 'local_post';
export type ProviderDescriptor = Readonly<{
  id:SocialNetwork;
  name:string;
  rolloutBatch:number;
  accountHint:string;
  contentCandidates:readonly DraftContentType[];
  accessRequirement:string;
  costGate:'none_verified'|'review_required'|'operator_budget'|'commercial_contract';
  // Purely candidate formats. They do NOT indicate a verified API capability.
}>;
const catalog:readonly ProviderDescriptor[] = [
 {id:'instagram',name:'Instagram',rolloutBatch:8,accountHint:'Eligible professional accounts',
  contentCandidates:['image','video','carousel'],accessRequirement:'Meta review and eligible professional account',costGate:'review_required'},
 {id:'facebook',name:'Facebook Pages',rolloutBatch:8,accountHint:'Administered Pages only',
  contentCandidates:['text','image','video'],accessRequirement:'Meta Page permissions and app review',costGate:'review_required'},
 {id:'threads',name:'Threads',rolloutBatch:20,accountHint:'Authorized Threads accounts',
  contentCandidates:['text','image','video'],accessRequirement:'Threads-specific authorization and scopes',costGate:'review_required'},
 {id:'pinterest',name:'Pinterest',rolloutBatch:21,accountHint:'Authorized boards and Pins',
  contentCandidates:['pin','image','video'],accessRequirement:'App authorization and board permissions',costGate:'review_required'},
 {id:'linkedin',name:'LinkedIn',rolloutBatch:22,accountHint:'Eligible member and organization Pages',
  contentCandidates:['text','image','video','document'],accessRequirement:'Member/organization product approval and Page role',costGate:'review_required'},
 {id:'tiktok',name:'TikTok',rolloutBatch:23,accountHint:'Eligible creator accounts',
  contentCandidates:['video','image'],accessRequirement:'Content Posting API scopes and audit for public posts',costGate:'review_required'},
 {id:'youtube',name:'YouTube',rolloutBatch:24,accountHint:'Authorized channels',
  contentCandidates:['video'],accessRequirement:'Google OAuth, quota and public upload audit',costGate:'review_required'},
 {id:'google_business_profile',name:'Google Business Profile',rolloutBatch:25,accountHint:'Eligible authorized business locations',
  contentCandidates:['local_post'],accessRequirement:'Approved project and eligible business location',costGate:'review_required'},
 {id:'x',name:'X (Twitter)',rolloutBatch:26,accountHint:'Official API authorized accounts',
  contentCandidates:['text','image','video'],accessRequirement:'Official API terms, access tier and explicit spend approval',costGate:'operator_budget'},
 {id:'reddit',name:'Reddit',rolloutBatch:27,accountHint:'Authorized communities',
  contentCandidates:['text','image','video'],accessRequirement:'Written commercial API agreement and subreddit rules',costGate:'commercial_contract'},
] as const;
export const PROVIDER_CATALOG:ReadonlyArray<ProviderDescriptor> = Object.freeze(catalog.map(item=>Object.freeze({...item,contentCandidates:Object.freeze([...item.contentCandidates])})));
export const PILOT_NETWORKS = ['facebook','instagram','x'] as const;
export function isPilotNetwork(value:string):value is typeof PILOT_NETWORKS[number] {
 return (PILOT_NETWORKS as readonly string[]).includes(value);
}
export const PILOT_PROVIDER_CATALOG = PROVIDER_CATALOG.filter(p=>isPilotNetwork(p.id));
const byId:ReadonlyMap<SocialNetwork,ProviderDescriptor> = new Map(PROVIDER_CATALOG.map(item=>[item.id,item]));
export function isSocialNetwork(value:string):value is SocialNetwork {
 return (SOCIAL_NETWORKS as readonly string[]).includes(value);
}
export function getProviderDescriptor(id:SocialNetwork):ProviderDescriptor {
 const value=byId.get(id);
 if(!value)throw new Error('Unsupported provider');
 return value;
}
export type ProviderPolicySnapshot = {
 rollout:ProviderRollout;operatorEnabled:boolean;apiApproved:boolean;costApproved:boolean;productionVerified:boolean;
};
// No batch 7 provider can legitimately publish, regardless of a local setting.
// A verified adapter, tenant/account credentials and content approval will be added per future batch.
export function inspectProvider(id:SocialNetwork,policy?:ProviderPolicySnapshot) {
 const descriptor=getProviderDescriptor(id);
 const rollout=policy?.rollout||'planned';
 const isProductionReady=rollout==='production_ready'&&Boolean(
  policy?.operatorEnabled&&policy?.apiApproved&&policy?.productionVerified&&
  (descriptor.costGate!=='operator_budget'&&descriptor.costGate!=='commercial_contract'||policy?.costApproved)
 );
 return { ...descriptor,rollout,canConnect:false,canPublish:false,canUseManualExport:isPilotNetwork(id)&&rollout!=='disabled'&&rollout!=='restricted',
   productionPrerequisitesMet:isProductionReady,
   reason:rollout==='restricted'?'Provider access restricted':
     rollout==='disabled'?'Provider disabled by operator':
     'No authorized live connector has been released',
 };
}
export type ManualExportInput = {caption:string;contentType:DraftContentType;mediaUrls:readonly string[];destinationNote?:string};
export function buildManualExport(network:SocialNetwork,input:ManualExportInput){
 const descriptor=getProviderDescriptor(network);
 if(!isPilotNetwork(network))throw new Error('Network deferred beyond the Meta/X pilot');
 if(!descriptor.contentCandidates.includes(input.contentType)){
  throw new Error('Content type is not a planned format for this provider');
 }
 const caption=input.caption.trim();
 if(!caption||caption.length>5000)throw new Error('Caption must contain 1–5000 characters');
 if(input.mediaUrls.length>12||input.mediaUrls.some(u=>{
  try{const parsed=new URL(u);return parsed.protocol!=='https:'||Boolean(parsed.username||parsed.password);}catch{return true;}
 }))throw new Error('Media references must be public HTTPS URLs without embedded credentials');
 return {network,networkName:descriptor.name,contentType:input.contentType,caption,mediaUrls:[...input.mediaUrls],
   destinationNote:input.destinationNote?.trim().slice(0,200)||'',
   publishing:'MANUAL_ONLY' as const,automaticallyPublished:false,
   instructions:'Copy the caption and media links, inspect the provider rules, then publish directly from your own account.',
 };
}
