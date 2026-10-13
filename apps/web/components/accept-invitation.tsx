"use client";
import {useState} from "react";
import Link from "next/link";
const api=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
export function AcceptInvitation({token}:{token:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[accepted,setAccepted]=useState(false);
 async function accept(){
   setBusy(true);setMessage("");
   try{
     const result=await fetch(api+"/invitations/accept",{
       method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({token}),cache:"no-store",
     });
     const body=await result.json().catch(()=>({}));
     if(!result.ok)throw new Error(typeof body.message==="string"?body.message:"Invitation cannot be accepted");
     setAccepted(true);setMessage("Invitation accepted. You can now open your workspace dashboard.");
   }catch(e){setMessage(e instanceof Error?e.message:"Unable to accept invitation");}finally{setBusy(false);}
 }
 return <div className="max-w-2xl rounded-3xl border border-white/10 bg-[#102630] p-8"><h2 className="text-2xl font-bold">Confirm invitation</h2>
 <p className="mt-4 text-sm leading-7 text-slate-300">Sign in and verify the exact invited email before clicking accept. Invitation links are single-use and expire after 72 hours.</p>
 <div className="mt-6 flex flex-wrap gap-3"><button disabled={busy||accepted} type="button" className="rounded-xl bg-emerald-300 px-6 py-3 font-bold text-slate-950 disabled:opacity-50" onClick={()=>void accept()}>{busy?"Checking...":"Accept invitation"}</button><Link href="/login" className="rounded-xl border border-white/20 px-6 py-3 font-semibold">Sign in first</Link></div>
 {message&&<p role="status" className="mt-5 rounded-xl border border-white/10 p-4 text-sm leading-7">{message}</p>}
 {accepted&&<Link href="/dashboard" className="mt-5 inline-block text-sm font-bold text-emerald-300 underline">Open dashboard ↗</Link>}
 </div>;
}
