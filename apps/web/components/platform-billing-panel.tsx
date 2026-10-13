"use client";
import {FormEvent,useEffect,useState} from "react";
import {PlatformPlanEditor} from "./platform-plan-editor";
const api=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type Tenant={id:string;name:string;slug:string;subscription:{state:string;periodEnd:string;plan:{code:string;name:string}}|null};
type Plan={id:string;code:string;name:string;enabled:boolean;published:boolean;currency:string;monthlyPriceMinor:number|null;yearlyPriceMinor:number|null;maxBrands:number;maxSeats:number};
type Invoice={id:string;number:string;amountMinor:number;currency:string};
type Payment={id:string;reference:string;state:string;invoiceId:string|null;amountMinor:number;currency:string};
type TenantDetail={invoices:Invoice[];payments:Payment[]};
const classes="w-full rounded-xl border border-white/20 bg-[#07131b] px-4 py-3 text-sm text-white";
async function req<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const r=await fetch(api+"/platform/billing"+path,{method,credentials:"include",headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),cache:"no-store"});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(typeof d.message==="string"?d.message:"Operation failed");
 return d as T;
}
export function PlatformBillingPanel(){
 const [access,setAccess]=useState<"loading"|"granted"|"denied">("loading");
 const [tenants,setTenants]=useState<Tenant[]>([]),[plans,setPlans]=useState<Plan[]>([]);
 const [tenantId,setTenantId]=useState(""),[planCode,setPlanCode]=useState("growth"),[cycle,setCycle]=useState<"MONTHLY"|"YEARLY">("MONTHLY");
 const [days,setDays]=useState(7),[invoicePlan,setInvoicePlan]=useState("growth"),[amount,setAmount]=useState("2500"),[currency,setCurrency]=useState("USD");
 const [invoice,setInvoice]=useState<Invoice|null>(null),[reference,setReference]=useState(""),[payment,setPayment]=useState<Payment|null>(null);
 const [details,setDetails]=useState<TenantDetail|null>(null);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 async function getDetails(id:string){
  const d=await req<TenantDetail>("/tenants/"+id);
  setDetails(d);
 }
 async function refresh(){
  const [t,p]=await Promise.all([req<{tenants:Tenant[]}>("/tenants"),req<{plans:Plan[]}>("/plans")]);
  setTenants(t.tenants);setPlans(p.plans);setTenantId(old=>old||t.tenants[0]?.id||"");
  if(tenantId)await getDetails(tenantId);
 }
 useEffect(()=>{let active=true;
  void Promise.all([req<{tenants:Tenant[]}>("/tenants"),req<{plans:Plan[]}>("/plans")])
   .then(([t,p])=>{if(active){setTenants(t.tenants);setPlans(p.plans);setTenantId(t.tenants[0]?.id||"");setAccess("granted");}})
   .catch(e=>{if(active){setError(e instanceof Error?e.message:"Not authorized");setAccess("denied");}});
  return()=>{active=false;};
 },[]);
 useEffect(()=>{if(access!=="granted"||!tenantId)return;let alive=true;
  void req<TenantDetail>("/tenants/"+tenantId).then(d=>{if(alive)setDetails(d);}).catch(()=>{if(alive)setDetails(null);});
  return()=>{alive=false;};
 },[access,tenantId]);
 async function change(path:string,body?:unknown){setBusy(true);setError("");setNotice("");
  try{await req(path,"POST",body);await refresh();setNotice("Operation completed and audited.");}
  catch(e){setError(e instanceof Error?e.message:"Operation failed");}
  finally{setBusy(false);}
 }
 async function issue(e:FormEvent){e.preventDefault();setBusy(true);setError("");
  try{const d=await req<{invoice:Invoice}>("/invoices","POST",{tenantId,planCode:invoicePlan,amountMinor:Number(amount),currency});setInvoice(d.invoice);setPayment(null);setNotice("Invoice issued; no payment has been collected.");}
  catch(e){setError(e instanceof Error?e.message:"Could not issue invoice");}finally{setBusy(false);}
 }
 async function record(e:FormEvent){e.preventDefault();if(!invoice)return;setBusy(true);setError("");
  try{const d=await req<{payment:Payment}>("/payments","POST",{invoiceId:invoice.id,reference});setPayment(d.payment);setNotice("Payment reference recorded as pending; not verified.");}
  catch(e){setError(e instanceof Error?e.message:"Could not record payment");}finally{setBusy(false);}
 }
 async function reviewExisting(id:string,decision:"VERIFY"|"REJECT"){
  setBusy(true);setError("");
  try{await req("/payments/"+id+"/decision","POST",{decision});setNotice("Payment decision recorded; subscription activation is separate.");await refresh();}
  catch(e){setError(e instanceof Error?e.message:"Review failed");}
  finally{setBusy(false);}
 }
 async function decide(decision:"VERIFY"|"REJECT"){if(!payment)return;setBusy(true);setError("");
  try{await req("/payments/"+payment.id+"/decision","POST",{decision});setNotice("Payment "+decision.toLowerCase()+" decision recorded. Subscription activation is a separate audited action.");setPayment(null);await refresh();}
  catch(e){setError(e instanceof Error?e.message:"Payment review failed");}finally{setBusy(false);}
 }
 if(access==="loading")return <p role="status">Checking platform administrator permissions...</p>;
 if(access==="denied")return <div className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-8"><h1 className="text-2xl font-bold">Platform access restricted</h1><p className="mt-4 text-sm">{error}</p></div>;
 return <div><p className="text-xs font-bold tracking-widest text-emerald-300">PLATFORM ADMINISTRATION · BATCH 5</p><h1 className="mt-3 text-4xl font-bold">Subscriptions and manual billing</h1>
 <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-300">These controls change subscription entitlements and accounting records only. They cannot charge a bank card or collect real payments. Every action is audited. No social publishing is enabled.</p>
 {error&&<p role="alert" className="mt-6 rounded-xl border border-rose-300/30 p-4 text-rose-200">{error}</p>}
 {notice&&<p role="status" className="mt-6 rounded-xl border border-emerald-300/30 p-4 text-emerald-200">{notice}</p>}
 <div className="mt-10 grid gap-6 lg:grid-cols-2">
  <section className="rounded-3xl border border-white/10 bg-[#102630] p-7"><h2 className="text-2xl font-bold">Tenant entitlement</h2>
   <label className="mt-5 block text-sm text-slate-300">Organization<select className={"mt-2 "+classes} value={tenantId} onChange={e=>setTenantId(e.target.value)}>{tenants.map(t=><option key={t.id} value={t.id}>{t.name} · {t.slug}</option>)}</select></label>
   <div className="mt-5 space-y-2">{tenants.filter(t=>t.id===tenantId).map(t=><div key={t.id} className="rounded-xl border border-white/10 p-4 text-sm"><strong>{t.subscription?.plan.name||"No subscription"}</strong><p className="mt-2 text-slate-400">{t.subscription?.state||"Unassigned"} · Expires {t.subscription?.periodEnd?new Date(t.subscription.periodEnd).toLocaleDateString():"N/A"}</p></div>)}</div>
   <div className="mt-5 grid grid-cols-2 gap-3">
    <label className="text-xs text-slate-300">Plan<select className={"mt-2 "+classes} value={planCode} onChange={e=>setPlanCode(e.target.value)}>{plans.filter(p=>p.code!=="trial").map(p=><option key={p.code} value={p.code}>{p.name}{!p.enabled?" (disabled)":""}</option>)}</select></label>
    <label className="text-xs text-slate-300">Billing interval<select className={"mt-2 "+classes} value={cycle} onChange={e=>setCycle(e.target.value as "MONTHLY"|"YEARLY")}><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></label>
   </div>
   <button disabled={busy||!tenantId} onClick={()=>void change("/tenants/"+tenantId+"/activate",{planCode,cycle})} className="mt-4 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">Activate / renew (manual override)</button>
   <div className="mt-8 flex flex-wrap items-center gap-3"><label className="text-xs text-slate-300">Days<input type="number" min={1} max={90} className={"mt-2 w-24 "+classes} value={days} onChange={e=>setDays(Number(e.target.value))}/></label>
    <button disabled={busy||!tenantId} onClick={()=>void change("/tenants/"+tenantId+"/trial/extend",{days})} className="rounded-xl border border-white/20 px-4 py-3 text-sm">Extend trial</button>
    <button disabled={busy||!tenantId} onClick={()=>void change("/tenants/"+tenantId+"/grace",{days})} className="rounded-xl border border-white/20 px-4 py-3 text-sm">Grant grace</button>
    <button disabled={busy||!tenantId} onClick={()=>void change("/tenants/"+tenantId+"/suspend")} className="rounded-xl border border-rose-300/40 px-4 py-3 text-sm text-rose-200">Suspend</button>
    <button disabled={busy||!tenantId} onClick={()=>void change("/tenants/"+tenantId+"/resume")} className="rounded-xl border border-white/20 px-4 py-3 text-sm">Resume</button>
   </div>
  </section>
  <section className="rounded-3xl border border-white/10 bg-[#102630] p-7"><h2 className="text-2xl font-bold">Invoice and offline payment</h2>
   <p className="mt-3 text-sm leading-7 text-slate-400">An issued invoice is not paid. A recorded payment remains pending until a platform administrator verifies it.</p>
   <form onSubmit={e=>void issue(e)} className="mt-5 space-y-4">
    <label className="block text-xs text-slate-300">Plan reference<select className={"mt-2 "+classes} value={invoicePlan} onChange={e=>setInvoicePlan(e.target.value)}>{plans.filter(p=>p.code!=="trial").map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-300">Amount (minor units)<input required type="number" min={1} className={"mt-2 "+classes} value={amount} onChange={e=>setAmount(e.target.value)}/></label><label className="text-xs text-slate-300">Currency<input required pattern="[A-Z]{3}" maxLength={3} className={"mt-2 "+classes} value={currency} onChange={e=>setCurrency(e.target.value.toUpperCase())}/></label></div>
    <button type="submit" disabled={busy||!tenantId} className="rounded-xl border border-emerald-300/30 px-5 py-3 text-sm font-bold text-emerald-200">Issue invoice</button>
   </form>
   {details&&<div className="mt-6 space-y-3 border-t border-white/10 pt-6"><h3 className="font-semibold">Recorded payments</h3>
    {details.payments.length===0?<p className="text-sm text-slate-400">No payment records for this organization.</p>:details.payments.map(p=><div key={p.id} className="rounded-xl border border-white/10 p-4 text-sm"><div className="flex flex-wrap justify-between gap-3"><span>{p.reference}</span><span>{p.state}</span></div>
    {p.state==="PENDING"&&<div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>void reviewExisting(p.id,"VERIFY")} className="rounded-xl bg-emerald-300 px-4 py-2 text-xs font-semibold text-slate-950">Verify</button><button disabled={busy} onClick={()=>void reviewExisting(p.id,"REJECT")} className="rounded-xl border border-rose-300/30 px-4 py-2 text-xs font-semibold text-rose-200">Reject</button></div>}</div>)}
   </div>}
   {invoice&&<div className="mt-5 border-t border-white/10 pt-5"><p className="text-sm font-semibold">Issued invoice {invoice.number}</p>
    <form onSubmit={e=>void record(e)} className="mt-4 space-y-3"><label className="text-xs text-slate-300">Bank/cash reference<input required minLength={3} maxLength={120} className={"mt-2 "+classes} value={reference} onChange={e=>setReference(e.target.value)}/></label>
    <button disabled={busy} className="rounded-xl border border-white/20 px-5 py-3 text-sm" type="submit">Record offline payment</button></form>
    {payment&&<div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} className="rounded-xl bg-emerald-300 px-4 py-2 font-semibold text-slate-950" onClick={()=>void decide("VERIFY")}>Mark verified</button><button disabled={busy} className="rounded-xl border border-rose-300/30 px-4 py-2 text-rose-200" onClick={()=>void decide("REJECT")}>Reject</button></div>}
   </div>}
  </section>
 </div>
 <section className="mt-8 rounded-3xl border border-white/10 bg-[#102630] p-7"><h2 className="text-xl font-bold">Plan catalog</h2><p className="mt-2 text-sm text-slate-400">Price/limit configuration is currently available through protected platform API endpoints. Existing tenants retain subscription quota snapshots when plan definitions change.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{plans.map(p=><article key={p.id} className="rounded-xl border border-white/10 p-5"><h3 className="font-bold">{p.name}</h3><p className="mt-2 text-xs text-slate-400">{p.code} · {p.enabled?"Enabled":"Disabled"} · {p.published?"Public":"Private"}</p><p className="mt-4 text-sm text-emerald-200">Brands {p.maxBrands} · Seats {p.maxSeats}</p></article>)}</div></section>
 <PlatformPlanEditor onSaved={()=>void refresh().catch(e=>setError(e instanceof Error?e.message:"Refresh failed"))}/>
 </div>;
}
