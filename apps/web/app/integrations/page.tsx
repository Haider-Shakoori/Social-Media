import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, CallToAction } from "../../components/marketing-sections";
import { platformPlans } from "../../lib/site";

export const metadata: Metadata = {
  title: "Social network integrations",
  description: "Meta Facebook Pages, Instagram professional accounts and X are the only staging pilot networks. Live OAuth and publishing remain disabled.",
  alternates: {canonical:"/integrations"},
};
const styles: Record<string,string> = {
  "Pilot · disabled": "border-sky-300/30 bg-sky-300/10 text-sky-200",
  "Review required": "border-amber-300/30 bg-amber-300/10 text-amber-200",
  "Manual fallback": "border-slate-400/30 bg-slate-400/10 text-slate-200",
};
export default function IntegrationsPage() {
  return <main>
    <PageHero eyebrow="META + X PILOT" title="Facebook, Instagram and X—only for now." summary="These are the three pilot account types. Live connections and automatic publishing remain off until explicit operator authorization and official API eligibility."/>
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platformPlans.map((platform) => <article className="rounded-3xl border border-white/10 bg-[#102630] p-7" key={platform.name}>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold text-white">{platform.name}</h2><span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${styles[platform.status]}`}>{platform.status}</span></div>
          <p className="mt-4 text-sm font-semibold text-emerald-300">{platform.scope}</p><p className="mt-3 text-sm leading-7 text-slate-400">{platform.detail}</p>
        </article>)}
      </div>
      <div className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 text-sm leading-7 text-amber-100/85">
        <strong>Current availability:</strong> No live Meta/X account connections, paid API calls or automatic publishing are enabled. Manual preparation tools and internal staging workflows do not post to social networks.
      </div>
      <p className="mt-7 text-sm leading-7 text-slate-400">Other networks are deferred to a later phase and intentionally absent from this pilot. Production publishing will require authorized official connections. Unofficial session connectors remain disabled. <Link className="font-semibold text-emerald-300 hover:underline" href="/blog/social-publishing-connection-safety">Why account safety matters ↗</Link></p>
    </section>
    <CallToAction/>
  </main>;
}
