import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {accountDirectory,allowedOrigins,assertAllowedRequest,createAccountDirectory} from '../config';
import {proxyForAccount} from '../proxy';
const env={EXPERIMENTAL_BROWSER_LAB_ENABLED:'true',BROWSER_LAB_ALLOWED_ORIGINS:'https://example.org,http://localhost:3000'};
test('lab defaults fail-closed, and allowlisted URLs require valid operator authorization',()=>{
 assert.throws(()=>assertAllowedRequest({accountKey:'client-001',targetUrl:'https://example.org',driver:'playwright'},{}),/disabled/);
 assert.deepEqual([...allowedOrigins(env)],['https://example.org','http://localhost:3000']);
 assert.equal(assertAllowedRequest({accountKey:'client-001',targetUrl:'https://example.org/news',driver:'patchright'},env).pathname,'/news');
 for(const targetUrl of ['https://facebook.com/','http://example.org','file:///etc/passwd','https://user:pass@example.org','https://example.org/#private']){
  assert.throws(()=>assertAllowedRequest({accountKey:'client-001',targetUrl,driver:'playwright'},env));
 }
 assert.throws(()=>allowedOrigins({...env,BROWSER_LAB_ALLOWED_ORIGINS:'http://untrusted.example'}));
 assert.throws(()=>assertAllowedRequest({accountKey:'../root',targetUrl:'https://example.org',driver:'playwright'},env));
 assert.throws(()=>assertAllowedRequest({accountKey:'client-001',targetUrl:'https://example.org',driver:'selenium' as 'playwright'},env));
});
test('browser profiles cannot escape their root and each account gets isolated storage',async()=>{
 const root=await mkdtemp(join(tmpdir(),'browser-lab-'));
 try{
  assert.notEqual(accountDirectory(root,'account-001'),accountDirectory(root,'account-002'));
  const dir=await createAccountDirectory(root,'account-001');
  assert.ok(dir.startsWith(root));
  assert.throws(()=>accountDirectory(root,'../../bad'));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('operator proxies are per-account; invalid auth and inline passwords rejected',async()=>{
 const root=await mkdtemp(join(tmpdir(),'proxy-lab-'));
 const file=join(root,'map.json');
 try{
  await writeFile(file,JSON.stringify({
   'account-001':{server:'http://proxy.test:3128',username:'alice',password:'private-token'},
   'account-002':{server:'socks5://proxy.test:1080'},
  }));
  const first=await proxyForAccount('account-001',file);
  assert.equal(first?.server,'http://proxy.test:3128');
  assert.equal(first?.username,'alice');
  assert.equal(first?.password,'private-token');
  assert.equal((await proxyForAccount('account-002',file))?.server,'socks5://proxy.test:1080');
  assert.equal(await proxyForAccount('account-003',file),undefined);
  assert.equal(await proxyForAccount('account-001'),undefined);
  await writeFile(file,JSON.stringify({'account-001':{server:'http://username:pass@proxy.test:3128'}}));
  await assert.rejects(proxyForAccount('account-001',file),/Invalid proxy/);
  await writeFile(file,JSON.stringify({'account-001':{server:'socks5://proxy.test:1080',username:'alice'}}));
  await assert.rejects(proxyForAccount('account-001',file),/Authenticated SOCKS5/);
 }finally{await rm(root,{recursive:true,force:true});}
});
