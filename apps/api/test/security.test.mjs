import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {hashPassword,verifyPassword,createToken,hashToken}=require('../dist/security/crypto.js');
const {readSessionCookie,validateRequestOrigin}=require('../dist/security/request-security.js');
test('password hashed with random salt and verified using timing-safe comparison',async()=>{
 const hash=await hashPassword('SufficientlyLongPassword123!');
 assert.ok(hash.startsWith('scrypt.v1.'));
 assert.notEqual(hash,await hashPassword('SufficientlyLongPassword123!'));
 assert.equal(await verifyPassword('SufficientlyLongPassword123!',hash),true);
 assert.equal(await verifyPassword('NotTheSamePassword123!',hash),false);
});
test('unguessable tokens hashed and cookie extraction is strict',()=>{
 const raw=createToken();
 assert.equal(raw.length>=40,true);
 assert.notEqual(hashToken(raw),raw);
 assert.equal(readSessionCookie('theme=dark; social_session='+raw),raw);
 assert.equal(readSessionCookie('social_session=not a session'),null);
});
test('CSRF origin check rejects state changes from untrusted or missing origins',()=>{
 const allowed=['https://app.example.test'];
 assert.doesNotThrow(()=>validateRequestOrigin('GET',undefined,allowed));
 assert.doesNotThrow(()=>validateRequestOrigin('POST',allowed[0],allowed));
 assert.throws(()=>validateRequestOrigin('POST',undefined,allowed));
 assert.throws(()=>validateRequestOrigin('PATCH','https://evil.example.test',allowed));
});
