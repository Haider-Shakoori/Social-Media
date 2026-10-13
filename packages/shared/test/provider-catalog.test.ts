import assert from 'node:assert/strict';
import test from 'node:test';
import {SOCIAL_NETWORKS,PROVIDER_CATALOG,getProviderDescriptor,inspectProvider,buildManualExport,isSocialNetwork} from '../src/index';
test('all 10 roadmap providers have a unique independent descriptor',()=>{
 assert.equal(PROVIDER_CATALOG.length,10);
 assert.deepEqual(new Set(PROVIDER_CATALOG.map(x=>x.id)),new Set(SOCIAL_NETWORKS));
 for(const provider of PROVIDER_CATALOG) {
   assert.equal(isSocialNetwork(provider.id),true);
   assert.ok(provider.rolloutBatch>=8);
   assert.ok(provider.contentCandidates.length>0);
   assert.ok(provider.accessRequirement.length>5);
   assert.equal(inspectProvider(provider.id).canPublish,false);
 }
});
test('even falsely flagged production ready cannot connect or publish in Batch 7',()=>{
 const state=inspectProvider('x',{rollout:'production_ready',operatorEnabled:true,apiApproved:true,costApproved:true,productionVerified:true});
 assert.equal(state.canPublish,false);assert.equal(state.canConnect,false);
 assert.equal(inspectProvider('reddit',{rollout:'testing',operatorEnabled:true,apiApproved:false,costApproved:false,productionVerified:false}).canPublish,false);
});
test('manual package never triggers network actions and rejects inappropriate formats',()=>{
 const pack=buildManualExport('facebook',{caption:'Hello world',contentType:'video',mediaUrls:['https://example.com/clip.mp4']});
 assert.equal(pack.automaticallyPublished,false);
 assert.equal(pack.publishing,'MANUAL_ONLY');
 assert.throws(()=>buildManualExport('youtube',{caption:'x',contentType:'video',mediaUrls:[]}),/deferred/);
 assert.throws(()=>buildManualExport('instagram',{caption:'x',contentType:'text',mediaUrls:[]}),/Content type/);
 assert.throws(()=>buildManualExport('x',{caption:'x',contentType:'text',mediaUrls:['http://unsafe.test/media.jpg']}),/HTTPS/);
 assert.throws(()=>buildManualExport('x',{caption:'x',contentType:'text',mediaUrls:['https://user:secret@example.com/a']}),/HTTPS/);
});
test('invalid provider names are not coerced into a social network',()=>{
 assert.equal(isSocialNetwork('unknown'),false);
 assert.equal(getProviderDescriptor('instagram').name,'Instagram');
});

test('disabled and restricted provider policies block manual exports',()=>{
 assert.equal(inspectProvider('youtube',{rollout:'disabled',operatorEnabled:false,apiApproved:false,costApproved:false,productionVerified:false}).canUseManualExport,false);
 assert.equal(inspectProvider('reddit',{rollout:'restricted',operatorEnabled:false,apiApproved:false,costApproved:false,productionVerified:false}).canUseManualExport,false);
});
