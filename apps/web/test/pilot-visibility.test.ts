import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {platformPlans,faqItems} from "../lib/site";

test("public pilot displays only Facebook, Instagram, and X",()=>{
 const names=platformPlans.map(x=>x.name);
 assert.deepEqual(names,["Facebook Pages","Instagram","X (Twitter)"]);
 assert.ok(platformPlans.every(p=>p.detail.toLowerCase().includes("disabled")||p.detail.toLowerCase().includes("manual")));
});

test("tenant and operator provider cards exclude deferred networks",()=>{
 for(const file of ["tenant-connectors.tsx","platform-providers.tsx"]){
  const source=readFileSync(new URL("../components/"+file,import.meta.url),"utf8");
  assert.match(source,/\["facebook","instagram","x"\]/);
 }
});

test("pilot FAQ does not promise all ten networks",()=>{
 const q=faqItems.map(f=>f.q);
 assert.ok(q.includes("Which social networks are available in the pilot?"));
 assert.ok(!q.some(x=>x.includes("ten planned platforms")));
});
