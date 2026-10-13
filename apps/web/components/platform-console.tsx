"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type Entry={
 id:string;type:"ARTICLE"|"GUIDE"|"PAGE";locale:string;slug:string;title:string;description:string;
 category:string;readingTime:string;sections:{heading:string;body:string}[];
 status:"DRAFT"|"PUBLISHED"|"ARCHIVED";revision:number;updatedAt:string;
};
type User={id:string;email:string;fullName:string;emailVerifiedAt:string|null;isPlatformAdmin:boolean;
 createdAt:string;_count:{memberships:number;sessions:number}};
type Tenant={id:string;name:string;slug:string;createdAt:string;_count:{memberships:number;workspaces:number};subscription?:{state:string;plan:{code:string}}|null};
type Audit={id:string;action:string;resourceType:string;resourceId:string|null;createdAt:string;actor:{email:string}};
type Stats={tenants:number;users:number;workspaces:number;brands:number;connections:number;unverifiedEmails:number;pendingInvitations:number;
 subscriptions:{state:string;count:number}[];posts:{state:string;count:number}[]};
type Setting={key:string;value:unknown;updatedAt:string};
const empty={
 type:"ARTICLE" as "ARTICLE"|"GUIDE"|"PAGE",locale:"en",slug:"",title:"",description:"",category:"Guides",readingTime:"4 min",
 sections:[{heading:"Overview",body:""}],
};
const field="mt-2 w-full rounded-xl border border-white/15 bg-[#07131b] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300";
const btn="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50";
async function request<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const res=await fetch(API+"/platform/operations"+path,{method,credentials:"include",
  headers:body===undefined?undefined:{"Content-Type":"application/json"},
  body:body===undefined?undefined:JSON.stringify(body),cache:"no-store"});
 const result=await res.json().catch(()=>({}));
 if(!res.ok)throw new Error(typeof result.message==="string"?result.message:"Operation failed");
 return result as T;
}
export function PlatformConsole(){
 const [tab,setTab]=useState<"overview"|"cms"|"tenants"|"users"|"settings"|"audit">("overview");
 const [access,setAccess]=useState<"checking"|"denied"|"allowed">("checking");
 const [stats,setStats]=useState<Stats|null>(null);
 const [users,setUsers]=useState<User[]>([]),[tenants,setTenants]=useState<Tenant[]>([]),[audits,setAudits]=useState<Audit[]>([]);
 const [cms,setCms]=useState<Entry[]>([]),[settings,setSettings]=useState<Setting[]>([]);
 const [page,setPage]=useState(1),[total,setTotal]=useState(0);
 const [entry,setEntry]=useState<Entry|null>(null);
 const [form,setForm]=useState({...empty});
 const [sectionsJson,setSectionsJson]=useState(JSON.stringify(empty.sections,null,2));
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [supportEmail,setSupportEmail]=useState(""),[maintenance,setMaintenance]=useState(""),[cmsLive,setCmsLive]=useState(false);
 async function reload(current=tab,nextPage=page){
  if(current==="overview"){setStats(await request<Stats>("/overview"));return;}
  if(current==="settings"){const s=await request<{settings:Setting[]}>("/settings");
    setSettings(s.settings);
    setSupportEmail(String(s.settings.find(x=>x.key==="support_email")?.value||""));
    setMaintenance(String(s.settings.find(x=>x.key==="maintenance_notice")?.value||""));
    setCmsLive(s.settings.find(x=>x.key==="cms_public_enabled")?.value===true);return;
  }
  if(current==="cms"){const result=await request<{entries:Entry[];total:number}>("/cms?page="+nextPage);
    setCms(result.entries);setTotal(result.total);return;}
  if(current==="users"){const result=await request<{users:User[];total:number}>("/users?page="+nextPage);
    setUsers(result.users);setTotal(result.total);return;}
  if(current==="tenants"){const result=await request<{tenants:Tenant[];total:number}>("/tenants?page="+nextPage);
    setTenants(result.tenants);setTotal(result.total);return;}
  const a=await request<{events:Audit[];total:number}>("/audit?page="+nextPage);
  setAudits(a.events);setTotal(a.total);
 }
 useEffect(()=>{
  let active=true;
  void request<Stats>("/overview").then(s=>{if(active){setStats(s);setAccess("allowed");}})
    .catch(e=>{if(active){setAccess("denied");setError(e instanceof Error?e.message:"Restricted");}});
  return()=>{active=false;};
 },[]);
 useEffect(()=>{
  if(access!=="allowed"||tab==="overview")return;
  let active=true;setError("");
  void reload(tab,page).catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to load data");});
  return()=>{active=false;};
 // reload is intentionally not a dependency; it reads only tab and page.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[tab,page,access]);
 function switchTab(next:typeof tab){setTab(next);setPage(1);setError("");setNotice("");}
 async function action(fn:()=>Promise<void>){setError("");setNotice("");setBusy(true);
  try{await fn();}catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}
 }
 function choose(e:Entry){
  setEntry(e);setForm({type:e.type,locale:e.locale,slug:e.slug,title:e.title,description:e.description,category:e.category,readingTime:e.readingTime,sections:e.sections});
  setSectionsJson(JSON.stringify(e.sections,null,2));
 }
 function reset(){setEntry(null);setForm({...empty,sections:[...empty.sections]});setSectionsJson(JSON.stringify(empty.sections,null,2));}
 async function save(e:FormEvent){e.preventDefault();await action(async()=>{
  const sections:unknown=JSON.parse(sectionsJson);
  if(!Array.isArray(sections)||!sections.every(x=>x&&typeof x.heading==="string"&&typeof x.body==="string"))throw new Error("Sections must be an array of {heading, body}");
  const payload={...form,sections};
  if(entry){
   const {type:_,locale:__,slug:___,...editable}=payload;
   const data=await request<{entry:Entry}>("/cms/"+entry.id,"PATCH",{...editable,expectedRevision:entry.revision});
   choose(data.entry);setNotice("Draft saved. Revisions require re-publication.");
  }else{
   const data=await request<{entry:Entry}>("/cms","POST",payload);
   choose(data.entry);setNotice("Content draft created.");
  }
  await reload("cms",page);
 });}
 async function changeStatus(status:"publish"|"unpublish"|"archive"){
  if(!entry)return;
  if(status==="archive"&&!window.confirm("Archive this entry permanently?"))return;
  await action(async()=>{
   const data=await request<{entry:Entry}>("/cms/"+entry.id+"/"+status,"POST",{expectedRevision:entry.revision});
   choose(data.entry);setNotice("CMS entry "+data.entry.status.toLowerCase()+".");
   await reload("cms",page);
  });
 }
 async function updateSetting(key:string,value:string|boolean){
  await action(async()=>{
   await request("/settings","PATCH",{key,value});
   setNotice("Setting saved and recorded in the operator audit log.");
   await reload("settings",1);
  });
 }
 if(access==="checking")return <p role="status" className="mt-10 rounded-xl border border-white/10 p-7 text-slate-300">Checking platform administrator access...</p>;
 if(access==="denied")return <div className="mt-10 rounded-2xl border border-rose-300/30 bg-rose-300/10 p-8">
  <h2 className="text-2xl font-bold">Platform administrator permissions required</h2>
  <p className="mt-3 text-sm text-rose-200">{error}</p>
  <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-emerald-200 underline">Go to login</Link>
 </div>;
 return <div className="mt-10">
  <nav aria-label="Platform console sections" className="flex flex-wrap gap-2">{(["overview","cms","tenants","users","settings","audit"] as const).map(t=>
   <button type="button" key={t} onClick={()=>switchTab(t)} aria-current={tab===t?"page":undefined}
   className={"rounded-xl px-4 py-2.5 text-sm font-semibold capitalize "+(tab===t?"bg-emerald-300 text-slate-950":"border border-white/15 text-slate-300")}>{t}</button>)}</nav>
  {error&&<p role="alert" className="mt-6 rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>}
  {notice&&<p role="status" className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-200">{notice}</p>}
  {tab==="overview"&&stats&&<section className="mt-7 space-y-6">
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
    ["Tenants",stats.tenants],["Registered users",stats.users],["Workspaces",stats.workspaces],["Brands",stats.brands],
    ["Social connections",stats.connections],["Unverified email accounts",stats.unverifiedEmails],["Pending invitations",stats.pendingInvitations],
   ].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-[#102630] p-6">
    <p className="text-sm text-slate-400">{label}</p><p className="mt-4 text-3xl font-bold">{value}</p>
   </div>)}</div>
   <div className="grid gap-5 lg:grid-cols-2">{[
    {title:"Subscription records (stored state)",items:stats.subscriptions},
    {title:"Post queue status",items:stats.posts},
   ].map(x=><div key={x.title} className="rounded-2xl border border-white/10 bg-[#102630] p-6">
    <h3 className="font-bold">{x.title}</h3><div className="mt-5 space-y-3">{x.items.length?x.items.map(v=>
     <div key={v.state} className="flex justify-between rounded-lg border border-white/10 p-3 text-sm"><span>{v.state}</span><span>{v.count}</span></div>):<p className="text-sm text-slate-400">No records yet.</p>}</div>
   </div>)}</div>
   <p className="text-sm text-amber-200">This is a database snapshot, not live social-provider health. No production integrations are enabled.</p>
  </section>}
  {tab==="cms"&&<section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
   <div className="rounded-2xl border border-white/10 bg-[#102630] p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">CMS library</h2><button type="button" className="text-sm font-bold text-emerald-200" onClick={reset}>+ New</button></div>
    <p className="mt-2 text-xs text-slate-400">Articles and guides · {total} records</p>
    <div className="mt-5 space-y-2">{cms.map(x=><button type="button" key={x.id} onClick={()=>choose(x)}
     className={"block w-full rounded-xl border p-4 text-left "+(entry?.id===x.id?"border-emerald-300/40 bg-emerald-300/10":"border-white/10")}>
     <span className="text-xs text-emerald-300">{x.type} · {x.locale} · {x.status} · v{x.revision}</span>
     <span className="mt-2 block font-semibold">{x.title}</span><span className="mt-1 block text-xs text-slate-400">{x.type==="ARTICLE"?"/blog/":x.type==="GUIDE"?"/docs/":"/"}{x.slug}</span>
    </button>)}</div>
    <PageControls page={page} total={total} pageSize={25} update={setPage}/>
   </div>
   <div className="rounded-2xl border border-white/10 bg-[#102630] p-6">
    <h2 className="text-xl font-bold">{entry?"Edit CMS entry":"Create CMS draft"}</h2>
    <p className="mt-2 text-sm text-slate-400">Plain-text sections only. Editing a published entry immediately returns it to draft; republish after review.</p>
    <form onSubmit={e=>void save(e)} className="mt-5 space-y-4">
     <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-xs text-slate-300">Content type<select disabled={!!entry} className={field} value={form.type} onChange={e=>setForm(x=>({...x,type:e.target.value as "ARTICLE"|"GUIDE"|"PAGE"}))}><option value="ARTICLE">Article</option><option value="GUIDE">Guide</option><option value="PAGE">Website page</option></select></label>
      <label className="text-xs text-slate-300">Language<select disabled={!!entry} className={field} value={form.locale} onChange={e=>setForm(x=>({...x,locale:e.target.value}))}>{["en","fa-AF","ps","ar"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
     </div>
     <label className="block text-xs text-slate-300">Slug (permanent)<input disabled={!!entry} className={field} required minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>setForm(x=>({...x,slug:e.target.value.toLowerCase()}))}/></label>
     <label className="block text-xs text-slate-300">Title<input className={field} required minLength={6} maxLength={180} value={form.title} onChange={e=>setForm(x=>({...x,title:e.target.value}))}/></label>
     <label className="block text-xs text-slate-300">SEO description<textarea rows={3} className={field} required minLength={15} maxLength={500} value={form.description} onChange={e=>setForm(x=>({...x,description:e.target.value}))}/></label>
     <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-xs text-slate-300">Category<input className={field} required maxLength={80} value={form.category} onChange={e=>setForm(x=>({...x,category:e.target.value}))}/></label>
      <label className="text-xs text-slate-300">Reading time<input className={field} required maxLength={30} value={form.readingTime} onChange={e=>setForm(x=>({...x,readingTime:e.target.value}))}/></label>
     </div>
     <label className="block text-xs text-slate-300">Sections as JSON (heading and body)<textarea required rows={12} className={field+" font-mono"} value={sectionsJson} onChange={e=>setSectionsJson(e.target.value)} spellCheck={false}/></label>
     <div className="flex flex-wrap gap-3"><button disabled={busy||entry?.status==="ARCHIVED"} type="submit" className={btn}>{busy?"Saving...":"Save draft"}</button>
      {entry&&entry.status!=="ARCHIVED"&&<>
       {entry.status!=="PUBLISHED"?<button disabled={busy} type="button" className="rounded-xl border border-emerald-300/40 px-5 py-3 text-sm text-emerald-200" onClick={()=>void changeStatus("publish")}>Publish</button>:
        <button disabled={busy} type="button" className="rounded-xl border border-white/20 px-5 py-3 text-sm" onClick={()=>void changeStatus("unpublish")}>Unpublish</button>}
       <button disabled={busy} type="button" className="rounded-xl border border-rose-300/30 px-5 py-3 text-sm text-rose-200" onClick={()=>void changeStatus("archive")}>Archive</button>
      </>}
     </div>
     {entry&&<p className="text-xs text-slate-400">Revision {entry.revision} · {entry.status}. Publishing requires a separate CMS_PUBLISHING_ENABLED server flag; public visibility requires two additional approval gates.</p>}
    </form>
   </div>
  </section>}
  {tab==="tenants"&&<section className="mt-7 rounded-2xl border border-white/10 bg-[#102630] p-6"><h2 className="text-xl font-bold">Organizations</h2>
   <div className="mt-5 space-y-3">{tenants.map(x=><div key={x.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 p-4">
    <div><h3 className="font-semibold">{x.name}</h3><p className="mt-2 text-xs text-slate-400">{x.slug} · {x._count.memberships} members · {x._count.workspaces} workspaces</p></div>
    <span className="text-sm text-emerald-200">{x.subscription?.plan.code||"No plan"} / {x.subscription?.state||"Unknown"}</span>
   </div>)}</div><PageControls page={page} total={total} pageSize={25} update={setPage}/>
  </section>}
  {tab==="users"&&<section className="mt-7 rounded-2xl border border-white/10 bg-[#102630] p-6"><h2 className="text-xl font-bold">Accounts (read-only)</h2>
   <div className="mt-5 space-y-3">{users.map(x=><div key={x.id} className="flex flex-wrap justify-between gap-4 rounded-xl border border-white/10 p-4 text-sm">
    <div><strong>{x.fullName}</strong><p className="mt-1 text-slate-400">{x.email}</p></div>
    <div className="text-right text-xs text-slate-300"><p>{x.isPlatformAdmin?"Platform admin":"Tenant user"} · {x.emailVerifiedAt?"Verified":"Unverified"}</p><p className="mt-1">{x._count.memberships} memberships</p></div>
   </div>)}</div><PageControls page={page} total={total} pageSize={25} update={setPage}/>
  </section>}
  {tab==="settings"&&<section className="mt-7 max-w-3xl space-y-5"><div className="rounded-2xl border border-white/10 bg-[#102630] p-6">
   <h2 className="text-xl font-bold">Platform settings</h2><p className="mt-3 text-sm text-slate-400">Allowed keys are strictly limited. No settings can automatically bypass provider permissions or enable live social publishing.</p>
   <label className="mt-6 flex items-center gap-3 text-sm"><input type="checkbox" checked={cmsLive} onChange={e=>setCmsLive(e.target.checked)}/> Allow published CMS entries to appear through public API</label>
   <button disabled={busy} type="button" onClick={()=>void updateSetting("cms_public_enabled",cmsLive)} className={btn+" mt-4"}>Save public CMS setting</button>
   <label className="mt-7 block text-sm text-slate-300">Support email<input type="email" className={field} value={supportEmail} onChange={e=>setSupportEmail(e.target.value)}/></label>
   <button disabled={busy} type="button" onClick={()=>void updateSetting("support_email",supportEmail)} className={btn+" mt-4"}>Save support email</button>
   <label className="mt-7 block text-sm text-slate-300">Maintenance notice<textarea className={field} maxLength={500} rows={4} value={maintenance} onChange={e=>setMaintenance(e.target.value)}/></label>
   <button disabled={busy} type="button" onClick={()=>void updateSetting("maintenance_notice",maintenance)} className={btn+" mt-4"}>Save notice</button>
   <p className="mt-6 text-xs text-amber-200">Changes appear in platform settings now; public CMS also requires CMS_PUBLIC_ENABLED=true in both API and web server configurations.</p>
   </div></section>}
  {tab==="audit"&&<section className="mt-7 rounded-2xl border border-white/10 bg-[#102630] p-6"><h2 className="text-xl font-bold">Platform changes</h2>
   <div className="mt-5 space-y-3">{audits.map(e=><div key={e.id} className="flex flex-wrap justify-between gap-4 rounded-xl border border-white/10 p-4 text-sm">
    <div><strong>{e.action}</strong><p className="mt-1 text-slate-400">{e.resourceType}: {e.resourceId||"general"}</p></div>
    <div className="text-xs text-slate-400">{e.actor.email}<p className="mt-2">{new Date(e.createdAt).toLocaleString()}</p></div>
   </div>)}</div><PageControls page={page} total={total} pageSize={30} update={setPage}/>
  </section>}
 </div>;
}
function PageControls({page,total,pageSize,update}:{page:number;total:number;pageSize:number;update:(page:number)=>void}){
 const pages=Math.max(1,Math.ceil(total/pageSize));
 return <div className="mt-6 flex items-center justify-between gap-4 text-sm">
  <button type="button" disabled={page<=1} onClick={()=>update(page-1)} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-40">Previous</button>
  <span className="text-slate-400">Page {page} of {pages}</span>
  <button type="button" disabled={page>=pages} onClick={()=>update(page+1)} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-40">Next</button>
 </div>;
}
