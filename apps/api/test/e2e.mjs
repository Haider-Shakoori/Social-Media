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
