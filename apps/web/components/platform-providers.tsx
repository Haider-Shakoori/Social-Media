"use client";
import {useEffect,useState} from "react";
const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type Provider={id:string;name:string;rollout:string;rolloutBatch:number;accessRequirement:string;
 canPublish:boolean;canConnect:boolean;operatorEnabled:boolean;apiApproved:boolean;costApproved:boolean;
 productionVerified:boolean;notes:string;costGate:string};
const states=["planned","manual_only","awaiting_approval","testing","restricted","disabled"] as const;
export function PlatformProviders(){
 const [providers,setProviders]=useState<Provider[]>([]);
 const [state,setState]=useState<Record<string,string>>({}),[notes,setNotes]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function reload(){
  const res=await fetch(API+"/platform/providers",{credentials:"include",cache:"no-store"});
  const json=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(typeof json.message==="string"?json.message:"Provider registry unavailable");
  const list=(json.providers as Provider[]).filter(p=>["facebook","instagram","x"].includes(p.id));
  setProviders(list);
  setState(Object.fromEntries(list.map(p=>[p.id,p.rollout])));
  setNotes(Object.fromEntries(list.map(p=>[p.id,p.notes])));
 }
 useEffect(()=>{void reload().catch(e=>setError(e instanceof Error?e.message:"Registry unavailable"));},[]);
 async function save(id:string){
  setBusy(id);setError("");setMessage("");
  try{
   const rolloutState=state[id].toUpperCase();
   const res=await fetch(API+"/platform/providers/"+id,{
    method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({rolloutState,operatorEnabled:false,notes:notes[id]||""}),
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(typeof data.message==="string"?data.message:"Update failed");
   await reload();setMessage("Provider status saved. No OAuth or live publishing was activated.");
  }catch(e){setError(e instanceof Error?e.message:"Update failed");}
  finally{setBusy("");}
 }
 return <section className="mt-8 rounded-3xl border border-white/10 bg-[#102630] p-7">
  <div><p className="text-xs font-bold tracking-widest text-emerald-300">PROVIDER RELEASE CONTROLS</p>
   <h2 className="mt-3 text-2xl font-bold">Official provider policy registry</h2>
   <p className="mt-3 text-sm leading-7 text-slate-400">Only Facebook Pages, Instagram professional accounts and X are shown during the pilot. Status editing cannot grant API scopes, bypass provider review, or activate automatic publishing.</p>
  </div>
  {error&&<p role="alert" className="mt-5 text-sm text-rose-200">{error}</p>}
  {message&&<p role="status" className="mt-5 text-sm text-emerald-200">{message}</p>}
  <div className="mt-6 grid gap-4 md:grid-cols-2">
   {providers.map(p=><article key={p.id} className="rounded-2xl border border-white/10 bg-[#07131b] p-5">
    <div className="flex justify-between gap-3"><h3 className="font-bold">{p.name}</h3><span className="text-xs text-slate-400">Batch {p.rolloutBatch}</span></div>
    <p className="mt-3 text-xs leading-6 text-slate-400">{p.accessRequirement}</p>
    <p className="mt-3 text-xs text-amber-200">Publishing OFF · API verified: {p.apiApproved?"Yes":"No"} · Budget approved: {p.costApproved?"Yes":"No"}</p>
    <label className="mt-4 block text-xs text-slate-300">Rollout state<select value={state[p.id]??"planned"} className="mt-2 w-full rounded-xl border border-white/15 bg-[#102630] p-3 text-sm" onChange={e=>setState(s=>({...s,[p.id]:e.target.value}))}>
     {states.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
    </select></label>
    <label className="mt-4 block text-xs text-slate-300">Operator notes<textarea rows={2} maxLength={500} className="mt-2 w-full rounded-xl border border-white/15 bg-[#102630] p-3 text-sm" value={notes[p.id]??""} onChange={e=>setNotes(s=>({...s,[p.id]:e.target.value}))}/></label>
    <button disabled={Boolean(busy)} type="button" onClick={()=>void save(p.id)} className="mt-4 rounded-xl bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">Save status</button>
   </article>)}
  </div>
 </section>;
}
