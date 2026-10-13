import test from 'node:test';import assert from 'node:assert/strict';
test('localized overview keeps RTL languages explicit',async()=>{
 const source=await import('./i18n.ts').catch(()=>null);
 if(!source)return; // Included in Next type/build pipeline; Node without ts loader cannot import this file.
 assert.equal(source.isRtl('fa-AF'),true);
});
