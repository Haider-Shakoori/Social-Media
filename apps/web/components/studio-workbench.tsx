"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
const API=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api/v1";
const input="mt-2 w-full rounded-xl border border-white/20 bg-[#07131b] px-4 py-3 text-sm text-white";
const primary="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-40";
type Version={id:string;number:number;caption:string;mediaUrls:string[];language:string};
type Post={id:string;state:string;createdAt:string;versions:Version[]};
type Campaign={id:string;name:string};
type Slot={id:string;postId:string;network:string;scheduledAt:string;state:string};
type Approval={id:string;state:string;postVersion:{caption:string;number:number;postId:string};requestedById:string|null;expiresAt:string};
type Metrics={source:string;windowDays:number;metrics:Record<string,number>;dailyDrafts:{date:string;count:number}[];limitation:string;
 providerReach:null;providerImpressions:null;providerEngagement:null};
type Protection={brand:{publishingPaused:boolean;pauseReason:string;connections:{id:string;platform:string;state:string}[]};
 globalPaused:boolean;effectiveSocialPublishingAllowed:boolean};
async function req<T>(url:string,method="GET",body?:unknown):Promise<T>{
 const r=await fetch(API+url,{method,credentials:"include",cache:"no-store",
  headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(typeof d.message==="string"?d.message:"Action failed");
 return d as T;
}
export function StudioWorkbench({tenantId,workspaceId,brandId}:{tenantId:string;workspaceId:string;brandId:string}){
 const root="/tenants/"+tenantId+"/workspaces/"+workspaceId+"/brands/"+brandId;
 const [tab,setTab]=useState<"create"|"posts"|"calendar"|"review"|"security"|"insights">("create");
 const [posts,setPosts]=useState<Post[]>([]),[campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [slots,setSlots]=useState<Slot[]>([]),[approvals,setApprovals]=useState<Approval[]>([]);
 const [analytics,setAnalytics]=useState<Metrics|null>(null),[protection,setProtection]=useState<Protection|null>(null);
 const [caption,setCaption]=useState(""),[topic,setTopic]=useState(""),[format,setFormat]=useState("announcement"),[network,setNetwork]=useState("facebook");
 const [headline,setHeadline]=useState(""),[subtitle,setSubtitle]=useState(""),[media,setMedia]=useState(""),[campaign,setCampaign]=useState("");
 const [postId,setPostId]=useState(""),[scheduled,setScheduled]=useState(""),[timezone,setTimezone]=useState("Asia/Kabul"),[repeat,setRepeat]=useState("once"),[count,setCount]=useState(1);
 const [reason,setReason]=useState("Manually reviewing account safety");
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const refresh=useCallback(async()=>{
  const [content,calendar,reviews,security,stats]=await Promise.all([
   req<{posts:Post[];campaigns:Campaign[]}>(root+"/studio"),
   req<{slots:Slot[]}>(root+"/calendar"),
   req<{approvals:Approval[]}>(root+"/approvals"),
   req<Protection>(root+"/protection"),
   req<Metrics>(root+"/analytics?days=30"),
  ]);
  setPosts(content.posts);setCampaigns(content.campaigns);setSlots(calendar.slots);
  setApprovals(reviews.approvals);setProtection(security);setAnalytics(stats);
 },[root]);
 useEffect(()=>{let live=true;setPosts([]);setError("");setNotice("");
  void refresh().catch(e=>{if(live)setError(e instanceof Error?e.message:"Studio data unavailable");});
  return()=>{live=false;};
 },[refresh]);
 async function run(fn:()=>Promise<void>){setBusy(true);setError("");setNotice("");
  try{await fn();}catch(e){setError(e instanceof Error?e.message:"Operation failed");}finally{setBusy(false);}
 }
 async function previewAI(mode:"templates"|"text"){
  await run(async()=>{
   if(!topic.trim())throw new Error("Enter a topic");
   const data=await req<{caption:string;chargedCredits:number;mode:string}>(root+"/creative/"+mode,"POST",{topic,language:"en",destination:network,format});
   setCaption(data.caption);setNotice(mode==="templates"?"A deterministic branded draft was prepared without AI charges.":"AI text returned. Credits charged: "+data.chargedCredits+". Review it before use.");
  });
 }
 async function downloadCard(){
  await run(async()=>{
   const card=await req<{svg:string;filename:string}>(root+"/creative/card","POST",{headline,subtitle,variant:"square"});
   const blob=new Blob([card.svg],{type:"image/svg+xml"});
   const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=card.filename;a.click();URL.revokeObjectURL(url);
   setNotice("SVG template generated locally. It is not an AI-generated photo.");
  });
 }
 async function createPost(e:FormEvent){
  e.preventDefault();await run(async()=>{
   const urls=media.split("\n").map(x=>x.trim()).filter(Boolean);
   const result=await req<{post:Post}>(root+"/studio/posts","POST",{caption,language:"en",mediaUrls:urls,...(campaign?{campaignId:campaign}:{})});
   setNotice("Draft "+result.post.id+" created; nothing was published.");setCaption("");setMedia("");await refresh();
  });
 }
 async function changeVersion(post:Post){
  const latest=post.versions[0];
  const next=window.prompt("Updated caption (will revoke existing approval)",latest?.caption||"");
  if(next===null)return;
  await run(async()=>{
   await req(root+"/studio/posts/"+post.id+"/versions","POST",{caption:next,mediaUrls:latest.mediaUrls,language:"en",expectedVersion:latest.number});
   setNotice("New immutable version saved; reapproval required.");await refresh();
  });
 }
 async function makeCampaign(){
  const name=window.prompt("Campaign name");if(!name)return;
  await run(async()=>{await req(root+"/studio/campaigns","POST",{name,description:""});setNotice("Campaign created");await refresh();});
 }
 async function schedule(e:FormEvent){
  e.preventDefault();await run(async()=>{
   if(!scheduled)throw new Error("Choose a date");
   await req(root+"/calendar","POST",{postId,network,scheduledAt:new Date(scheduled).toISOString(),timezone,repeat,count});
   setNotice("Manual reminders scheduled, not provider posts. DST uses UTC intervals.");await refresh();
  });
 }
 async function cancel(id:string){
  await run(async()=>{await req(root+"/calendar/"+id+"/cancel","POST",{});setNotice("Reminder cancelled, credit is not refunded.");await refresh();});
 }
 async function requestReview(id:string){
  await run(async()=>{await req(root+"/approvals","POST",{postId:id,expiresHours:72});setNotice("Review requested. A different reviewer must approve.");await refresh();});
 }
 async function decide(id:string,decision:"APPROVED"|"REJECTED"){
  await run(async()=>{await req(root+"/approvals/"+id+"/decision","POST",{decision,note:"Reviewed in social content studio"});setNotice("Decision recorded and audited.");await refresh();});
 }
 async function pause(value:boolean){
  await run(async()=>{await req(root+"/protection/pause","POST",{paused:value,reason});setNotice("Brand safety setting changed. It does not turn on provider publishing.");await refresh();});
 }
 async function restrict(id:string){
  if(!window.confirm("Restrict this social account and clear its encrypted local tokens?"))return;
  await run(async()=>{await req(root+"/protection/connections/"+id+"/restrict","POST",{});setNotice("Connection restricted, local credentials cleared.");await refresh();});
 }
 return <section className="mt-8 rounded-3xl border border-white/10 bg-[#102630] p-7">
  <p className="text-xs font-bold tracking-widest text-emerald-300">SOCIAL CONTENT STUDIO · META + X PILOT</p>
  <h2 className="mt-3 text-2xl font-bold">Creative, review and operations</h2>
  <p className="mt-2 text-sm text-slate-300">All content is private to this brand. No automatic social publishing is enabled.</p>
  <nav aria-label="Content studio" className="mt-6 flex flex-wrap gap-2">{([
   ["create","Create"],["posts","Drafts"],["calendar","Calendar"],["review","Approvals"],["security","Protection"],["insights","Analytics"]
  ] as const).map(([key,title])=><button type="button" key={key} onClick={()=>setTab(key)} className={"rounded-xl px-4 py-2 text-sm "+(tab===key?"bg-emerald-300 font-bold text-slate-950":"border border-white/15 text-slate-200")}>{title}</button>)}</nav>
  {error&&<p className="mt-5 rounded-lg border border-rose-400/30 p-3 text-sm text-rose-200" role="alert">{error}</p>}
  {notice&&<p className="mt-5 rounded-lg border border-emerald-400/30 p-3 text-sm text-emerald-200" role="status">{notice}</p>}
  {tab==="create"&&<div className="mt-6 grid gap-6 lg:grid-cols-2">
   <div className="space-y-4">
    <h3 className="font-bold">Brand-aware caption</h3>
    <label className="block text-xs text-slate-300">Topic<input className={input} value={topic} onChange={e=>setTopic(e.target.value)} maxLength={500}/></label>
    <div className="grid grid-cols-3 gap-3">
     <label className="text-xs text-slate-300">Network<select className={input} value={network} onChange={e=>setNetwork(e.target.value)}><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="x">X</option></select></label>
     
     <label className="text-xs text-slate-300">Format<select className={input} value={format} onChange={e=>setFormat(e.target.value)}><option value="announcement">News</option><option value="educational">Education</option><option value="promotion">Promotion</option><option value="question">Question</option></select></label>
    </div>
    <div className="flex flex-wrap gap-3"><button disabled={busy} type="button" className={primary} onClick={()=>void previewAI("templates")}>Branded template · free</button>
     <button disabled={busy} type="button" className="rounded-xl border border-white/20 px-4 py-3 text-sm" onClick={()=>void previewAI("text")}>Cloudflare AI · opt-in</button>
    </div>
    <form onSubmit={e=>void createPost(e)} className="space-y-4">
     <label className="block text-xs text-slate-300">Editable caption<textarea required minLength={1} rows={6} className={input} value={caption} onChange={e=>setCaption(e.target.value)} maxLength={5000}/></label>
     <label className="block text-xs text-slate-300">HTTPS media links (one per line)<textarea rows={3} className={input} value={media} onChange={e=>setMedia(e.target.value)}/></label>
     <label className="block text-xs text-slate-300">Campaign<select className={input} value={campaign} onChange={e=>setCampaign(e.target.value)}><option value="">No campaign</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
     <div className="flex flex-wrap gap-3"><button disabled={busy} className={primary}>Save private draft</button><button type="button" onClick={()=>void makeCampaign()} className="rounded-xl border border-white/20 px-4 py-3 text-sm">New campaign</button></div>
    </form>
   </div>
   <div className="space-y-4">
    <h3 className="font-bold">Branded visual template</h3>
    <label className="block text-xs text-slate-300">Card headline<input className={input} value={headline} maxLength={110} onChange={e=>setHeadline(e.target.value)}/></label>
    <label className="block text-xs text-slate-300">Subtitle<input className={input} value={subtitle} maxLength={200} onChange={e=>setSubtitle(e.target.value)}/></label>
    <button disabled={busy||headline.length<3} type="button" className={primary} onClick={()=>void downloadCard()}>Download branded SVG</button>
    <p className="text-xs leading-6 text-slate-400">The card is an editable vector layout, not a generated photograph. Media URLs are references, not uploaded files.</p>
   </div>
  </div>}
  {tab==="posts"&&<div className="mt-6 space-y-3">{posts.length===0?<p className="text-sm text-slate-400">No drafts yet.</p>:posts.map(p=><article key={p.id} className="rounded-xl border border-white/10 p-4">
   <p className="text-xs text-emerald-200">{p.state} · version {p.versions[0]?.number||"?"}</p>
   <p className="mt-2 whitespace-pre-wrap text-sm">{p.versions[0]?.caption}</p>
   <div className="mt-4 flex gap-2"><button type="button" disabled={busy} onClick={()=>void changeVersion(p)} className="rounded-lg border border-white/15 px-3 py-2 text-xs">Revise</button><button type="button" disabled={busy||p.state!=="DRAFT"} onClick={()=>void requestReview(p.id)} className="rounded-lg border border-emerald-300/30 px-3 py-2 text-xs text-emerald-200">Request independent approval</button></div>
  </article>)}</div>}
  {tab==="calendar"&&<div className="mt-6 space-y-5">
   <form onSubmit={e=>void schedule(e)} className="grid gap-4 lg:grid-cols-3">
    <label className="text-xs text-slate-300">Draft<select required value={postId} onChange={e=>setPostId(e.target.value)} className={input}><option value="">Select post</option>{posts.map(p=><option key={p.id} value={p.id}>{p.versions[0]?.caption.slice(0,60)||p.id}</option>)}</select></label>
    <label className="text-xs text-slate-300">Due (browser local clock)<input type="datetime-local" required value={scheduled} className={input} onChange={e=>setScheduled(e.target.value)}/></label>
    <label className="text-xs text-slate-300">IANA timezone label<input required value={timezone} onChange={e=>setTimezone(e.target.value)} className={input}/></label>
    <label className="text-xs text-slate-300">Recurrence<select className={input} value={repeat} onChange={e=>setRepeat(e.target.value)}><option value="once">Once</option><option value="daily">Every 24h UTC</option><option value="weekly">Every 7 days UTC</option></select></label>
    <label className="text-xs text-slate-300">Occurrences<input type="number" min={1} max={12} value={count} className={input} onChange={e=>setCount(Number(e.target.value))}/></label>
    <button disabled={busy||!postId} className={primary}>Schedule manual reminder</button>
   </form>
   <p className="text-xs text-amber-200">Time is interpreted in your browser's timezone. IANA timezone is stored for reference. DST-safe wall-clock recurrence remains future work.</p>
   <div className="space-y-2">{slots.map(s=><div key={s.id} className="flex flex-wrap justify-between gap-4 rounded-xl border border-white/10 p-4 text-sm">
    <span>{s.network} · {new Date(s.scheduledAt).toLocaleString()} · {s.state}</span>
    {s.state==="PLANNED"&&<button type="button" disabled={busy} onClick={()=>void cancel(s.id)} className="text-rose-200">Cancel</button>}
   </div>)}</div>
  </div>}
  {tab==="review"&&<div className="mt-6 space-y-3">{approvals.length===0?<p className="text-sm text-slate-400">No approval requests yet.</p>:approvals.map(a=><div key={a.id} className="rounded-xl border border-white/10 p-4">
   <p className="text-xs text-emerald-200">{a.state} · post version {a.postVersion.number} · expires {new Date(a.expiresAt).toLocaleString()}</p>
   <p className="my-3 text-sm">{a.postVersion.caption}</p>
   {a.state==="PENDING"&&<div className="flex gap-3"><button disabled={busy} onClick={()=>void decide(a.id,"APPROVED")} className="rounded-lg border border-emerald-300/30 px-4 py-2 text-sm text-emerald-200">Approve</button><button disabled={busy} onClick={()=>void decide(a.id,"REJECTED")} className="rounded-lg border border-rose-300/30 px-4 py-2 text-sm text-rose-200">Reject</button></div>}
  </div>)}</div>}
  {tab==="security"&&protection&&<div className="mt-6 space-y-4">
   <p className="text-sm text-amber-200">Brand pause: {protection.brand.publishingPaused?"ON":"OFF"} · Global pause: {protection.globalPaused?"ON":"OFF"} · Live publishing remains disabled.</p>
   <label className="block text-xs text-slate-300">Reason<input className={input} value={reason} minLength={5} maxLength={300} onChange={e=>setReason(e.target.value)}/></label>
   <button type="button" disabled={busy} onClick={()=>void pause(!protection.brand.publishingPaused)} className={primary}>{protection.brand.publishingPaused?"Clear local brand pause":"Pause brand activity"}</button>
   {protection.brand.connections.map(a=><div key={a.id} className="flex justify-between gap-4 rounded-xl border border-white/10 p-4">
    <span className="text-sm">{a.platform} · {a.state}</span>
    {a.state!=="RESTRICTED"&&<button disabled={busy} onClick={()=>void restrict(a.id)} className="text-sm text-rose-200">Quarantine & clear token</button>}
   </div>)}
  </div>}
  {tab==="insights"&&<div className="mt-6">
   <p className="text-xs text-slate-300">Only first-party operational counts; Meta/X reach and engagement are unavailable until official analytics access is verified.</p>
   <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(analytics?.metrics||{}).map(([key,value])=><div key={key} className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-400">{key.replaceAll(/([A-Z])/g," $1")}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div>
   <p className="mt-4 text-xs text-amber-200">{analytics?.limitation}</p>
  </div>}
 </section>;
}
