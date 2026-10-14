import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {authorizeLabAgent}=require('../dist/connector-lab/connector-lab.guard.js');
const key='a'.repeat(64);
test('Lab agent requires separate high-entropy token, not browser cookies or untrusted headers',()=>{
 assert.equal(authorizeLabAgent('Bearer '+key,key),true);
 for(const [header,secret] of [
  ['Bearer '+'b'.repeat(64),key],['Bearer '+key,''],['Bearer '+key,'short'],
  ['bearer '+key,key],['Bearer '+key+'x',key],[undefined,key],[undefined,undefined],
  ['Bearer '+key,'b'.repeat(64)]
 ])assert.equal(authorizeLabAgent(header,secret),false);
});
