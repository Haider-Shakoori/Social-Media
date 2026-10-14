"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type Account={id:string;accountKey:string;proxyKey:string|null;proxyAvailable:boolean};
type Job={id:string;state:string;driver:string;title:string|null;failureCode:string|null;createdAt:string;finishedAt:string|null;account:{accountKey:string}};
type Data={configured:boolean;online:boolean;maxSessions:number;testOrigin:string;proxyKeys:string[];
 agent:{lastSeenAt:string|null;agentVersion:string|null};accounts:Account[];jobs:Job[];notice:string};
const field="mt-2 w-full rounded-xl border border-white/20 bg-[#07131b] px-4 py-3 text-sm text-white";
const btn="rounded-xl border border-emerald-300/40 px-4 py-2.5 text-sm font-bold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40";
async function request<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const r=await fetch(API+"/platform/connector-lab"+path,{method,credentials:"include",cache:"no-store",
  headers:body===undefined?undefined:{"Content-Type":"application/json"},
  body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(typeof data.message==="string"?data.message:
  r.status===403?"Platform administrator only":r.status===401?"Sign in required":"Request failed");
 return data as T;
}
export function PlatformConnectorConsole(){
 const [data,setData]=useState<Data|null>(null),[access,setAccess]=useState<"checking"|"allowed"|"denied">("checking");
 const [accountKey,setAccountKey]=useState(""),[driver,setDriver]=useState<"playwright"|"patchright">("playwright");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 async function reload(){setData(await request<Data>("/overview"));}
 useEffect(()=>{let active=true;void request<Data>("/overview").then(x=>{if(active){setData(x);setAccess("allowed");}})
  .catch(e=>{if(active){setAccess("denied");setError(e instanceof Error?e.message:"Denied");}});
  return()=>{active=false;};},[]);
 useEffect(()=>{if(access!=="allowed")return;
  const interval=setInterval(()=>{void reload().catch(()=>{});},15000);
  return()=>clearInterval(interval);
 },[access]);
 async function action(fn:()=>Promise<void>){setBusy(true);setError("");setNotice("");
  try{await fn();await reload();}catch(e){setError(e instanceof Error?e.message:"Operation failed");}finally{setBusy(false);}
 }
 function create(e:FormEvent){e.preventDefault();void action(async()=>{
  const result=await request<{notice:string}>("/accounts","POST",{accountKey:accountKey.trim(),proxyKey:null});
  setAccountKey("");setNotice(result.notice);
 });}
 function proxy(account:Account,value:string){void action(async()=>{
  const result=await request<{notice:string}>("/accounts/"+account.id,"PATCH",{proxyKey:value||null});
  setNotice(result.notice);
 });}
 function run(account:Account){void action(async()=>{
  const result=await request<{notice:string}>("/tests","POST",{accountId:account.id,driver});
  setNotice(result.notice+" Test queued for "+account.accountKey+".");
 });}
 const date=(s:string|null)=>s?new Date(s).toLocaleString():"Never";
 if(access==="checking")return <p role="status" className="rounded-2xl border border-white/10 p-8">Checking platform admin access…</p>;
 if(access==="denied")return <section className="rounded-2xl border border-rose-300/20 p-8"><h2 className="text-xl font-bold">Platform administrator required</h2>
  <p role="alert" className="mt-3 text-rose-200">{error}</p><Link href="/login" className="mt-4 inline-block text-emerald-200 underline">Sign in</Link></section>;
 const pending=!!data?.jobs.some(x=>x.state==="QUEUED"||x.state==="RUNNING");
 return <div className="space-y-7">
  <section className="rounded-3xl border border-white/10 bg-[#102630] p-6">
   <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-emerald-300">EXPERIMENTAL · ADMIN ONLY</p>
    <h2 className="mt-3 text-2xl font-bold">Browser lab status</h2><p className="mt-2 text-sm text-slate-400">Read-only test environment. No social account login or publishing.</p></div>
    <button type="button" disabled={busy} onClick={()=>void action(async()=>{})} className={btn}>Refresh</button></div>
   {error&&<p role="alert" className="mt-4 text-rose-200">{error}</p>}
   {notice&&<p role="status" className="mt-4 text-emerald-200">{notice}</p>}
   <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {[
     ["Control bridge",data?.configured?"Configured":"Disabled"],
     ["Worker",data?.online?"Online":"Offline"],
     ["Browser session cap","1 maximum"],["Publishing","Disabled"],
    ].map(x=><div key={x[0]} className="rounded-xl border border-white/10 bg-[#07131b] p-4">
     <p className="text-xs text-slate-400">{x[0]}</p><p className="mt-2 font-bold">{x[1]}</p></div>)}
   </div>
   <p className="mt-5 text-xs text-slate-400">Agent {data?.agent.agentVersion||"not connected"} · Last heartbeat: {date(data?.agent.lastSeenAt||null)} · Fixed test target: {data?.testOrigin}</p>
   {!data?.configured&&<p className="mt-3 text-sm text-amber-200">Administrator bridge requires a shared server-side agent token and explicit operator enablement. The browser worker can continue local-only testing until configured.</p>}
  </section>
  <section className="rounded-3xl border border-white/10 bg-[#102630] p-6">
   <h2 className="text-xl font-bold">Test labels and proxy assignments</h2>
   <p className="mt-2 text-sm text-slate-400">Labels are not connected social accounts. Actual proxy addresses and credentials stay in an operator-owned VPS file; this page displays aliases only.</p>
   <form onSubmit={create} className="mt-5 flex flex-wrap items-end gap-3">
    <label className="block w-full max-w-xs text-xs text-slate-300">New test label
     <input className={field} required minLength={3} maxLength={80} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,79}"
      placeholder="pilot-003" value={accountKey} onChange={e=>setAccountKey(e.target.value)}/></label>
    <button disabled={busy} className={btn} type="submit">Add test label</button>
   </form>
   <label className="mt-5 block max-w-xs text-xs text-slate-300">Browser driver for next test
    <select value={driver} onChange={e=>setDriver(e.target.value as "playwright"|"patchright")} className={field}>
     <option value="playwright">Playwright</option><option value="patchright">Patchright</option></select></label>
   <div className="mt-6 space-y-3">
    {data?.accounts.length?data.accounts.map(a=><div key={a.id} className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-white/10 bg-[#07131b] p-4">
     <div><p className="font-bold">{a.accountKey}</p><p className="mt-1 text-xs text-slate-400">{a.proxyKey?"Proxy alias: "+a.proxyKey:"Direct / no proxy"}</p></div>
     <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-slate-300">Proxy
       <select className={field} value={a.proxyKey||""} disabled={busy||!data.online} onChange={e=>proxy(a,e.target.value)}>
        <option value="">Direct</option>
        {a.proxyKey&&!data.proxyKeys.includes(a.proxyKey)&&<option value={a.proxyKey}>Unavailable: {a.proxyKey}</option>}
        {data.proxyKeys.map(k=><option key={k} value={k}>{k}</option>)}
       </select></label>
      <button className={btn} type="button" disabled={busy||!data.online||pending||!a.proxyAvailable} onClick={()=>run(a)}>Run read-only test</button>
     </div>
    </div>):<p className="text-sm text-slate-400">No test labels yet.</p>}
   </div>
  </section>
  <section className="rounded-3xl border border-white/10 bg-[#102630] p-6">
   <h2 className="text-xl font-bold">Recent test activity</h2><p className="mt-2 text-sm text-slate-400">Results are reported by the isolated worker; a failed test is never silently retried.</p>
   <div className="mt-5 space-y-3">{data?.jobs.length?data.jobs.map(j=><div key={j.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-white/10 p-4">
    <div><p className="text-sm font-bold">{j.account.accountKey} · {j.driver}</p>
     <p className="mt-2 text-xs text-slate-400">Queued {date(j.createdAt)}{j.finishedAt?" · Finished "+date(j.finishedAt):""}</p>
     {j.title&&<p className="mt-2 text-sm text-emerald-200">Page title: {j.title}</p>}
     {j.failureCode&&<p className="mt-2 text-sm text-amber-200">Reason: {j.failureCode.replaceAll("_"," ")}</p>}</div>
    <span className="h-fit rounded-full border border-white/20 px-3 py-1 text-xs">{j.state}</span>
   </div>):<p className="text-sm text-slate-400">No dashboard tests yet.</p>}</div>
  </section>
  <p className="text-sm text-amber-200">This Temporal setup is experimental, not production-ready. Social-media login, CAPTCHAs and publishing are unavailable here; use the official Meta connection flow for real account authorization.</p>
 </div>;
}
