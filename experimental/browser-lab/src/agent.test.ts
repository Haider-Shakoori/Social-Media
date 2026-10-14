import assert from 'node:assert/strict';
import test from 'node:test';
import {bridgeConfigured} from './agent';
test('management agent stays off without all required operator gates',()=>{
 const good={EXPERIMENTAL_BROWSER_LAB_ENABLED:'true',BROWSER_LAB_MAX_SESSIONS:'1',
  BROWSER_LAB_AGENT_TOKEN:'a'.repeat(64),
  BROWSER_LAB_CONTROL_API_URL:'https://socials.businessos.af/api/v1'};
 assert.equal(bridgeConfigured(good),true);
 assert.equal(bridgeConfigured({...good,BROWSER_LAB_MAX_SESSIONS:'2'}),false);
 assert.equal(bridgeConfigured({...good,BROWSER_LAB_AGENT_TOKEN:''}),false);
 assert.equal(bridgeConfigured({...good,BROWSER_LAB_CONTROL_API_URL:'http://localhost:4000/api/v1'}),false);
 assert.equal(bridgeConfigured({}),false);
});
