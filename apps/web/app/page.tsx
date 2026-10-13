import Link from "next/link";
import { CallToAction, SectionHeading } from "../components/marketing-sections";

const flow = [
  { step: "01", name: "Describe a content plan", note: "Choose brand, channels, cadence, language, and content style.", color: "from-emerald-400/20 to-emerald-400/0" },
  { step: "02", name: "Review AI drafts", note: "Edit captions and images; send an exact version for approval.", color: "from-cyan-400/20 to-cyan-400/0" },
  { step: "03", name: "Publish responsibly", note: "Only eligible connected accounts receive approved content.", color: "from-violet-400/20 to-violet-400/0" },
];
const capabilities = [
  { icon: "✦", name: "AI content creation", description: "Brand-grounded ideas, drafts and visuals with explicit generation limits.", href: "/ai-content" },
  { icon: "▦", name: "Content calendar", description: "Recurring weekly themes, occasions, and timezone-aware scheduling.", href: "/scheduling" },
  { icon: "✓", name: "Human approval", description: "Secure in-app and email decisions. Optional WhatsApp bridge later.", href: "/approvals" },
  { icon: "◉", name: "Safer connections", description: "Official APIs first, clear network capabilities and manual fallbacks.", href: "/integrations" },
];

export default function HomePage() {
  return <main>
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute -left-40 top-40 size-80 rounded-full bg-emerald-400/10 blur-[110px]"/>
      <div className="pointer-events-none absolute right-0 top-0 size-[500px] rounded-full bg-cyan-400/10 blur-[140px]"/>
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-20 sm:px-8 lg:pb-32 lg:pt-28">
        <div className="max-w-4xl">
          <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-300/5 px-4 py-2 text-xs font-bold uppercase tracking-[.17em] text-emerald-300"><span className="size-2 rounded-full bg-emerald-300"/> Pre-launch product preview</p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-[-.065em] text-white sm:text-7xl lg:text-[88px]">Less content chaos. <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">More control.</span></h1>
          <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-300">One place to plan, generate, review, and schedule social content. Keep your brand consistent and the final publishing decision in human hands.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-emerald-300 px-7 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-200" href="/features">Explore the platform</Link>
            <Link className="rounded-xl border border-slate-600 px-7 py-3.5 font-bold text-white transition hover:bg-white/10" href="/register">Early access status <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">Registration and live publishing are not yet available. This website previews the intended product.</p>
        </div>
        <div className="mt-16 overflow-hidden rounded-[28px] border border-white/15 bg-[#102630] shadow-[0_30px_110px_rgba(0,0,0,.35)]" aria-label="Illustrative social content planning dashboard">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3"><div className="flex gap-1.5" aria-hidden="true"><span className="size-2.5 rounded-full bg-rose-400/80"/><span className="size-2.5 rounded-full bg-amber-300/80"/><span className="size-2.5 rounded-full bg-emerald-300/80"/></div><span className="text-sm font-bold text-white">Content workspace</span></div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">Illustrative preview</span>
          </div>
          <div className="grid lg:grid-cols-[240px_minmax(0,1fr)_280px]">
            <div className="hidden border-r border-white/10 bg-[#0c1e27] p-6 lg:block">
              <p className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-500">Workspace</p>
              {["Overview","AI Content Studio","Content Calendar","Approval Center","Connected Accounts","Analytics"].map((label,i)=><div key={label} className={`mb-2 rounded-xl px-4 py-3 text-sm ${i===2?"bg-emerald-300/10 font-semibold text-emerald-200":"text-slate-400"}`}>{label}</div>)}
            </div>
            <div className="min-w-0 p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-300">October · sample calendar</p><h2 className="mt-2 text-2xl font-bold">Your content, organized.</h2></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">Approval-first</span></div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[{d:"Mon",n:"12",t:"Brand story",c:"draft"},{d:"Tue",n:"13",t:"Design review",c:"review"},{d:"Wed",n:"14",t:"Tips series",c:"ready"},{d:"Thu",n:"15",t:"Campaign",c:"draft"},{d:"Fri",n:"16",t:"Friday greeting",c:"review"},{d:"Sat",n:"17",t:"Product idea",c:"ready"}].map(p=><div key={p.d} className="min-h-32 rounded-2xl border border-white/10 bg-[#152f38] p-3 sm:p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-400">{p.d}</span><span className="text-xs font-bold text-slate-200">{p.n}</span></div><div className={`mt-5 h-1.5 w-9 rounded-full ${p.c==="ready"?"bg-emerald-300":p.c==="review"?"bg-amber-300":"bg-cyan-300"}`}/><p className="mt-2 text-xs font-semibold text-slate-100">{p.t}</p></div>)}
              </div>
            </div>
            <div className="border-t border-white/10 bg-[#0b2029] p-6 lg:border-l lg:border-t-0">
              <p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-300">Approval preview</p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#133630]"><div className="flex h-36 items-center justify-center bg-gradient-to-br from-emerald-800/55 to-cyan-700/30 text-center"><span className="text-3xl font-semibold tracking-tight text-white">Your brand<br/><span className="text-emerald-200">in focus</span></span></div><div className="p-4"><p className="text-sm font-bold">Friday content draft</p><p className="mt-2 text-xs leading-6 text-slate-300">Awaiting review before it can be scheduled.</p></div></div>
              <div className="mt-4 grid grid-cols-2 gap-2"><span className="rounded-lg bg-emerald-300 px-3 py-2.5 text-center text-xs font-bold text-slate-950">Approve</span><span className="rounded-lg border border-white/25 px-3 py-2.5 text-center text-xs font-semibold">Request edits</span></div>
              <p className="mt-3 text-center text-[11px] text-slate-500">Concept illustration · Controls not active</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="border-y border-white/10 bg-[#0b1b25]/65 py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8">
      <SectionHeading eyebrow="A MORE TRANSPARENT PROCESS" title="Content you can trust yourself to approve." summary="AI speeds up the first draft. Your decisions, approved permissions, and platform limits determine what happens next."/>
      <div className="mt-10 grid gap-4 md:grid-cols-3">{flow.map((item)=><article key={item.step} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${item.color} p-7`}><span className="text-xs font-bold tracking-[.2em] text-emerald-300">{item.step}</span><h3 className="mt-8 text-xl font-bold">{item.name}</h3><p className="mt-3 text-sm leading-7 text-slate-300">{item.note}</p></article>)}</div>
    </div></section>
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <SectionHeading eyebrow="DESIGNED FOR REAL WORK" title="A calmer way to manage the details." summary="A connected workflow for content preparation, review, and supported publishing. Built for growing teams and client relationships."/>
      <div className="mt-10 grid gap-4 md:grid-cols-2">{capabilities.map(item=><Link href={item.href} key={item.name} className="group rounded-3xl border border-white/10 bg-[#102630] p-8 transition hover:-translate-y-1 hover:border-emerald-300/40"><span aria-hidden="true" className="grid size-12 place-items-center rounded-xl bg-emerald-300/10 text-2xl text-emerald-300">{item.icon}</span><h3 className="mt-6 text-xl font-bold text-white">{item.name} <span aria-hidden="true" className="float-right text-emerald-300 transition group-hover:translate-x-1">↗</span></h3><p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p></Link>)}</div>
    </section>
    <section className="border-y border-white/10 bg-[#0b1b25]/70 py-20"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2"><div><SectionHeading eyebrow="ACCOUNT SAFETY FIRST" title="Don't trade your social accounts for automation." summary="Production publishing will use permitted official APIs. Experimental connectors will stay isolated. Every network reports its actual availability."/><Link className="mt-7 inline-flex rounded-xl border border-emerald-300/40 px-6 py-3 font-semibold text-emerald-200 hover:bg-emerald-300/10" href="/integrations">View connection policies ↗</Link></div><div className="space-y-3 rounded-3xl border border-white/10 bg-[#112630] p-6">{["Explicit connection authorization", "Approval bound to one content version", "Automatic pause on restrictions", "Honest unavailable/manual-only states"].map((label)=><div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1d26] p-4"><span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-300/15 text-emerald-300">✓</span><span className="text-sm text-slate-200">{label}</span></div>)}</div></div></section>
    <CallToAction/>
  </main>;
}
