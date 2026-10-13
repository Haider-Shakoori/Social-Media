import assert from 'node:assert/strict';import test from 'node:test';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {conservativeXDraftCheck}=require('../dist/x-pilot/x.service.js');
test('X draft check defaults to text only with no links or media',()=>{
 assert.equal(conservativeXDraftCheck('Valid text',[]).supportedByCurrentPilot,true);
 assert.equal(conservativeXDraftCheck('https://example.test',[]).supportedByCurrentPilot,false);
 assert.equal(conservativeXDraftCheck('a'.repeat(281),[]).withinConservativeLimit,false);
 assert.equal(conservativeXDraftCheck('Photo',['https://example.test/a.jpg']).supportedByCurrentPilot,false);
});
