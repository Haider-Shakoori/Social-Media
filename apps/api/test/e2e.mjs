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
