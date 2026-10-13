import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {randomUrlToken,tokenHash,seal,unseal,challenge}=require('../dist/social-oauth/oauth-crypto.js');
const {authorizeUrl,hasOAuthConfig}=require('../dist/social-oauth/provider-transport.js');
test('OAuth state and X PKCE challenge are properly generated',()=>{
 const first=randomUrlToken(),second=randomUrlToken();
 assert.notEqual(first,second);
 assert.match(first,/^[A-Za-z0-9_-]{40,60}$/);
 assert.equal(tokenHash(first).length,64);
 assert.notEqual(tokenHash(first),tokenHash(second));
 const verifier=randomUrlToken(48);
 assert.match(challenge(verifier),/^[A-Za-z0-9_-]{40,60}$/);
 assert.notEqual(challenge(verifier),verifier);
});
test('AES-256-GCM keeps tokens encrypted and rejects tampering',()=>{
 const old=process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
 try{
  process.env.SOCIAL_TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,9).toString('base64');
  const token='fake-meta-or-x-secret-token-123456';
  const encrypted=seal({accessToken:token,refreshToken:'refresh-456'});
  assert.match(encrypted,/^v1\./);
  assert.equal(encrypted.includes(token),false);
  assert.equal(unseal(encrypted).accessToken,token);
  const parts=encrypted.split('.');
  parts[3]=parts[3].slice(0,-3)+'aaa';
  assert.throws(()=>unseal(parts.join('.')));
  process.env.SOCIAL_TOKEN_ENCRYPTION_KEY='invalid';
  assert.throws(()=>seal({accessToken:token}),/32 bytes/);
 }finally{
  if(old===undefined)delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  else process.env.SOCIAL_TOKEN_ENCRYPTION_KEY=old;
 }
});
test('Meta and X OAuth only use intended official hosts and callback URLs',()=>{
 const old={};
 const vars=['META_APP_ID','META_APP_SECRET','META_REDIRECT_URI','X_CLIENT_ID','X_CLIENT_SECRET','X_REDIRECT_URI'];
 for(const name of vars)old[name]=process.env[name];
 try{
  Object.assign(process.env,{
   META_APP_ID:'app-test-id',META_APP_SECRET:'fake-secret',
   META_REDIRECT_URI:'https://social.example.com/api/v1/social/oauth/meta/callback',
   X_CLIENT_ID:'fake-x-id',X_CLIENT_SECRET:'fake-x-secret',
   X_REDIRECT_URI:'https://social.example.com/api/v1/social/oauth/x/callback',
  });
  assert.equal(hasOAuthConfig('meta'),true);
  const meta=new URL(authorizeUrl('meta','state-test-123'));
  assert.equal(meta.hostname,'www.facebook.com');
  assert.equal(meta.searchParams.get('redirect_uri'),process.env.META_REDIRECT_URI);
  assert.ok(meta.searchParams.get('scope').includes('pages_manage_posts'));
  const x=new URL(authorizeUrl('x','state-test-123','pkce-verifier'));
  assert.equal(x.hostname,'x.com');
  assert.equal(x.searchParams.get('code_challenge'),challenge('pkce-verifier'));
  assert.equal(x.searchParams.get('code_challenge_method'),'S256');
  assert.ok(x.searchParams.get('scope').includes('offline.access'));
  process.env.X_REDIRECT_URI='http://evil.example.net/callback';
  assert.throws(()=>authorizeUrl('x','state-test-123','v'),/HTTPS/);
 }finally{
  for(const name of vars){if(old[name]===undefined)delete process.env[name];else process.env[name]=old[name];}
 }
});
