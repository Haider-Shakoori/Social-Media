"use client";
import {useEffect,useState} from "react";
const api=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type BillingData={
 subscription:{
  plan:{code:string;name:string;currency:string};state:string;cycle:string;
  periodEnd:string;trialEndsAt:string|null;graceEndsAt:string|null;
  limits:{maxBrands:number;maxSeats:number;maxConnections:number;monthlyAiText:number;monthlyAiImage:number;monthlyScheduledPosts:number};
 };
 usage:{brands:number;seats:number;connections:number;aiText:number;aiImage:number;scheduledPosts:number;monthStart:string};
 invoices:{id:string;number:string;amountMinor:number;currency:string;status:string;issuedAt:string}[];
 payments:{id:string;reference:string;amountMinor:number;currency:string;state:string;createdAt:string}[];
};
const format=(value:number,currency:string)=>new Intl.NumberFormat("en-US",{style:"currency",currency,maximumFractionDigits:2}).format(value/100);
export function TenantBilling({tenantId,role}:{tenantId:string;role:string}){
 const [data,setData]=useState<BillingData|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(true);
 useEffect(()=>{
  if(!["OWNER","ADMIN"].includes(role)){setBusy(false);return;}
  let active=true;setBusy(true);setData(null);setError("");
  void fetch(api+"/billing/tenants/"+tenantId,{credentials:"include",cache:"no-store"})
    .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.message||"Unavailable");return data as BillingData;})
    .then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Billing unavailable");})
    .finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;};
 },[tenantId,role]);
 if(!["OWNER","ADMIN"].includes(role))return null;
 const metrics=data?[
  {label:"Active brands",used:data.usage.brands,limit:data.subscription.limits.maxBrands},
  {label:"Members + invitations",used:data.usage.seats,limit:data.subscription.limits.maxSeats},
  {label:"Connected accounts",used:data.usage.connections,limit:data.subscription.limits.maxConnections},
  {label:"AI text credits",used:data.usage.aiText,limit:data.subscription.limits.monthlyAiText},
  {label:"AI image credits",used:data.usage.aiImage,limit:data.subscription.limits.monthlyAiImage},
  {label:"Scheduled posts",used:data.usage.scheduledPosts,limit:data.subscription.limits.monthlyScheduledPosts},
 ]:[];
 return <section className="mt-10 rounded-3xl border border-white/10 bg-[#102630] p-7">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-emerald-300">SUBSCRIPTION AND USAGE</p><h2 className="mt-3 text-2xl font-bold">Plan and allowance</h2></div>
   {data&&<span className="rounded-full border border-emerald-300/30 px-4 py-2 text-xs font-bold text-emerald-200">{data.subscription.state}</span>}
  </div>
  {busy&&<p role="status" className="mt-5 text-sm text-slate-300">Loading your subscription...</p>}
  {error&&<p role="alert" className="mt-5 text-sm text-rose-200">{error}</p>}
  {data&&<><p className="mt-5 text-slate-300"><strong className="text-white">{data.subscription.plan.name}</strong> · {data.subscription.cycle.toLowerCase()} · Ends {new Date(data.subscription.periodEnd).toLocaleDateString()}</p>
    {data.subscription.state==="EXPIRED"&&<p className="mt-4 rounded-lg border border-rose-300/25 p-4 text-sm text-rose-200">This subscription has expired. New resource creation and metered processing are blocked until an authorized renewal.</p>}
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map(metric=><div key={metric.label} className="rounded-2xl border border-white/10 bg-[#091a22] p-4">
       <div className="flex items-center justify-between gap-3 text-xs text-slate-300"><span>{metric.label}</span><span>{metric.used} / {metric.limit}</span></div>
       <div role="progressbar" aria-label={metric.label} aria-valuemin={0} aria-valuenow={metric.used} aria-valuemax={metric.limit||1} className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-300" style={{width:(metric.limit===0?100:Math.min(100,metric.used/metric.limit*100))+"%"}}/></div>
      </div>)}
    </div>
    <div className="mt-9 grid gap-5 lg:grid-cols-2">
      <div><h3 className="mb-4 text-lg font-bold">Invoices</h3>{data.invoices.length?data.invoices.map(item=><div key={item.id} className="mb-2 flex justify-between gap-3 rounded-xl border border-white/10 p-3 text-sm"><span>{item.number}<span className="ml-2 text-xs text-slate-400">{item.status}</span></span><span>{format(item.amountMinor,item.currency)}</span></div>):<p className="text-sm text-slate-400">No invoices issued.</p>}</div>
      <div><h3 className="mb-4 text-lg font-bold">Manual payment records</h3>{data.payments.length?data.payments.map(item=><div key={item.id} className="mb-2 flex justify-between gap-3 rounded-xl border border-white/10 p-3 text-sm"><span>{item.reference}<span className="ml-2 text-xs text-slate-400">{item.state}</span></span><span>{format(item.amountMinor,item.currency)}</span></div>):<p className="text-sm text-slate-400">No manual payments recorded.</p>}</div>
    </div>
    <p className="mt-7 text-xs leading-6 text-slate-400">Subscriptions are activated by the platform operator. Payment entries record offline transactions; they are not proof that an external gateway received money. AI and social publishing connectors are still unavailable in this beta.</p>
  </>}
 </section>;
}
