import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';

const api='http://127.0.0.1:4000/api/v1';
const mailpit='http://127.0.0.1:8025';
const origin='http://localhost:3000';
const stamp=Date.now().toString(36)+'-'+randomBytes(4).toString('hex');

async function call(method,path,body,cookie,requestOrigin=origin){
  const headers={Origin:requestOrigin};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(cookie)headers.Cookie=cookie;
  const response=await fetch(api+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});
  const data=await response.json().catch(()=>({}));
  return {response,data};
}
function status(result,code,context){assert.equal(result.response.status,code,context+': '+JSON.stringify(result.data));}
async function mailboxToken(address,subjectPrefix,kind){
  for(let i=0;i<35;i++){
    const listing=await fetch(mailpit+'/api/v1/messages?limit=80').then(r=>r.json());
    for(const item of (listing.messages||[])){
      if(!item.Subject?.startsWith(subjectPrefix))continue;
      if(!(item.To||[]).some(to=>to.Address?.toLowerCase()===address.toLowerCase()))continue;
      const message=await fetch(mailpit+'/api/v1/message/'+encodeURIComponent(item.ID)).then(r=>r.json());
      const raw=[message.Text,message.HTML,message.Subject].filter(Boolean).join('\n');
      const match=raw.match(new RegExp(kind+'\\?token=([A-Za-z0-9_-]{40,80})'));
      if(match)return match[1];
    }
    await new Promise(r=>setTimeout(r,300));
  }
  throw new Error('Verification email missing for test account');
}
async function createVerified(label){
  const email=label+'-'+stamp+'@test.local';
  const password='ValidTestingPassword#2026!';
  status(await call('POST','/auth/register',{email,password,fullName:label+' Test'}),202,'register');
  status(await call('POST','/auth/login',{email,password}),401,'unverified login blocked');
  const token=await mailboxToken(email,'Verify your Social-Media','verify-email');
  status(await call('POST','/auth/verify-email',{token}),200,'verify');
  status(await call('POST','/auth/verify-email',{token}),400,'verification token one-time');
  const login=await call('POST','/auth/login',{email,password});
  status(login,200,'login');
  const cookie=login.response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie?.startsWith('social_session='),'login session cookie must be set');
  assert.ok(!JSON.stringify(login.data).includes('passwordHash'));
  status(await call('GET','/auth/me',undefined,cookie),200,'me');
  return {email,password,cookie};
}
const a=await createVerified('alice');
const b=await createVerified('bob');
const slugA='org-a-'+stamp;
const slugB='org-b-'+stamp;
let r=await call('POST','/tenants',{name:'Alice Company',slug:slugA},a.cookie);
status(r,201,'create tenant A');const idA=r.data.tenant.id;
r=await call('POST','/tenants',{name:'Bob Company',slug:slugB},b.cookie);
status(r,201,'create tenant B');const idB=r.data.tenant.id;
status(await call('GET','/tenants/'+idA+'/workspaces',undefined,a.cookie),200,'owner reads own workspaces');
status(await call('GET','/tenants/'+idA+'/workspaces',undefined,b.cookie),404,'B cannot read A workspaces');
status(await call('GET','/tenants/'+idA+'/members',undefined,b.cookie),404,'B cannot enumerate A members');
status(await call('POST','/tenants/'+idA+'/workspaces',{name:'Unauthorized',timezone:'UTC'},b.cookie),404,'B cannot write A workspaces');
status(await call('PATCH','/tenants/'+idA+'/members/'+idB,{role:'ADMIN'},b.cookie),404,'B cannot change A roles');
status(await call('POST','/tenants/'+idA+'/workspaces',{name:'Kabul Team',timezone:'Asia/Kabul'},a.cookie),201,'create own workspace');
status(await call('POST','/tenants/'+idA+'/workspaces',{name:'Bad Timezone',timezone:'Mars/Phobos'},a.cookie),400,'timezone validation');
status(await call('POST','/tenants',{name:'CSRF Attempt',slug:'csrf-'+stamp},a.cookie,'https://malicious.example'),403,'bad origin rejected');
status(await call('POST','/tenants',{name:'No Origin',slug:'noorigin-'+stamp},a.cookie,''),403,'missing origin rejected');
status(await call('GET','/tenants',undefined),401,'session mandatory');
status(await call('POST','/auth/forgot-password',{email:a.email}),202,'request reset');
const reset=await mailboxToken(a.email,'Reset your Social-Media','reset-password');
status(await call('POST','/auth/reset-password',{token:reset,password:'NewTestingPassword#2026!'}),200,'reset password');
status(await call('POST','/auth/reset-password',{token:reset,password:'NewTestingPassword#2026!'}),400,'reset token one-time');
status(await call('GET','/auth/me',undefined,a.cookie),401,'old sessions revoked on password reset');
status(await call('POST','/auth/login',{email:a.email,password:a.password}),401,'old password revoked');
const fresh=await call('POST','/auth/login',{email:a.email,password:'NewTestingPassword#2026!'});
status(fresh,200,'login with reset password');
const freshCookie=fresh.response.headers.get('set-cookie')?.split(';')[0];
status(await call('POST','/auth/logout',{},freshCookie),200,'logout');
status(await call('GET','/auth/me',undefined,freshCookie),401,'logout revokes session');
console.log('PASS: verified registration, email replay rejection, login, tenant isolation, timezone, CSRF, password reset, session revocation.');


// Batch 4: tenant invitation and brand-access regression suite.
const c=await createVerified('charlie');
const d=await createVerified('dina');
const teamWs=await call('GET','/tenants/'+idB+'/workspaces',undefined,b.cookie);
status(teamWs,200,'owner B sees own workspaces');
const wsB=teamWs.data.workspaces[0].id;
const wsAResult=await call('GET','/tenants/'+idA+'/workspaces',undefined,
  (await call('POST','/auth/login',{email:a.email,password:'NewTestingPassword#2026!'})).response.headers.get('set-cookie')?.split(';')[0]);
status(wsAResult,200,'owner A sees own workspaces');
const wsA=wsAResult.data.workspaces[0].id;

status(await call('POST','/tenants/'+idB+'/workspaces/'+wsB+'/brands',{
  name:'Non-owner brand',locale:'en'
},c.cookie),404,'outsider cannot create brand');

let br=await call('POST','/tenants/'+idB+'/workspaces/'+wsB+'/brands',{
  name:'Bilingual Apparel',locale:'fa-AF',languages:['fa-AF','ps','en'],
  industry:'Retail',tone:'Warm and informative',primaryColor:'#21bf9f',
  targetAudience:'Local fashion customers',description:'Use exact product prices and approved imagery.'
},b.cookie);
status(br,201,'owner creates brand');const brandId=br.data.brand.id;
assert.deepEqual(br.data.brand.languages,['fa-AF','ps','en']);
let other=await call('POST','/tenants/'+idA+'/workspaces/'+wsA+'/brands',{name:'Alice Exclusive',locale:'en'},(await call('POST','/auth/login',{email:a.email,password:'NewTestingPassword#2026!'})).response.headers.get('set-cookie')?.split(';')[0]);
status(other,201,'owner A creates separate brand');const otherBrandId=other.data.brand.id;

status(await call('GET','/tenants/'+idB+'/workspaces/'+wsB+'/brands',undefined,c.cookie),404,'outsider cannot list brands');
status(await call('PATCH','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId,{name:'Attack'},c.cookie),404,'outsider cannot patch brand');

let invite=await call('POST','/tenants/'+idB+'/invitations',{email:c.email,role:'EDITOR'},b.cookie);
status(invite,201,'owner sends invitation');
const invited=await mailboxToken(c.email,'Invitation to','invite/accept');
status(await call('POST','/invitations/accept',{token:invited},d.cookie),400,'email-mismatched login cannot redeem');
status(await call('POST','/invitations/accept',{token:invited},c.cookie),201,'correct user accepts invitation');
status(await call('POST','/invitations/accept',{token:invited},c.cookie),400,'single-use invitation replay rejected');
status(await call('GET','/tenants/'+idB+'/workspaces',undefined,c.cookie),200,'invited member can view tenant workspaces');
let listed=await call('GET','/tenants/'+idB+'/workspaces/'+wsB+'/brands',undefined,c.cookie);
status(listed,200,'invited member can view own brand list');assert.equal(listed.data.brands.length,0,'no implicit brand access');

status(await call('POST','/tenants/'+idB+'/workspaces/'+wsB+'/brands',{name:'Escalated Create'},c.cookie),403,'editor cannot create arbitrary brands');
status(await call('POST','/tenants/'+idB+'/invitations',{email:d.email,role:'ADMIN'},c.cookie),403,'editor cannot invite admin');
status(await call('PUT','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId+'/members',{userId:c.email,role:'EDITOR'},c.cookie),400,'grant must use UUID');

const userC=(await call('GET','/auth/me',undefined,c.cookie)).data.id;
status(await call('PUT','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId+'/members',{userId:userC,role:'EDITOR'},c.cookie),404,'nonadmin cannot self-grant brand');
status(await call('PUT','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId+'/members',{userId:userC,role:'EDITOR'},b.cookie),200,'owner grants brand edit access');
listed=await call('GET','/tenants/'+idB+'/workspaces/'+wsB+'/brands',undefined,c.cookie);
status(listed,200,'assigned editor brand list');assert.equal(listed.data.brands.length,1);assert.equal(listed.data.brands[0].myRole,'EDITOR');
status(await call('PATCH','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId,{tone:'Friendly'},c.cookie),200,'assigned editor changes brand profile');
status(await call('DELETE','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId,undefined,c.cookie),403,'editor cannot archive brand');
status(await call('PATCH','/tenants/'+idA+'/workspaces/'+wsA+'/brands/'+otherBrandId,{tone:'Cross-tenant'},c.cookie),404,'editor cannot change another tenant brand');
status(await call('PUT','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId+'/members',{userId:userC,role:'EDITOR'},d.cookie),404,'outsider cannot grant');
status(await call('DELETE','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId+'/members/'+userC,undefined,b.cookie),200,'owner revokes brand permission');
listed=await call('GET','/tenants/'+idB+'/workspaces/'+wsB+'/brands',undefined,c.cookie);
status(listed,200,'revoked editor brand list');assert.equal(listed.data.brands.length,0);
status(await call('PATCH','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId,{tone:'Bad'},c.cookie),404,'revoked editor cannot write');
status(await call('DELETE','/tenants/'+idB+'/workspaces/'+wsB+'/brands/'+brandId,undefined,b.cookie),200,'owner archives brand');
listed=await call('GET','/tenants/'+idB+'/workspaces/'+wsB+'/brands',undefined,b.cookie);
assert.equal(listed.data.brands.length,0,'archived brands hidden');

const emailA=a.email;
invite=await call('POST','/tenants/'+idB+'/invitations',{email:emailA,role:'VIEWER'},b.cookie);
status(invite,201,'invite for revocation');
const revokedToken=await mailboxToken(emailA,'Invitation to','invite/accept');
status(await call('DELETE','/tenants/'+idB+'/invitations/'+invite.data.invitation.id,undefined,b.cookie),200,'revoke invitation');
const aFresh=await call('POST','/auth/login',{email:a.email,password:'NewTestingPassword#2026!'});
status(aFresh,200,'relogin owner A');
const aCookie=aFresh.response.headers.get('set-cookie')?.split(';')[0];
status(await call('POST','/invitations/accept',{token:revokedToken},aCookie),400,'revoked invite cannot be accepted');
console.log('PASS: brands, agency role boundaries, invite mismatch/replay/revocation, explicit brand access and cross-tenant isolation.');

status(await call('DELETE','/tenants/'+idB+'/members/'+userC,undefined,c.cookie),403,'editor cannot remove self or other members');
status(await call('DELETE','/tenants/'+idB+'/members/'+userC,undefined,b.cookie),200,'owner removes collaborator');
status(await call('GET','/tenants/'+idB+'/workspaces',undefined,c.cookie),404,'removed member loses workspace access immediately');


// Batch 5: quotas, trial expiry, privileged subscriptions and offline payment audit.
const {createRequire}=await import('node:module');
const require=createRequire(import.meta.url);
const {PrismaClient}=require('@prisma/client');
const {EntitlementsService}=require('../dist/billing/entitlements.service.js');
const billingDb=new PrismaClient();
try {
  let response=await call('GET','/billing/tenants/'+idB,undefined,b.cookie);
  status(response,200,'tenant owner sees own trial subscription');
  assert.equal(response.data.subscription.state,'TRIALING');
  assert.equal(response.data.subscription.limits.maxBrands,2);
  status(await call('GET','/billing/tenants/'+idB,undefined,aCookie),404,'other tenant cannot access billing');
  response=await call('GET','/billing/plans');
  status(response,200,'public plan list');assert.equal(response.data.plans.length,0,'no paid plans published initially');
  status(await call('GET','/platform/billing/plans',undefined,b.cookie),403,'ordinary tenant owner is not platform admin');
  status(await call('POST','/platform/billing/tenants/'+idB+'/suspend',{},b.cookie),403,'tenant cannot self-activate/suspend');

  const brandBase='/tenants/'+idB+'/workspaces/'+wsB+'/brands';
  status(await call('POST',brandBase,{name:'Brand One',locale:'en'},b.cookie),201,'first subscription brand');
  status(await call('POST',brandBase,{name:'Brand Two',locale:'ps'},b.cookie),201,'second subscription brand');
  status(await call('POST',brandBase,{name:'Third Should Fail',locale:'en'},b.cookie),403,'third brand over quota');
  status(await call('POST','/tenants/'+idB+'/invitations',{email:c.email,role:'EDITOR'},b.cookie),201,'seat reservation one');
  status(await call('POST','/tenants/'+idB+'/invitations',{email:d.email,role:'VIEWER'},b.cookie),201,'seat reservation two');
  const fifth=await createVerified('fifth');
  status(await call('POST','/tenants/'+idB+'/invitations',{email:fifth.email,role:'VIEWER'},b.cookie),403,'pending invitations enforce seat limit');

  const quota=new EntitlementsService(billingDb);
  const results=await Promise.allSettled([quota.consume(idB,'AI_TEXT',20),quota.consume(idB,'AI_TEXT',20)]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1,'concurrent AI calls must not overspend');
  assert.equal(results.filter(x=>x.status==='rejected').length,1,'one concurrent request must fail');
  response=await call('GET','/billing/tenants/'+idB,undefined,b.cookie);
  assert.equal(response.data.usage.aiText,20,'usage stored in current UTC month');

  await billingDb.subscription.update({where:{tenantId:idB},data:{
    periodEnd:new Date(Date.now()-86400000),trialEndsAt:new Date(Date.now()-86400000),
  }});
  response=await call('GET','/billing/tenants/'+idB,undefined,b.cookie);
  assert.equal(response.data.subscription.state,'EXPIRED','status evaluated dynamically, not via cron');
  status(await call('POST',brandBase,{name:'Expired Trial Brand',locale:'en'},b.cookie),403,'expired trial denies brand creation');
  const waitingToken=await mailboxToken(c.email,'Invitation to','invite/accept');
  status(await call('POST','/invitations/accept',{token:waitingToken},c.cookie),403,'expired subscription blocks pending invite acceptance');
  await assert.rejects(quota.consume(idB,'AI_TEXT',1),'expired trial denies credits');

  const platformId=(await call('GET','/auth/me',undefined,b.cookie)).data.id;
  await billingDb.user.update({where:{id:platformId},data:{isPlatformAdmin:true}});
  status(await call('GET','/platform/billing/plans',undefined,b.cookie),200,'explicitly designated admin can see plan registry');
  response=await call('POST','/platform/billing/tenants/'+idB+'/trial/extend',{days:7},b.cookie);
  status(response,201,'admin extends expired trial');assert.equal(response.data.state,'TRIALING');

  response=await call('PATCH','/platform/billing/plans/growth',{
    enabled:true,published:true,monthlyPriceMinor:2500,yearlyPriceMinor:25000,
  },b.cookie);
  status(response,200,'admin can configure private growth plan');
  response=await call('GET','/billing/plans');
  status(response,200,'published plans available');assert.equal(response.data.plans.length,1);
  response=await call('POST','/platform/billing/tenants/'+idB+'/activate',{
    planCode:'growth',cycle:'MONTHLY',
  },b.cookie);
  status(response,201,'platform-only manual activation');
  response=await call('GET','/billing/tenants/'+idB,undefined,b.cookie);
  assert.equal(response.data.subscription.state,'ACTIVE');
  assert.equal(response.data.subscription.limits.maxBrands,6);
  status(await call('PATCH','/platform/billing/plans/growth',{maxBrands:7},b.cookie),200,'operator edits plan definition');
  response=await call('GET','/billing/tenants/'+idB,undefined,b.cookie);
  assert.equal(response.data.subscription.limits.maxBrands,6,'existing subscription keeps snapshot');

  response=await call('POST','/platform/billing/invoices',{
    tenantId:idB,planCode:'growth',amountMinor:2500,currency:'USD',
  },b.cookie);
  status(response,201,'operator issues manual invoice');const invoiceId=response.data.invoice.id;
  status(await call('POST','/platform/billing/payments',{invoiceId,reference:'CASH-'+stamp,note:'Cash received test'},aCookie),403,'non-admin cannot record payment');
  response=await call('POST','/platform/billing/payments',{invoiceId,reference:'CASH-'+stamp,note:'Cash received test'},b.cookie);
  status(response,201,'admin records pending payment');const paymentId=response.data.payment.id;
  assert.equal(response.data.payment.state,'PENDING');
  const administratorDetails=await call('GET','/platform/billing/tenants/'+idB,undefined,b.cookie);
  status(administratorDetails,200,'admin can reload persisted pending payment records');
  assert.equal(administratorDetails.data.payments.find(p=>p.id===paymentId)?.state,'PENDING');
  response=await call('GET','/billing/tenants/'+idB,undefined,b.cookie);
  assert.equal(response.data.invoices[0].status,'ISSUED','recording does not mark paid');
  response=await call('POST','/platform/billing/payments/'+paymentId+'/decision',{decision:'VERIFY'},b.cookie);
  status(response,201,'operator verifies payment');assert.equal(response.data.payment.state,'VERIFIED');
  status(await call('POST','/platform/billing/payments/'+paymentId+'/decision',{decision:'VERIFY'},b.cookie),409,'verification replay is rejected');
  response=await call('GET','/billing/tenants/'+idB,undefined,b.cookie);
  assert.equal(response.data.invoices[0].status,'PAID');
  assert.equal(response.data.payments[0].state,'VERIFIED');

  status(await call('POST','/platform/billing/tenants/'+idB+'/suspend',{},b.cookie),201,'platform suspends subscription');
  status(await call('POST',brandBase,{name:'Suspended Brand',locale:'en'},b.cookie),403,'suspension blocks brand creation');
  status(await call('POST','/platform/billing/tenants/'+idB+'/resume',{},b.cookie),201,'resume remaining paid period');
  status(await call('POST','/platform/billing/tenants/'+idB+'/grace',{days:3},b.cookie),201,'operator grants grace');
  response=await call('GET','/billing/tenants/'+idB,undefined,b.cookie);
  assert.equal(response.data.subscription.state,'GRACE');
  const logs=await billingDb.billingAuditEvent.count({where:{tenantId:idB}});
  assert.ok(logs>=6,'admin actions must be audit-logged');
  status(await call('GET','/platform/billing/tenants/'+idB,undefined,aCookie),403,'no cross-role platform access');
  console.log('PASS: trial lifecycle, quota serialization, expiry, platform controls, invoices, manual payments, audit records.');
} finally {
  await billingDb.user.updateMany({where:{email:b.email},data:{isPlatformAdmin:false}});
  await billingDb.$disconnect();
}


// Batch 6 — real DB platform role boundaries, CMS drafts and deliberate publication gates.
const opsDb=new PrismaClient();
try{
  status(await call('GET','/platform/operations/overview',undefined,aCookie),403,'tenant owner is not a platform administrator');
  status(await call('GET','/platform/operations/cms',undefined,c.cookie),403,'former collaborator cannot manage CMS');
  status(await call('GET','/platform/operations/users'),401,'public cannot enumerate platform users');
  let response=await call('GET','/cms/public/ARTICLE/en');
  status(response,200,'anonymous CMS endpoint available but gated');
  assert.deepEqual(response.data.items,[],'public CMS must start empty');
  const adminId=(await call('GET','/auth/me',undefined,b.cookie)).data.id;
  await opsDb.user.update({where:{id:adminId},data:{isPlatformAdmin:true}});
  response=await call('GET','/platform/operations/overview',undefined,b.cookie);
  status(response,200,'authorized operator sees aggregate platform counts');
  assert.ok(response.data.tenants>=2&&response.data.users>=3);
  assert.ok(!JSON.stringify(response.data).includes('passwordHash'));
  response=await call('GET','/platform/operations/users?page=1',undefined,b.cookie);
  status(response,200,'admin accounts listing');assert.ok(response.data.users.length>=3);
  assert.ok(response.data.users.every(u=>!('passwordHash'in u)&&!('tokenHash'in u)));
  status(await call('GET','/platform/operations/users?page=0',undefined,b.cookie),400,'pagination validated');
  response=await call('GET','/platform/operations/tenants?page=1',undefined,b.cookie);
  status(response,200,'admin tenant listings');assert.ok(response.data.tenants.some(t=>t.id===idA));

  const base='/platform/operations/cms';
  const valid={
    type:'ARTICLE',locale:'en',slug:'cms-batch-six-'+stamp,title:'Safe editorial demo for operators',
    description:'Long editorial description that is appropriate for the pre-launch CMS experiment.',
    category:'Product updates',readingTime:'3 min',sections:[
      {heading:'What is tested',body:'This text comes from persisted CMS content, not a placeholder card.'},
    ],
  };
  status(await call('POST',base,valid,aCookie),403,'tenant owner cannot write CMS');
  status(await call('POST',base,{...valid,slug:'../../bad'},b.cookie),400,'unsafe slug validation');
  response=await call('POST',base,valid,b.cookie);
  status(response,201,'operator can create CMS draft');const entryId=response.data.entry.id;
  assert.equal(response.data.entry.status,'DRAFT');
  response=await call('GET',base+'?page=1',undefined,b.cookie);
  status(response,200,'draft appears in protected CMS index');
  assert.ok(response.data.entries.some(e=>e.id===entryId));
  status(await call('POST',base+'/'+entryId+'/publish',{expectedRevision:1},aCookie),403,'nonadmin cannot publish');
  status(await call('POST',base+'/'+entryId+'/publish',{expectedRevision:999},b.cookie),409,'stale revision cannot publish');

  response=await call('PATCH',base+'/'+entryId,{
    expectedRevision:1,title:'Safe revised editorial title',sections:[
      {heading:'Reviewed content',body:'An approved plain text section; no raw HTML is rendered.'}
    ]
  },b.cookie);
  status(response,200,'operator edits draft');assert.equal(response.data.entry.revision,2);
  status(await call('PATCH',base+'/'+entryId,{expectedRevision:1,title:'Stale editor'},b.cookie),409,'stale editor rejected');

  response=await call('GET','/cms/public/ARTICLE/en');
  assert.deepEqual(response.data.items,[],'draft is never public even with API access');

  response=await call('PATCH','/platform/operations/settings',{key:'cms_public_enabled',value:true},b.cookie);
  status(response,200,'operator enables public CMS setting');
  status(await call('PATCH','/platform/operations/settings',{key:'publishing_enabled',value:true},b.cookie),400,'unknown unsafe platform settings forbidden');
  status(await call('PATCH','/platform/operations/settings',{key:'support_email',value:'invalid email'},b.cookie),400,'email setting validated');
  status(await call('PATCH','/platform/operations/settings',{key:'support_email',value:'support@example.test'},b.cookie),200,'safe support email');

  response=await call('POST',base+'/'+entryId+'/publish',{expectedRevision:2},b.cookie);
  status(response,201,'operator explicitly publishes CMS entry');
  assert.equal(response.data.entry.status,'PUBLISHED');
  const publishedRevision=response.data.entry.revision;
  response=await call('GET','/cms/public/ARTICLE/en');
  status(response,200,'published CMS index');
  assert.ok(response.data.items.some(x=>x.slug===valid.slug),'public list contains published entry');
  response=await call('GET','/cms/public/ARTICLE/en/'+valid.slug);
  status(response,200,'published article routed');
  assert.equal(response.data.title,'Safe revised editorial title');
  status(await call('GET','/cms/public/GUIDE/en/'+valid.slug),404,'CMS type segregation');
  status(await call('GET','/cms/public/ARTICLE/unknown/'+valid.slug),404,'unknown locale rejected');

  response=await call('PATCH',base+'/'+entryId,{expectedRevision:publishedRevision,title:'Retracted for review'},b.cookie);
  status(response,200,'editing published content retracts it');
  assert.equal(response.data.entry.status,'DRAFT');
  status(await call('GET','/cms/public/ARTICLE/en/'+valid.slug),404,'edited article hidden until reapproved');
  response=await call('POST',base+'/'+entryId+'/archive',{expectedRevision:response.data.entry.revision},b.cookie);
  status(response,201,'archived post cannot reappear');
  status(await call('POST',base+'/'+entryId+'/publish',{expectedRevision:response.data.entry.revision},b.cookie),409,'archived content cannot be published');

  const newGuide={...valid,type:'GUIDE',slug:'guide-six-'+stamp,title:'Guide content for the documented workflow'};
  response=await call('POST',base,newGuide,b.cookie);
  status(response,201,'create guide in separate content type');
  const guideId=response.data.entry.id;
  response=await call('POST',base+'/'+guideId+'/publish',{expectedRevision:1},b.cookie);
  status(response,201,'publish guide');
  response=await call('PATCH','/platform/operations/settings',{key:'cms_public_enabled',value:false},b.cookie);
  status(response,200,'operator turns public CMS off');
  status(await call('GET','/cms/public/GUIDE/en/'+newGuide.slug),404,'public disable immediately hides published guide');
  response=await call('GET','/platform/operations/audit?page=1',undefined,b.cookie);
  status(response,200,'operator audit trail');
  assert.ok(response.data.events.some(e=>e.action==='cms.publish'));
  assert.ok(response.data.events.some(e=>e.action==='platform.setting.update'));
  status(await call('GET','/platform/operations/audit',undefined,aCookie),403,'audit is admin-only');
  console.log('PASS: platform metrics, users, CMS drafts, revision locks, publish/retract, settings, auditing, immediate public disable.');
}finally{
  await opsDb.user.updateMany({where:{email:b.email},data:{isPlatformAdmin:false}});
  await opsDb.$disconnect();
}
