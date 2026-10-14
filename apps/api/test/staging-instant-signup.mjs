import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
const api='http://127.0.0.1:4001/api/v1';
const email='instant-'+randomBytes(10).toString('hex')+'@test.local';
const password='InstantSignupTest#2026VeryStrong';
async function call(path,method='GET',body,cookie){
 const headers={Origin:'http://localhost:3000'};
 if(body!==undefined)headers['Content-Type']='application/json';
 if(cookie)headers.Cookie=cookie;
 const response=await fetch(api+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 return {response,data:await response.json().catch(()=>({}))};
}
try{
 const signup=await call('/auth/register','POST',{email,password,fullName:'Instant Signup Test'});
 assert.equal(signup.response.status,202,'instant signup: '+JSON.stringify(signup.data));
 assert.equal(signup.data.user?.email,email);
 assert.equal(signup.data.user?.emailVerified,true,'new staging client may proceed without confirmation');
 assert.ok(!('token' in signup.data),'session secret must not be returned in JSON');
 const cookie=signup.response.headers.get('set-cookie')||'';
 assert.match(cookie,/^social_session=/);
 assert.match(cookie,/HttpOnly/);
 const session=cookie.split(';')[0];
 const me=await call('/auth/me','GET',undefined,session);
 assert.equal(me.response.status,200,'new user is immediately signed in');
 assert.equal(me.data.email,email);
 const record=await db.user.findUnique({where:{email}});
 assert.ok(record?.emailVerifiedAt,'controlled staging bypass only: user is marked eligible for login');
 const duplicate=await call('/auth/register','POST',{email,password,fullName:'Another User'});
 assert.equal(duplicate.response.status,202,'duplicate receives generic response');
 assert.ok(!duplicate.data.user,'duplicate cannot create authenticated identity');
 assert.ok(!duplicate.response.headers.get('set-cookie'),'duplicate must not receive a session');
 const normalLogin=await call('/auth/login','POST',{email,password});
 assert.equal(normalLogin.response.status,200,'existing client can sign in normally');
 const logout=await call('/auth/logout','POST',{},session);
 assert.equal(logout.response.status,200);
 const revoked=await call('/auth/me','GET',undefined,session);
 assert.equal(revoked.response.status,401,'logout invalidates the session');
 console.log('PASS: staging instant signup, first-login cookie, session, duplicate rejection, normal login, logout.');
}finally{
 await db.user.deleteMany({where:{email}});
 await db.$disconnect();
}
