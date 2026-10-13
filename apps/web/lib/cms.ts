import type {Resource} from "./resources";
type CmsResource=Resource & {type:"ARTICLE"|"GUIDE"|"PAGE";locale:string};
function isResource(value:unknown):value is CmsResource {
 if(!value||typeof value!=="object")return false;
 const r=value as Record<string,unknown>;
 return (r.type==="ARTICLE"||r.type==="GUIDE"||r.type==="PAGE")&&r.locale==="en"&&typeof r.slug==="string"
  &&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)&&typeof r.title==="string"
  &&typeof r.description==="string"&&typeof r.category==="string"&&typeof r.readingTime==="string"
  &&Array.isArray(r.sections)&&r.sections.every(x=>x&&typeof x.heading==="string"&&typeof x.body==="string");
}
const base=process.env.CMS_API_BASE_URL?.replace(/\/$/,"");
export async function getCmsResources(type:"ARTICLE"|"GUIDE"|"PAGE"):Promise<Resource[]> {
 if(!base||process.env.CMS_PUBLIC_ENABLED!=="true")return [];
 try{
  const controller=new AbortController();
  const timeout=AbortSignal.timeout(3500);
  const response=await fetch(base+"/cms/public/"+type+"/en",{cache:"no-store",signal:timeout});
  if(!response.ok)return [];
  const result=await response.json() as {items?:unknown[]};
  return Array.isArray(result.items)?result.items.filter(isResource).slice(0,100):[];
 }catch{return [];}
}
export async function getCmsResource(type:"ARTICLE"|"GUIDE"|"PAGE",slug:string):Promise<Resource|null>{
 if(!base||process.env.CMS_PUBLIC_ENABLED!=="true"||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
 try{
  const response=await fetch(base+"/cms/public/"+type+"/en/"+slug,{cache:"no-store",signal:AbortSignal.timeout(3500)});
  if(!response.ok)return null;
  const result=await response.json() as unknown;
  return isResource(result)?result:null;
 }catch{return null;}
}
