"use client";
import {FormEvent,useCallback,useEffect,useState} from "react";
const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
type Workspace={id:string;name:string;timezone:string};
type Brand={id:string;name:string;myRole:string;locale:string;industry:string|null;description:string|null;website:string|null;logoUrl:string|null;primaryColor:string;targetAudience:string|null;tone:string|null;languages:string[]};
type Member={userId:string;role:string;user:{email:string;fullName:string}};
type Invite={id:string;email:string;role:string;acceptedAt:string|null;revokedAt:string|null;expiresAt:string};
async function apiCall<T>(path:string,method="GET",body?:unknown):Promise<T>{
 const response=await fetch(API+path,{method,credentials:"include",
  headers:body===undefined?undefined:{"Content-Type":"application/json"},
  body:body===undefined?undefined:JSON.stringify(body),cache:"no-store"});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(typeof result.message==="string"?result.message:"Request failed");
 return result as T;
}
const inputClass="mt-1.5 w-full rounded-xl border border-white/15 bg-[#07131b] p-3 text-sm text-white outline-none focus:border-emerald-300";
const buttonClass="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-200 disabled:opacity-60";
export function TenantManagement({tenantId,role}:{tenantId:string;role:string}) {
 const manager=role==="OWNER"||role==="ADMIN";
 const [workspaces,setWorkspaces]=useState<Workspace[]>([]);
 const [workspaceId,setWorkspaceId]=useState("");
 const [brands,setBrands]=useState<Brand[]>([]);
 const [members,setMembers]=useState<Member[]>([]);
 const [invites,setInvites]=useState<Invite[]>([]);
 const [selectedBrand,setSelectedBrand]=useState("");
 const [grants,setGrants]=useState<{userId:string;role:string}[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [brandName,setBrandName]=useState(""),[industry,setIndustry]=useState(""),[tone,setTone]=useState(""),[description,setDescription]=useState("");
 const [locale,setLocale]=useState("en"),[color,setColor]=useState("#6ee7b7"),[website,setWebsite]=useState("");
 const [targetAudience,setTargetAudience]=useState(""),[brandLanguages,setBrandLanguages]=useState("en");
 const [inviteEmail,setInviteEmail]=useState(""),[inviteRole,setInviteRole]=useState("EDITOR");
 const [grantUser,setGrantUser]=useState(""),[grantRole,setGrantRole]=useState("EDITOR");
 const base="/tenants/"+tenantId;
 const loadTeam=useCallback(async()=>{
   if(!manager)return;
   const [team,pending]=await Promise.all([
     apiCall<{members:Member[]}>(base+"/members"),
     apiCall<{invitations:Invite[]}>(base+"/invitations"),
   ]);
   setMembers(team.members);setInvites(pending.invitations);
 },[base,manager]);
 const loadBrands=useCallback(async(id:string)=>{
   if(!id){setBrands([]);return;}
   const result=await apiCall<{brands:Brand[]}>(base+"/workspaces/"+id+"/brands");
   setBrands(result.brands);
 },[base]);
 useEffect(()=>{
   let alive=true;
   setWorkspaceId("");setBrands([]);setInvites([]);setMembers([]);
   void Promise.all([
     apiCall<{workspaces:Workspace[]}>(base+"/workspaces"),
     ...(manager?[apiCall<{members:Member[]}>(base+"/members"),apiCall<{invitations:Invite[]}>(base+"/invitations")]:[])
   ]).then(([ws,ms,is])=>{
     if(!alive)return;
     const typed=ws as {workspaces:Workspace[]};
     setWorkspaces(typed.workspaces);setWorkspaceId(typed.workspaces[0]?.id||"");
     if(ms)setMembers((ms as {members:Member[]}).members);
     if(is)setInvites((is as {invitations:Invite[]}).invitations);
   }).catch(e=>{if(alive)setError(e instanceof Error?e.message:"Could not load workspace");});
   return()=>{alive=false;};
 },[base,manager]);
 useEffect(()=>{let alive=true;setBrands([]);setSelectedBrand("");setGrants([]);
   if(workspaceId)void apiCall<{brands:Brand[]}>(base+"/workspaces/"+workspaceId+"/brands")
     .then(data=>{if(alive)setBrands(data.brands);})
     .catch(e=>{if(alive)setError(e instanceof Error?e.message:"Could not load brands");});
   return()=>{alive=false;};
 },[base,workspaceId]);
 useEffect(()=>{
   let alive=true;setGrants([]);
   if(manager&&workspaceId&&selectedBrand)void apiCall<{members:{userId:string;role:string}[]}>(base+"/workspaces/"+workspaceId+"/brands/"+selectedBrand+"/members")
     .then(data=>{if(alive)setGrants(data.members);})
     .catch(e=>{if(alive)setError(e instanceof Error?e.message:"Cannot load brand permissions");});
   return()=>{alive=false;};
 },[base,workspaceId,selectedBrand,manager]);
 async function perform(work:()=>Promise<void>){
   setBusy(true);setError("");setNotice("");
   try{await work();}catch(e){setError(e instanceof Error?e.message:"Action unsuccessful");}finally{setBusy(false);}
 }
 function brandBase(){return base+"/workspaces/"+workspaceId+"/brands";}
 async function createBrand(e:FormEvent){e.preventDefault();await perform(async()=>{
   const created=await apiCall<{brand:Brand}>(brandBase(),"POST",{
     name:brandName,industry:industry||null,tone:tone||null,description:description||null,
     targetAudience:targetAudience||null,website:website||null,locale,primaryColor:color,
     languages:[...new Set(brandLanguages.split(",").map(x=>x.trim()).filter(Boolean))],
   });
   setBrands(prev=>[created.brand,...prev]);setBrandName("");setDescription("");setNotice("Brand created.");
 });}
 async function saveBrand(e:FormEvent){e.preventDefault();if(!selectedBrand)return;await perform(async()=>{
   const updated=await apiCall<{brand:Brand}>(brandBase()+"/"+selectedBrand,"PATCH",{
     name:brandName,industry:industry||null,tone:tone||null,description:description||null,
     targetAudience:targetAudience||null,website:website||null,locale,primaryColor:color,
     languages:[...new Set(brandLanguages.split(",").map(x=>x.trim()).filter(Boolean))],
   });
   setBrands(prev=>prev.map(x=>x.id===selectedBrand?updated.brand:x));setNotice("Brand profile updated.");
 });}
 function selectBrand(id:string){setSelectedBrand(id);const item=brands.find(x=>x.id===id);
   if(item){setBrandName(item.name);setIndustry(item.industry||"");setTone(item.tone||"");setDescription(item.description||"");
     setWebsite(item.website||"");setLocale(item.locale);setColor(item.primaryColor);
     setTargetAudience(item.targetAudience||"");setBrandLanguages(item.languages.join(","));}
 }
 async function archiveBrand(){if(!selectedBrand || !window.confirm("Archive this brand? This hides it without erasing its history."))return;
   await perform(async()=>{await apiCall(brandBase()+"/"+selectedBrand,"DELETE");await loadBrands(workspaceId);setSelectedBrand("");setNotice("Brand archived.");});
 }
 async function invite(e:FormEvent){e.preventDefault();await perform(async()=>{
   await apiCall(base+"/invitations","POST",{email:inviteEmail,role:inviteRole});
   await loadTeam();setInviteEmail("");setNotice("Invitation sent. The recipient must sign in with the exact invited email.");
 });}
 async function removeMember(id:string){if(!window.confirm("Remove this team member and revoke their brand access?"))return;await perform(async()=>{
   await apiCall(base+"/members/"+id,"DELETE");await loadTeam();setNotice("Team member removed.");
 });}
 async function revokeInvite(id:string){await perform(async()=>{await apiCall(base+"/invitations/"+id,"DELETE");await loadTeam();setNotice("Invitation revoked.");});}
 async function changeMemberRole(id:string,next:string){await perform(async()=>{
   await apiCall(base+"/members/"+id,"PATCH",{role:next});await loadTeam();setNotice("Member role updated.");
 });}
 async function grant(e:FormEvent){e.preventDefault();if(!selectedBrand)return;await perform(async()=>{
   await apiCall(brandBase()+"/"+selectedBrand+"/members","PUT",{userId:grantUser,role:grantRole});
   const g=await apiCall<{members:{userId:string;role:string}[]}>(brandBase()+"/"+selectedBrand+"/members");
   setGrants(g.members);setNotice("Brand access updated.");
 });}
 async function revokeGrant(id:string){if(!selectedBrand)return;await perform(async()=>{
   await apiCall(brandBase()+"/"+selectedBrand+"/members/"+id,"DELETE");
   setGrants(prev=>prev.filter(x=>x.userId!==id));setNotice("Brand access removed.");
 });}
 const editable=manager || brands.find(b=>b.id===selectedBrand)?.myRole==="EDITOR";
 return <section className="mt-10 space-y-6">
   <div><p className="text-xs font-bold tracking-widest text-emerald-300">BRANDS AND TEAM</p><h2 className="mt-2 text-3xl font-bold text-white">Manage your content organization</h2>
     <p className="mt-3 text-sm leading-7 text-slate-400">Each brand is isolated inside its organization. Editors and approvers only see explicitly assigned brands.</p></div>
   {error&&<p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-200">{error}</p>}
   {notice&&<p role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm text-emerald-200">{notice}</p>}
   <div className="grid gap-6 lg:grid-cols-2">
     <div className="rounded-3xl border border-white/10 bg-[#102630] p-7">
       <label className="block text-sm font-semibold text-slate-200">Workspace
         <select className={inputClass} value={workspaceId} onChange={e=>setWorkspaceId(e.target.value)}>
           {workspaces.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}
         </select>
       </label>
       <h3 className="mt-7 text-lg font-bold">Brand profiles</h3>
       <div className="mt-4 space-y-2">{brands.length===0?<p className="text-sm text-slate-400">No accessible brands in this workspace.</p>:brands.map(b=>
         <button key={b.id} onClick={()=>selectBrand(b.id)} type="button" className={"flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm "+(selectedBrand===b.id?"border-emerald-300/40 bg-emerald-300/10":"border-white/10")}>
           <span className="size-4 shrink-0 rounded-full border border-white/30" style={{background:b.primaryColor}}/>
           <span className="flex-1 font-semibold">{b.name}</span><span className="text-xs text-slate-400">{b.locale}</span>
         </button>)}</div>
       {(manager||selectedBrand&&editable)?<form onSubmit={selectedBrand?e=>void saveBrand(e):e=>void createBrand(e)} className="mt-7 space-y-4 border-t border-white/10 pt-6">
         <h4 className="text-lg font-semibold">{selectedBrand?"Edit selected brand":"Create a new brand"}</h4>
         <label className="block text-xs text-slate-300">Brand name<input className={inputClass} value={brandName} onChange={e=>setBrandName(e.target.value)} required minLength={2} maxLength={200}/></label>
         <div className="grid grid-cols-2 gap-3">
           <label className="block text-xs text-slate-300">Industry<input className={inputClass} value={industry} onChange={e=>setIndustry(e.target.value)} maxLength={120}/></label>
           <label className="block text-xs text-slate-300">Tone<input className={inputClass} value={tone} onChange={e=>setTone(e.target.value)} maxLength={120}/></label>
         </div>
         <label className="block text-xs text-slate-300">Website (HTTPS)<input className={inputClass} type="url" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://example.com"/></label>
         <div className="grid grid-cols-2 gap-3">
           <label className="block text-xs text-slate-300">Main language<select className={inputClass} value={locale} onChange={e=>setLocale(e.target.value)}>
             <option value="en">English</option><option value="fa-AF">Dari</option><option value="ps">Pashto</option><option value="ar">Arabic</option>
           </select></label>
           <label className="block text-xs text-slate-300">Brand color<input type="color" className={inputClass+" h-12"} value={color} onChange={e=>setColor(e.target.value)}/></label>
         </div>
         <label className="block text-xs text-slate-300">Languages (comma-separated codes)<input className={inputClass} value={brandLanguages} onChange={e=>setBrandLanguages(e.target.value)} placeholder="en,fa-AF,ps"/></label>
         <label className="block text-xs text-slate-300">Target audience<textarea rows={2} maxLength={4000} className={inputClass} value={targetAudience} onChange={e=>setTargetAudience(e.target.value)}/></label>
         <label className="block text-xs text-slate-300">Description and guidelines<textarea rows={3} maxLength={4000} className={inputClass} value={description} onChange={e=>setDescription(e.target.value)}/></label>
         <div className="flex flex-wrap gap-3">
           <button disabled={busy} className={buttonClass} type="submit">{selectedBrand?"Save brand":"Create brand"}</button>
           {selectedBrand&&manager&&<button disabled={busy} type="button" onClick={()=>void archiveBrand()} className="rounded-xl border border-rose-300/40 px-4 py-3 text-sm font-semibold text-rose-200">Archive</button>}
           {selectedBrand&&manager&&<button type="button" className="rounded-xl border border-white/20 px-4 py-3 text-sm" onClick={()=>{setSelectedBrand("");setBrandName("");}}>New brand</button>}
         </div>
       </form>:null}
     </div>
     <div className="space-y-6">
       {manager&&<div className="rounded-3xl border border-white/10 bg-[#102630] p-7">
         <h3 className="text-xl font-bold">Invite collaborators</h3><p className="mt-2 text-sm text-slate-400">Invitations expire after 72 hours. An accepted invitation must match the account email exactly.</p>
         <form onSubmit={e=>void invite(e)} className="mt-5 space-y-3">
           <label className="block text-xs text-slate-300">Email<input className={inputClass} type="email" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}/></label>
           <label className="block text-xs text-slate-300">Tenant role<select className={inputClass} value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>
             {role==="OWNER"&&<option value="ADMIN">Administrator</option>}
             <option value="EDITOR">Editor</option><option value="APPROVER">Approver</option><option value="VIEWER">Viewer</option>
           </select></label>
           <button type="submit" disabled={busy} className={buttonClass}>Send invitation</button>
         </form>
         <div className="mt-6 space-y-3">{invites.map(i=><div className="rounded-xl border border-white/10 p-3" key={i.id}><div className="flex flex-wrap justify-between gap-2"><span className="text-sm font-semibold">{i.email}</span><span className="text-xs text-slate-400">{i.role}</span></div>
           <p className="mt-2 text-xs text-slate-400">{i.acceptedAt?"Accepted":i.revokedAt?"Revoked":new Date(i.expiresAt)<new Date()?"Expired":"Pending"}</p>
           {!i.acceptedAt&&!i.revokedAt&&<button type="button" disabled={busy} onClick={()=>void revokeInvite(i.id)} className="mt-2 text-xs font-semibold text-rose-200 hover:underline">Revoke invite</button>}
         </div>)}</div>
       </div>}
       {manager&&<div className="rounded-3xl border border-white/10 bg-[#102630] p-7"><h3 className="text-xl font-bold">Organization members</h3>
         <div className="mt-5 space-y-3">{members.map(m=><div key={m.userId} className="rounded-xl border border-white/10 p-3">
           <p className="font-semibold text-sm">{m.user.fullName}</p><p className="text-xs text-slate-400">{m.user.email}</p>
           <div className="mt-2 flex items-center justify-between"><span className="text-xs text-emerald-200">{m.role}</span>{role==="OWNER"&&m.role!=="OWNER"&&<select aria-label={"Change role for "+m.user.email} value={m.role} disabled={busy} onChange={e=>void changeMemberRole(m.userId,e.target.value)} className="rounded-lg border border-white/20 bg-[#07131b] p-2 text-xs text-white"><option value="ADMIN">Admin</option><option value="EDITOR">Editor</option><option value="APPROVER">Approver</option><option value="VIEWER">Viewer</option></select>}{role==="OWNER"&&m.role!=="OWNER"&&<button type="button" disabled={busy} onClick={()=>void removeMember(m.userId)} className="ml-2 text-xs font-semibold text-rose-200">Remove</button>}</div>
         </div>)}</div></div>}
       {manager&&selectedBrand&&<div className="rounded-3xl border border-white/10 bg-[#102630] p-7"><h3 className="text-xl font-bold">Brand-level access</h3><p className="mt-3 text-sm leading-7 text-slate-400">Editors, approvers and viewers must be assigned to each brand. Organization administrators automatically have access.</p>
         <form onSubmit={e=>void grant(e)} className="mt-5 space-y-3">
           <label className="block text-xs text-slate-300">Tenant member<select className={inputClass} value={grantUser} onChange={e=>setGrantUser(e.target.value)} required><option value="">Choose a member</option>{members.filter(m=>!["OWNER","ADMIN"].includes(m.role)).map(m=><option value={m.userId} key={m.userId}>{m.user.email}</option>)}</select></label>
           <label className="block text-xs text-slate-300">Brand permission<select className={inputClass} value={grantRole} onChange={e=>setGrantRole(e.target.value)}><option value="EDITOR">Editor</option><option value="APPROVER">Approver</option><option value="VIEWER">Viewer</option></select></label>
           <button disabled={busy} type="submit" className={buttonClass}>Grant access</button>
         </form>
         <div className="mt-4 space-y-2">{grants.map(g=><div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3 text-xs" key={g.userId}><span>{members.find(m=>m.userId===g.userId)?.user.email||g.userId}<span className="ml-2 text-slate-400">{g.role}</span></span><button disabled={busy} type="button" className="text-rose-200" onClick={()=>void revokeGrant(g.userId)}>Remove</button></div>)}</div>
       </div>}
     </div>
   </div>
 </section>;
}
