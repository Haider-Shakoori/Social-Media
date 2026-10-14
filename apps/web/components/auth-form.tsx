"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";

type AuthMode="login"|"register"|"forgot"|"reset";
const api=process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";
const paths:Record<AuthMode,string>={login:"login",register:"register",forgot:"forgot-password",reset:"reset-password"};

export function AuthForm({mode,token}:{mode:AuthMode;token?:string}) {
  const [fullName,setFullName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [pending,setPending]=useState(false);
  const [success,setSuccess]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(pending)return;
    setPending(true);setMessage("");setSuccess(false);
    try {
      const body=mode==="register"?{fullName,email,password}:
        mode==="login"?{email,password}:
        mode==="forgot"?{email}:{token,password};
      const response=await fetch(api+"/auth/"+paths[mode],{
        method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body),cache:"no-store",
      });
      const result=await response.json().catch(()=>({message:"Request failed"}));
      if(!response.ok)throw new Error(typeof result.message==="string"?result.message:"Request failed");
      setSuccess(true);
      if(mode==="login"){
        const next=new URLSearchParams(window.location.search).get("next")||"";
        // Only a same-origin relative review link is allowed; do not create
        // an open redirect from the query string.
        window.location.assign(next.startsWith("/review?")&&!next.startsWith("//")?next:"/dashboard");
        return;
      }
      if(mode==="register"){
        if(result.user?.id){window.location.assign("/dashboard");return;}
        setMessage(typeof result.message==="string"?result.message:"Follow the account setup instructions.");
      }
      else if(mode==="forgot"){setMessage("If the address is registered, a password-reset link will be sent.");}
      else setMessage("Password updated. You can now sign in.");
    } catch(err){setMessage(err instanceof Error?err.message:"Could not complete request");}
    finally{setPending(false);}
  }
  return <form onSubmit={submit} className="mx-auto max-w-lg space-y-5 rounded-3xl border border-white/10 bg-[#102630] p-7 sm:p-9">
    {mode==="register"&&<label className="block text-sm font-semibold text-slate-200">Full name
      <input autoComplete="name" required minLength={1} maxLength={150} value={fullName} onChange={e=>setFullName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 p-3 text-base text-white outline-none focus:border-emerald-300"/>
    </label>}
    {mode!=="reset"&&<label className="block text-sm font-semibold text-slate-200">Email address
      <input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 p-3 text-base text-white outline-none focus:border-emerald-300"/>
    </label>}
    {(mode==="register"||mode==="login"||mode==="reset")&&<label className="block text-sm font-semibold text-slate-200">{mode==="reset"?"New password":"Password"}
      <input type="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={mode==="login"?1:12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 p-3 text-base text-white outline-none focus:border-emerald-300"/>
      {mode!=="login"&&<span className="mt-2 block text-xs text-slate-400">At least 12 characters.</span>}
    </label>}
    <button disabled={pending} type="submit" className="w-full rounded-xl bg-emerald-300 px-6 py-3.5 font-bold text-slate-950 disabled:opacity-60">{pending?"Submitting...":mode==="register"?"Create account":mode==="login"?"Sign in":mode==="forgot"?"Request reset":"Update password"}</button>
    {message&&<p role={success?"status":"alert"} className={"rounded-xl border p-4 text-sm leading-6 "+(success?"border-emerald-300/25 bg-emerald-300/10 text-emerald-200":"border-rose-300/25 bg-rose-300/10 text-rose-200")}>{message}</p>}
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      {mode!=="login"&&<Link className="font-semibold text-emerald-300 hover:underline" href="/login">Back to login</Link>}
      {mode==="login"&&<><Link href="/register" className="font-semibold text-emerald-300 hover:underline">Create account</Link><Link href="/forgot-password" className="text-slate-300 hover:underline">Forgot password?</Link></>}
    </div>
  </form>;
}
