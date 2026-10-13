"use client";
import {useEffect,useRef,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
const api=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
export function EmailVerifier(){
 const token=useSearchParams().get("token");
 const [status,setStatus]=useState("Validating your verification link...");
 const [finished,setFinished]=useState(false);
 const seen=useRef(false);
 useEffect(()=>{
   if(seen.current)return;
   seen.current=true;
   if(!token){setStatus("Verification link is incomplete.");setFinished(true);return;}
   let cancelled=false;
   void fetch(api+"/auth/verify-email",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({token}),cache:"no-store"})
   .then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||"Verification failed");return data;})
   .then(()=>{if(!cancelled)setStatus("Your email is verified. You can sign in.");})
   .catch(e=>{if(!cancelled)setStatus(e instanceof Error?e.message:"Verification failed");})
   .finally(()=>{if(!cancelled)setFinished(true);});
   return()=>{cancelled=true;};
 },[token]);
 return <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#102630] p-8 text-center"><p role="status" className="leading-7 text-slate-200">{status}</p>{finished&&<Link className="mt-6 inline-block rounded-xl bg-emerald-300 px-5 py-3 font-bold text-slate-950" href="/login">Go to login ↗</Link>}</div>;
}
