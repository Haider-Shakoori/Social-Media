import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import path from "node:path";
import test from "node:test";
import {primaryNavigation,footerGroups,faqItems,platformPlans,plans} from "../lib/site";
import {articles,guides} from "../lib/resources";
import {marketingPages,solutions} from "../lib/marketing-pages";
import {draftLegalPages} from "../lib/legal";
const app=path.join(import.meta.dirname,"..","app");
function routeExists(href:string):boolean{
 if(href==="/")return existsSync(path.join(app,"page.tsx"));
 const parts=href.replace(/^\//,"").split("/");
 if(existsSync(path.join(app,...parts,"page.tsx")))return true;
 if(parts.length===1)return Boolean(marketingPages[parts[0]]||draftLegalPages[parts[0]]);
 if(parts[0]==="solutions"&&parts.length===2)return Boolean(solutions[parts[1]]);
 if(parts[0]==="blog"&&parts.length===2)return articles.some(x=>x.slug===parts[1]);
 if(parts[0]==="docs"&&parts.length===2)return guides.some(x=>x.slug===parts[1]);
 return false;
}
test("footer and navigation destinations resolve",()=>{
 const hrefs:string[]=[...primaryNavigation.map(x=>x.href),...footerGroups.flatMap(group=>group.links.map(link=>link.href))];
 for(const href of hrefs){
   assert.equal(routeExists(href),true,"Missing route: "+href);
 }
});
test("slugs remain unique",()=>{
 const groups=[Object.keys(marketingPages),Object.keys(solutions),[...Object.keys(marketingPages),...Object.keys(draftLegalPages)],articles.map(x=>x.slug),guides.map(x=>x.slug)];
 for(const list of groups)assert.equal(list.length,new Set(list).size);
});
test("integration claims disclose planned availability",()=>{
 assert.ok(faqItems.length>=6);assert.ok(plans.length>=3);assert.ok(platformPlans.length>=6);
 assert.ok(platformPlans.every(x=>(["Planned","Review required","Manual fallback"] as string[]).includes(x.status)));
});
