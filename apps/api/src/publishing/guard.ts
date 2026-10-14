import {requiredMetaScopes} from '../social-oauth/meta-account';

export type PublishNetwork='facebook'|'instagram'|'x'|string;
export type PublishGate={
 network:PublishNetwork;loginType?:'instagram'|'facebook';featureEnabled:boolean;globalPaused:boolean;brandPaused:boolean;
 archived:boolean;mode:string;connectionState:string;connectionPaused:boolean;tokenExpiresAt:Date|null;
 scopes:string[];policyState:string;operatorEnabled:boolean;apiApproved:boolean;
 productionVerified:boolean;subscriptionActive:boolean;approvedVersionMatches:boolean;
 approvalGranted:boolean;approvedByAnotherUser:boolean;contentSupported:boolean;
};
export function metaPublishingBlockers(g:PublishGate,now=new Date()):string[]{
 const reasons:string[]=[];
 if(g.network!=='facebook'&&g.network!=='instagram')reasons.push('unsupported_network');
 if(!g.featureEnabled)reasons.push('operator_publish_disabled');
 if(g.globalPaused||g.brandPaused||g.archived)reasons.push('publishing_paused');
 if(g.mode!=='OFFICIAL'||g.connectionState!=='CONNECTED'||g.connectionPaused)reasons.push('connection_not_ready');
 if(g.tokenExpiresAt&&g.tokenExpiresAt<=now)reasons.push('token_expired');
 if(g.network==='facebook'||g.network==='instagram'){
  if(requiredMetaScopes(g.network,g.loginType).some(x=>!g.scopes.includes(x)))reasons.push('permission_missing');
 }
 if(g.policyState!=='PRODUCTION_READY'||!g.operatorEnabled||!g.apiApproved||!g.productionVerified)
  reasons.push('provider_not_approved');
 if(!g.subscriptionActive)reasons.push('subscription_inactive');
 if(!g.approvedVersionMatches||!g.approvalGranted||!g.approvedByAnotherUser)reasons.push('content_not_approved');
 if(!g.contentSupported)reasons.push('unsupported_content_format');
 return reasons;
}
/** Keep outbound publishing limited to formats that have deterministic, safe Meta calls. */
export function supportedMetaFormat(network:PublishNetwork,mediaUrls:string[]):boolean{
 if(network==='facebook')return mediaUrls.length===0;
 if(network!=='instagram'||mediaUrls.length!==1)return false;
 try{const u=new URL(mediaUrls[0]);return u.protocol==='https:'&&!u.username&&!u.password;}
 catch{return false;}
}
