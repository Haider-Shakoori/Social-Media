"use client";
import {useEffect,useState} from "react";
const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type Notice={id:string;subject:string;message:string;createdAt:string;readAt:string|null;emailedAt:string|null};
async function req<T>(url:string,method="GET",payload?:unknown):Promise<T>{
 const r=await fetch(API+url,{method,credentials:"include",cache:"no-store",
 headers:payload===undefined?undefined:{"Content-Type":"application/json"},
 body:payload===undefined?undefined:JSON.stringify(payload)});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(typeof data.message==="string"?data.message:"Notification request failed");
 return data as T;
}
export function NotificationInbox(){
 const [items,setItems]=useState<Notice[]>([]),[opt,setOpt]=useState(false),[unread,setUnread]=useState(0);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function reload(){
  const data=await req<{notifications:Notice[];emailOptIn:boolean;unread:number}>("/notifications");
  setItems(data.notifications);setOpt(data.emailOptIn);setUnread(data.unread);
 }
 useEffect(()=>{void reload().catch(e=>setError(e instanceof Error?e.message:"Notifications unavailable"));},[]);
 async function action(task:()=>Promise<void>){setBusy(true);setError("");setNotice("");
  try{await task();await reload();}catch(e){setError(e instanceof Error?e.message:"Request failed");}
  finally{setBusy(false);}
 }
 return <section className="mt-8 rounded-3xl border border-white/10 bg-[#102630] p-6">
  <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-emerald-300">INDEPENDENT NOTIFICATION CENTER</p>
   <h2 className="mt-2 text-xl font-bold">In-app inbox <span className="text-emerald-300">({unread} unread)</span></h2>
   <p className="mt-2 text-xs text-slate-400">Messages are private to your user account. Email is opt-in and user-triggered.</p></div>
   <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={opt} onChange={e=>void action(async()=>{await req("/notifications/preferences","PATCH",{emailOptIn:e.target.checked});setNotice("Preference saved.");})}/>Allow optional email copy</label>
  </div>
  {error&&<p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}
  {notice&&<p role="status" className="mt-4 text-sm text-emerald-200">{notice}</p>}
  <div className="mt-5 space-y-3">{items.length===0?<p className="text-sm text-slate-400">No notifications yet.</p>:items.slice(0,20).map(item=>
   <div key={item.id} className={"rounded-xl border p-4 "+(item.readAt?"border-white/10":"border-emerald-300/25")}>
    <div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm font-bold">{item.subject}</p><p className="mt-2 text-sm text-slate-300">{item.message}</p></div>
     <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span></div>
    <div className="mt-3 flex gap-4">
     {!item.readAt&&<button type="button" disabled={busy} onClick={()=>void action(async()=>{await req("/notifications/"+item.id+"/read","POST",{});})} className="text-xs text-emerald-200">Mark read</button>}
     {opt&&!item.emailedAt&&<button type="button" disabled={busy} onClick={()=>void action(async()=>{await req("/notifications/"+item.id+"/email","POST",{});setNotice("Email sent using configured SMTP.");})} className="text-xs text-emerald-200">Send email to myself</button>}
    </div>
   </div>)}</div>
 </section>;
}
