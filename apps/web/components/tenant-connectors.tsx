"use client";
import {useEffect,useState,type FormEvent} from "react";
import {MetaXConnections} from "./meta-x-connections";
import {StudioWorkbench} from "./studio-workbench";
type Workspace={id:string;name:string};
type Brand={id:string;name:string};
type Provider={id:string;name:string;rollout:string;canConnect:boolean;canPublish:boolean;canUseManualExport:boolean;
 accountHint:string;accessRequirement:string;contentCandidates:string[];rolloutBatch:number;reason:string};
const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
const inputClass="mt-2 w-full rounded-xl border border-white/20 bg-[#07131b] p-3 text-sm text-white";
async function query<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const response=await fetch(API+path,{method,credentials:"include",cache:"no-store",
  headers:body===undefined?undefined:{"Content-Type":"application/json"},
  body:body===undefined?undefined:JSON.stringify(body)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(typeof data.message==="string"?data.message:"Request failed");
 return data as T;
}
export function TenantConnectors({tenantId,workspaces,role}:{tenantId:string;workspaces:Workspace[];role:string}){
 const [providers,setProviders]=useState<Provider[]>([]);
 const [brands,setBrands]=useState<Brand[]>([]);
 const [workspaceId,setWorkspaceId]=useState(""),[brandId,setBrandId]=useState("");
 const scopedWorkspace=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("socialWorkspace"):null;
 const scopedBrand=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("socialBrand"):null;
 const [network,setNetwork]=useState("instagram"),[contentType,setContentType]=useState("image");
 const [caption,setCaption]=useState(""),[mediaLines,setMediaLines]=useState(""),[note,setNote]=useState("");
 const [preview,setPreview]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  let live=true;setProviders([]);setPreview("");setError("");setWorkspaceId(workspaces.some(w=>w.id===scopedWorkspace)?scopedWorkspace!:workspaces[0]?.id||"");
  void query<{providers:Provider[]}>("/tenants/"+tenantId+"/providers").then(d=>{if(live)setProviders(d.providers.filter(p=>["facebook","instagram","x"].includes(p.id)));})
   .catch(e=>{if(live)setError(e instanceof Error?e.message:"Could not load connector catalog");});
  return()=>{live=false;};
 },[tenantId,workspaces[0]?.id]);
 useEffect(()=>{
  if(!workspaceId){setBrands([]);setBrandId("");return;}
  let live=true;setBrandId("");setBrands([]);
  void query<{brands:Brand[]}>("/tenants/"+tenantId+"/workspaces/"+workspaceId+"/brands")
   .then(d=>{if(live){setBrands(d.brands);setBrandId(d.brands.some(b=>b.id===scopedBrand)?scopedBrand!:d.brands[0]?.id||"");}})
   .catch(()=>{if(live)setBrands([]);});
  return()=>{live=false;};
 },[tenantId,workspaceId]);
 const selected=providers.find(p=>p.id===network);
 function chooseNetwork(value:string){setNetwork(value);setContentType(providers.find(p=>p.id===value)?.contentCandidates[0]||"text");setPreview("");}
 async function createPackage(e:FormEvent){e.preventDefault();setBusy(true);setError("");setPreview("");
  try{
   if(!workspaceId||!brandId)throw new Error("Select a brand to prepare manual posting assets.");
   const data=await query<{package:unknown;notice:string}>("/tenants/"+tenantId+"/providers/workspaces/"+workspaceId+"/brands/"+brandId+"/manual-package","POST",{
    network,contentType,caption,mediaUrls:mediaLines.split("\n").map(x=>x.trim()).filter(Boolean),destinationNote:note,
   });
   setPreview(JSON.stringify(data.package,null,2));
  }catch(e){setError(e instanceof Error?e.message:"Could not create package");}
  finally{setBusy(false);}
 }
 return <section className="mt-10 space-y-6 rounded-3xl border border-white/10 bg-[#102630] p-7">
  <div><p className="text-xs font-bold tracking-widest text-emerald-300">SOCIAL ACCOUNT CONNECTIONS</p>
   <h2 className="mt-3 text-2xl font-bold">Connect social accounts</h2>
   <p className="mt-3 text-sm leading-7 text-slate-300">Select a workspace and brand, then authorize your Facebook Pages or Instagram professional account using Meta. X remains manual-only. Connecting does not publish content.</p>
  </div>
  {error&&<p role="alert" className="rounded-xl border border-rose-300/30 p-4 text-sm text-rose-200">{error}</p>}
  <section className="rounded-2xl border border-emerald-300/20 bg-[#071d22] p-5">
   <h3 className="text-lg font-bold">1. Choose the brand to connect</h3>
   <p className="mb-4 mt-2 text-sm text-slate-300">Your authorized Facebook Page or Instagram account will belong to the selected brand.</p>
    <div className="grid gap-4 sm:grid-cols-2">
     <label className="text-xs text-slate-300">Workspace<select value={workspaceId} onChange={e=>setWorkspaceId(e.target.value)} className={inputClass}>
      <option value="">Select workspace</option>{workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
     </select></label>
     <label className="text-xs text-slate-300">Brand<select value={brandId} onChange={e=>setBrandId(e.target.value)} className={inputClass}>
      <option value="">Select brand</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
     </select></label>
    </div>
   {!workspaces.length&&<p className="mt-4 text-sm text-amber-200">First create an organization workspace above, then add a brand below.</p>}
   {workspaceId&&!brands.length&&<p className="mt-4 text-sm text-amber-200">Create a brand in Brand & Team Management before connecting a social account.</p>}
  </section>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
   {providers.map(p=><button type="button" onClick={()=>chooseNetwork(p.id)} key={p.id} className={"rounded-xl border p-4 text-left "+(p.id===network?"border-emerald-300/50 bg-emerald-300/10":"border-white/10")}>
    <h3 className="text-sm font-bold">{p.name}</h3><p className="mt-2 text-xs text-slate-400">{p.id==="x"?"Manual export":p.rollout==="testing"?"Meta authorization testing":"Meta authorization setup required"}</p>
    <p className="mt-3 text-xs text-amber-200">{p.id==="x"?"Manual posting only":"Connect via official Meta login"} · No automatic publishing</p>
   </button>)}
  </div>
 
  {["OWNER","ADMIN"].includes(role)&&workspaceId&&brandId&&
   <MetaXConnections tenantId={tenantId} workspaceId={workspaceId} brandId={brandId}/>}
  {workspaceId&&brandId&&<StudioWorkbench tenantId={tenantId} workspaceId={workspaceId} brandId={brandId}/>}
  <form onSubmit={e=>void createPackage(e)} className="grid gap-5 border-t border-white/10 pt-7 lg:grid-cols-2">
   <div className="space-y-4">
    <h3 className="text-lg font-bold">Manual export preparation</h3>
    <label className="block text-xs text-slate-300">Content type<select className={inputClass} value={contentType} onChange={e=>setContentType(e.target.value)}>
     {(selected?.contentCandidates||[]).map(format=><option key={format} value={format}>{format.replaceAll("_"," ")}</option>)}
    </select></label>
    <label className="block text-xs text-slate-300">Caption<textarea className={inputClass} rows={4} minLength={1} maxLength={5000} required value={caption} onChange={e=>setCaption(e.target.value)}/></label>
    <label className="block text-xs text-slate-300">HTTPS media links (one per line, max 12)<textarea className={inputClass} rows={3} value={mediaLines} onChange={e=>setMediaLines(e.target.value)} placeholder="https://example.com/media.jpg"/></label>
    <label className="block text-xs text-slate-300">Posting notes<input className={inputClass} maxLength={200} value={note} onChange={e=>setNote(e.target.value)}/></label>
    <button type="submit" disabled={busy||!brandId} className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">Prepare manual package</button>
    <p className="text-xs leading-6 text-slate-400">This prepares text-only export metadata. It does not upload media, connect an account, queue a job or publish content.</p>
   </div>
   <div><h3 className="text-lg font-bold">Generated package</h3>
    <pre className="mt-4 min-h-48 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-[#07131b] p-5 text-xs leading-6 text-slate-300">{preview||"Complete the form to produce a manually usable draft package."}</pre>
    {preview&&<button type="button" className="mt-4 rounded-xl border border-white/20 px-5 py-3 text-sm" onClick={()=>void navigator.clipboard.writeText(preview)}>Copy JSON package</button>}
   </div>
  </form>
 </section>;
}
