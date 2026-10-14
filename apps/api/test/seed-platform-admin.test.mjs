import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {provisionPlatformAdmin}=require("../scripts/seed-platform-admin.cjs");
const email="Admin@Socials.BusinessOS.af";
const password="safely-generated-unique-staging-secret-1234";

test("creates a verified platform-only user with a hashed password",async()=>{
  let value;
  const db={user:{
    findUnique:async()=>null,
    create:async({data})=>{value=data;return data;},
  }};
  const result=await provisionPlatformAdmin({db,email,password,hashPassword:async pw=>"hashed:"+pw.length});
  assert.deepEqual(result,{created:true,email:"admin@socials.businessos.af"});
  assert.equal(value.passwordHash,"hashed:"+password.length);
  assert.equal(value.isPlatformAdmin,true);
  assert.equal(value.fullName,"Platform Administrator");
  assert.ok(value.emailVerifiedAt instanceof Date);
  assert.ok(!JSON.stringify(value).includes(password));
});

test("never grants existing non-admin privilege",async()=>{
  let created=false;
  const db={user:{
    findUnique:async()=>({id:"existing",isPlatformAdmin:false}),
    create:async()=>{created=true;},
  }};
  await assert.rejects(provisionPlatformAdmin({db,email,password,hashPassword:async()=>""}),/refusing privilege escalation/);
  assert.equal(created,false);
});

test("repeated run leaves an existing admin password untouched",async()=>{
  const db={user:{
    findUnique:async()=>({id:"admin",isPlatformAdmin:true,passwordHash:"keep-old"}),
    create:async()=>{throw Error("must not create");},
  }};
  const result=await provisionPlatformAdmin({db,email,password,hashPassword:async()=>{throw Error("must not hash");}});
  assert.equal(result.created,false);
});

test("refuses missing, weak or malformed credentials",async()=>{
  const db={user:{findUnique:async()=>{throw Error("never query");}}};
  for(const input of [{email:"invalid",password},{email,password:"short"},{email:undefined,password}]){
    await assert.rejects(provisionPlatformAdmin({db,...input,hashPassword:async()=>""}));
  }
});
