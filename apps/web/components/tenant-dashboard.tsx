"use client";
import {FormEvent,useEffect,useState} from "react";
import Link from "next/link";
import {TenantManagement} from "./tenant-management";
import {TenantBilling} from "./tenant-billing";
import {TenantConnectors} from "./tenant-connectors";
import {NotificationInbox} from "./notification-inbox";
const api=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type User={id:string;email:string;fullName:string;emailVerified:boolean};
type Tenant={id:string;slug:string;name:string;role:string};
type Workspace={id:string;name:string;timezone:string};
async function request<T>(path:string,method="GET",body?:unknown):Promise<T>{
  const result=await fetch(api+path,{method,credentials:"include",headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined,cache:"no-store"});
  const json=await result.json().catch(()=>({}));
  if(!result.ok)throw new Error(json.message || "Request failed");
  return json as T;
}
export function TenantDashboard(){
 const [user,setUser]=useState<User|null>(null),[tenants,setTenants]=useState<Tenant[]>([]);
 const [active,setActive]=useState<string|null>(null),[workspaces,setWorkspaces]=useState<Workspace[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [name,setName]=useState(""),[slug,setSlug]=useState("");
 const [workspaceName,setWorkspaceName]=useState(""),[timezone,setTimezone]=useState("UTC");
 const enabled=process.env.NEXT_PUBLIC_AUTH_ENABLED==="true";
 useEffect(()=>{
   if(!enabled){setLoading(false);return;}
   let cancelled=false;
   void Promise.all([request<User>("/auth/me"),request<{tenants:Tenant[]}>("/tenants")])
   .then(([profile,data])=>{if(!cancelled){setUser(profile);setTenants(data.tenants);setActive(data.tenants[0]?.id||null);}})
   .catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:"Not authorized");})
   .finally(()=>{if(!cancelled)setLoading(false);});
   return()=>{cancelled=true;};
 },[enabled]);
 useEffect(()=>{
   if(!active)return;
   let cancelled=false;
   void request<{workspaces:Workspace[]}>("/tenants/"+active+"/workspaces")
     .then(data=>{if(!cancelled)setWorkspaces(data.workspaces);})
     .catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:"Cannot load workspaces");});
   return()=>{cancelled=true;};
 },[active]);
 async function createTenant(e:FormEvent){e.preventDefault();setBusy(true);setError("");
   try{const result=await request<{tenant:Tenant}>("/tenants","POST",{name,slug});setTenants(old=>[...old,{...result.tenant,role:"OWNER"}]);setActive(result.tenant.id);setName("");setSlug("");}
   catch(e){setError(e instanceof Error?e.message:"Could not create organization");}finally{setBusy(false);}
 }
 async function createWorkspace(e:FormEvent){e.preventDefault();if(!active)return;setBusy(true);setError("");
   try{const result=await request<{workspace:Workspace}>("/tenants/"+active+"/workspaces","POST",{name:workspaceName,timezone});setWorkspaces(old=>[...old,result.workspace]);setWorkspaceName("");}
   catch(e){setError(e instanceof Error?e.message:"Could not create workspace");}finally{setBusy(false);}
 }
 async function logout(){try{await request("/auth/logout","POST",{});window.location.assign("/login");}catch(e){setError(e instanceof Error?e.message:"Could not sign out");}}
 if(!enabled)return <div className="rounded-3xl border border-white/10 bg-[#102630] p-8"><h1 className="text-3xl font-bold">Customer access not yet open</h1><p className="mt-4 text-slate-300">The tenant dashboard will be enabled during the controlled beta.</p></div>;
 if(loading)return <div role="status" className="min-h-48 animate-pulse rounded-3xl border border-white/10 bg-[#102630] p-8">Loading workspaces...</div>;
 if(!user)return <div className="rounded-3xl border border-white/10 bg-[#102630] p-8"><h1 className="text-3xl font-bold">Sign in required</h1><p className="mt-4 text-rose-200">{error}</p><Link className="mt-6 inline-block rounded-xl bg-emerald-300 px-6 py-3 font-bold text-slate-950" href="/login">Go to login</Link></div>;
 const selected=tenants.find(t=>t.id===active);
 return <div>
   <div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-xs font-bold tracking-[.18em] text-emerald-300">SECURE TENANT FOUNDATION</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Welcome, {user.fullName}.</h1><p className="mt-3 text-slate-400">Verified account · {user.email}</p></div><button type="button" onClick={()=>void logout()} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Sign out</button></div>
   {error&&<p role="alert" className="mt-6 rounded-xl border border-rose-300/25 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>}
   <p className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm text-amber-100">Workspace identity is enabled for controlled testing. Social connections and AI publishing are not active yet. Subscription records, team invites and brand profiles are available for controlled testing.</p>
   <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
     <section className="rounded-3xl border border-white/10 bg-[#102630] p-7"><h2 className="text-2xl font-bold">Your organizations</h2>
       <div className="mt-5 space-y-2">{tenants.length===0?<p className="text-sm text-slate-400">Create your first organization below.</p>:tenants.map(t=><button key={t.id} type="button" onClick={()=>{setActive(t.id);setWorkspaces([]);setError("");}} className={"block w-full rounded-xl border px-4 py-3 text-left text-sm "+(active===t.id?"border-emerald-300/45 bg-emerald-300/10 text-emerald-200":"border-white/10 text-white")}><strong>{t.name}</strong><span className="ml-3 text-xs text-slate-400">{t.role}</span></button>)}</div>
       <form onSubmit={e=>void createTenant(e)} className="mt-7 space-y-3 border-t border-white/10 pt-6"><h3 className="font-bold">New organization</h3><label className="block text-xs text-slate-300">Organization name<input required minLength={2} maxLength={200} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#07131b] p-3 text-sm text-white"/></label>
       <label className="block text-xs text-slate-300">URL slug<input required pattern="[a-z0-9][a-z0-9-]*[a-z0-9]" minLength={3} maxLength={50} placeholder="my-business" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase())} className="mt-2 w-full rounded-xl border border-white/15 bg-[#07131b] p-3 text-sm text-white"/></label>
       <button disabled={busy} type="submit" className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">Create organization</button></form>
     </section>
     <section className="rounded-3xl border border-white/10 bg-[#102630] p-7"><h2 className="text-2xl font-bold">Workspaces</h2><p className="mt-2 text-sm text-slate-400">{selected?selected.name:"Select an organization"}</p>
       <div className="mt-6 space-y-2">{workspaces.map(w=><div key={w.id} className="rounded-xl border border-white/10 px-4 py-3"><strong className="text-sm">{w.name}</strong><p className="mt-1 text-xs text-slate-400">{w.timezone}</p></div>)}</div>
       {selected&&["OWNER","ADMIN"].includes(selected.role)&&<form onSubmit={e=>void createWorkspace(e)} className="mt-7 space-y-3 border-t border-white/10 pt-6"><h3 className="font-bold">New workspace</h3><label className="block text-xs text-slate-300">Name<input required minLength={2} maxLength={200} value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#07131b] p-3 text-sm text-white"/></label>
       <label className="block text-xs text-slate-300">IANA timezone<input required value={timezone} onChange={e=>setTimezone(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#07131b] p-3 text-sm text-white"/></label>
       <button disabled={busy} type="submit" className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60">Create workspace</button></form>}
     </section>
   </div>
   {selected&&<><NotificationInbox/><TenantConnectors tenantId={selected.id} workspaces={workspaces} role={selected.role}/><TenantBilling tenantId={selected.id} role={selected.role}/><TenantManagement key={selected.id} tenantId={selected.id} role={selected.role}/></>}
 </div>;
}
