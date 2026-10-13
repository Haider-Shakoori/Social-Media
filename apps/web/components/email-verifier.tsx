"use client";
import {useEffect,useRef,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
const api=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
export function EmailVerifier(){
 const token=useSearchParams().get("token");
 const [status,setStatus]=useState("Validating your verification link...");
 const [finished,setFinished]=useState(false);
 const inFlight=useRef<Promise<void>|null>(null);
 useEffect(()=>{
   if(!token){setStatus("Verification link is incomplete.");setFinished(true);return;}
   // The same one-time verification request must not run twice in React Strict Mode.
   if(!inFlight.current){
     inFlight.current=fetch(api+"/auth/verify-email",{
       method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
       body:JSON.stringify({token}),cache:"no-store",
     }).then(async response=>{
       const data=await response.json().catch(()=>({}));
       if(!response.ok)throw new Error(data.message||"Verification failed");
     });
   }
   let active=true;
   void inFlight.current.then(()=>{
     if(active){setStatus("Your email is verified. You can sign in.");setFinished(true);}
   }).catch(e=>{
     if(active){setStatus(e instanceof Error?e.message:"Verification failed");setFinished(true);}
   });
   return()=>{active=false;};
 },[token]);
 return <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#102630] p-8 text-center"><p role="status" className="leading-7 text-slate-200">{status}</p>{finished&&<Link className="mt-6 inline-block rounded-xl bg-emerald-300 px-5 py-3 font-bold text-slate-950" href="/login">Go to login ↗</Link>}</div>;
}
