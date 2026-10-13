"use client";
import {useEffect,useState,type FormEvent} from "react";
const api=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type Plan={
 code:string;name:string;description:string;currency:string;
 monthlyPriceMinor:number|null;yearlyPriceMinor:number|null;trialDays:number;
 maxBrands:number;maxSeats:number;maxConnections:number;
 monthlyAiText:number;monthlyAiImage:number;monthlyScheduledPosts:number;
 enabled:boolean;published:boolean;
};
const initial:Plan={
 code:"",name:"",description:"",currency:"USD",monthlyPriceMinor:null,yearlyPriceMinor:null,
 trialDays:0,maxBrands:1,maxSeats:2,maxConnections:1,
 monthlyAiText:25,monthlyAiImage:5,monthlyScheduledPosts:20,enabled:false,published:false,
};
const fields=[
 {key:"maxBrands",label:"Brands"},
 {key:"maxSeats",label:"Team seats"},
 {key:"maxConnections",label:"Connected accounts"},
 {key:"monthlyAiText",label:"AI text / month"},
 {key:"monthlyAiImage",label:"AI images / month"},
 {key:"monthlyScheduledPosts",label:"Scheduled posts / month"},
] as const;
const input="mt-2 w-full rounded-xl border border-white/20 bg-[#07131b] px-4 py-3 text-sm text-white";
export function PlatformPlanEditor({onSaved}:{onSaved:()=>void}){
 const [plans,setPlans]=useState<Plan[]>([]);
 const [selected,setSelected]=useState("new");
 const [draft,setDraft]=useState<Plan>(initial);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 async function refresh(){
  const res=await fetch(api+"/platform/billing/plans",{credentials:"include",cache:"no-store"});
  if(!res.ok)throw new Error("Could not load plan definitions");
  const data=await res.json() as {plans:Plan[]};
  setPlans(data.plans);
 }
 useEffect(()=>{void refresh().catch(()=>setError("Plan registry unavailable"));},[]);
 function choose(code:string){
  setSelected(code);
  const found=plans.find(p=>p.code===code);
  setDraft(found?{...found}:initial);
  setError("");setMessage("");
 }
 function numeric(key:keyof Plan,value:string){
  setDraft(prev=>({...prev,[key]:Math.max(0,Math.trunc(Number(value)||0))}));
 }
 function price(key:"monthlyPriceMinor"|"yearlyPriceMinor",value:string){
  setDraft(prev=>({...prev,[key]:value.trim()===""?null:Math.max(0,Math.trunc(Number(value)||0))}));
 }
 async function save(e:FormEvent){
  e.preventDefault();setError("");setMessage("");setBusy(true);
  try{
   const isNew=selected==="new";
   const {code,...changes}=draft;
   const url=api+"/platform/billing/plans"+(isNew?"":"/"+encodeURIComponent(selected));
   const res=await fetch(url,{
    method:isNew?"POST":"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(isNew?draft:changes),
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(typeof data.message==="string"?data.message:"Plan save failed");
   await refresh();onSaved();setSelected(draft.code);setMessage("Plan saved. Existing subscriptions keep their original entitlement snapshot.");
  }catch(e){setError(e instanceof Error?e.message:"Plan save failed");}
  finally{setBusy(false);}
 }
 return <section className="mt-8 rounded-3xl border border-white/10 bg-[#102630] p-7">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-emerald-300">PLAN CONFIGURATION</p><h2 className="mt-3 text-2xl font-bold">Edit or create subscription plans</h2>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">Changes affect new activations only. Enabling a plan does not charge customers, and publishing a price does not make online checkout available.</p></div></div>
  <form onSubmit={e=>void save(e)} className="mt-7 space-y-5">
   <label className="block text-xs font-semibold text-slate-300">Select a plan<select value={selected} onChange={e=>choose(e.target.value)} className={input}>
    <option value="new">Create new plan</option>{plans.map(p=><option value={p.code} key={p.code}>{p.name} ({p.code})</option>)}
   </select></label>
   <div className="grid gap-4 md:grid-cols-3">
    <label className="text-xs text-slate-300">Plan code<input required minLength={2} maxLength={60} pattern="[a-z][a-z0-9-]+" readOnly={selected!=="new"} value={draft.code} onChange={e=>setDraft(prev=>({...prev,code:e.target.value.toLowerCase()}))} className={input}/></label>
    <label className="text-xs text-slate-300">Display name<input required minLength={2} maxLength={100} value={draft.name} onChange={e=>setDraft(prev=>({...prev,name:e.target.value}))} className={input}/></label>
    <label className="text-xs text-slate-300">Currency<input required pattern="[A-Z]{3}" maxLength={3} value={draft.currency} onChange={e=>setDraft(prev=>({...prev,currency:e.target.value.toUpperCase()}))} className={input}/></label>
   </div>
   <label className="block text-xs text-slate-300">Description<input maxLength={500} value={draft.description} onChange={e=>setDraft(prev=>({...prev,description:e.target.value}))} className={input}/></label>
   <div className="grid gap-4 md:grid-cols-3">
    <label className="text-xs text-slate-300">Monthly price in minor units<input type="number" min={0} max={2000000000} placeholder="Unpriced" value={draft.monthlyPriceMinor??""} onChange={e=>price("monthlyPriceMinor",e.target.value)} className={input}/></label>
    <label className="text-xs text-slate-300">Yearly price in minor units<input type="number" min={0} max={2000000000} placeholder="Unpriced" value={draft.yearlyPriceMinor??""} onChange={e=>price("yearlyPriceMinor",e.target.value)} className={input}/></label>
    <label className="text-xs text-slate-300">Trial days<input type="number" min={0} max={90} value={draft.trialDays} readOnly={selected==="trial"} onChange={e=>numeric("trialDays",e.target.value)} className={input}/></label>
   </div>
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {fields.map(field=><label className="text-xs text-slate-300" key={field.key}>{field.label}<input type="number" min={0} max={10000000} value={draft[field.key]} onChange={e=>numeric(field.key,e.target.value)} className={input}/></label>)}
   </div>
   <div className="flex flex-wrap gap-6">
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.enabled} disabled={selected==="trial"} onChange={e=>setDraft(prev=>({...prev,enabled:e.target.checked}))}/> Enabled for operator activation</label>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.published} onChange={e=>setDraft(prev=>({...prev,published:e.target.checked}))}/> Public plan listing</label>
   </div>
   {error&&<p role="alert" className="rounded-xl border border-rose-300/30 p-4 text-sm text-rose-200">{error}</p>}
   {message&&<p role="status" className="rounded-xl border border-emerald-300/30 p-4 text-sm text-emerald-200">{message}</p>}
   <button type="submit" disabled={busy} className="rounded-xl bg-emerald-300 px-6 py-3 font-bold text-slate-950 disabled:opacity-50">{busy?"Saving...":selected==="new"?"Create plan":"Save plan changes"}</button>
  </form>
 </section>;
}
