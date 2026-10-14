"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type Review={id:string;state:string;expiresAt:string;requestedById:string;postVersion:{id:string;number:number;caption:string;postId:string}};
type Choice="APPROVED"|"REJECTED";
type Detail={root:string;requestId:string;decision:Choice};
function parseInvitation():Detail|null{
 const params=new URLSearchParams(window.location.search);
 const keys=["tenant","workspace","brand","request"];
 const ids=keys.map(k=>params.get(k)||"");
 if(ids.some(x=>!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(x)))return null;
 const decision=params.get("decision");
 if(decision!=="APPROVED"&&decision!=="REJECTED")return null;
 return {root:"/tenants/"+ids[0]+"/workspaces/"+ids[1]+"/brands/"+ids[2],
  requestId:ids[3],decision};
}
export function EmailApprovalReview(){
 const [detail,setDetail]=useState<Detail|null>(null);
 const [request,setRequest]=useState<Review|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [loginRequired,setLoginRequired]=useState(false),[result,setResult]=useState("");
 const [note,setNote]=useState("");
 useEffect(()=>{
  const d=parseInvitation();setDetail(d);
  if(!d){setError("This review link is invalid.");setLoading(false);return;}
  let active=true;
  void fetch(API+d.root+"/approvals",{credentials:"include",cache:"no-store"}).then(async res=>{
   if(res.status===401){if(active)setLoginRequired(true);return null;}
   if(!res.ok)throw Error("You cannot review this post. Check your workspace permissions.");
   const data=await res.json() as {approvals:Review[]};
   const found=data.approvals.find(x=>x.id===d.requestId);
   if(!found)throw Error("Approval request is unavailable to this account.");
   if(active)setRequest(found);
   return null;
  }).catch(e=>{if(active)setError(e instanceof Error?e.message:"Review unavailable");})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 async function confirm(){
  if(!detail||!request||busy)return;
  if(request.state!=="PENDING"||new Date(request.expiresAt)<=new Date()){
   setError("The review request has expired or was already decided.");return;
  }
  setBusy(true);setError("");
  try{
   const response=await fetch(API+detail.root+"/approvals/"+detail.requestId+"/decision",{
    method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({decision:detail.decision,note:note.slice(0,500)}),
   });
   if(!response.ok){
    const data=await response.json().catch(()=>({})) as {message?:string};
    throw Error(data.message||"Unable to submit this review.");
   }
   setResult(detail.decision==="APPROVED"?"Post approved for scheduling. No content has been published.":"Post rejected; the author must revise it.");
  }catch(e){setError(e instanceof Error?e.message:"Decision failed");}
  finally{setBusy(false);}
 }
 return <section className="rounded-3xl border border-white/10 bg-[#102630] p-7">
  <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Independent content review</p>
  <h1 className="mt-3 text-2xl font-bold">Confirm your decision</h1>
  <p className="mt-3 text-sm text-slate-300">Email links never approve or publish automatically. Only a signed-in authorized reviewer can submit a decision.</p>
  {loading&&<p className="mt-6 text-slate-300">Loading the approval request…</p>}
  {loginRequired&&<p className="mt-6">Please <Link className="underline text-emerald-200" href={"/login?next="+encodeURIComponent("/review"+window.location.search)}>sign in</Link> with an authorized reviewer account to continue.</p>}
  {error&&<p role="alert" className="mt-6 text-rose-200">{error}</p>}
  {result?<p role="status" className="mt-6 text-emerald-200">{result}</p>:null}
  {request&&!result&&<div className="mt-6 space-y-4">
   <p className="text-sm text-slate-300">Version {request.postVersion.number} · Status: {request.state} · Expires {new Date(request.expiresAt).toLocaleString()}</p>
   <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm">{request.postVersion.caption}</div>
   <label className="block text-sm">Reviewer note (optional)
    <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500} rows={3}
      className="mt-2 block w-full rounded-lg border border-white/20 bg-slate-950 p-3"/>
   </label>
   <button type="button" disabled={busy||request.state!=="PENDING"||new Date(request.expiresAt)<=new Date()}
    onClick={()=>void confirm()} className="rounded-xl bg-emerald-300 px-5 py-3 font-bold text-slate-950 disabled:opacity-40">
    {busy?"Saving…":detail?.decision==="APPROVED"?"Confirm approval":"Confirm rejection"}
   </button>
  </div>}
 </section>;
}
