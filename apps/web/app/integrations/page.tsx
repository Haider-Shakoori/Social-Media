import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, CallToAction } from "../../components/marketing-sections";
import { platformPlans } from "../../lib/site";

export const metadata: Metadata = {
  title: "Social network integrations",
  description: "See planned official integrations and realistic connection availability for Instagram, Facebook, LinkedIn, TikTok, X and Reddit.",
  alternates: {canonical:"/integrations"},
};
const styles: Record<string,string> = {
  "Planned": "border-sky-300/30 bg-sky-300/10 text-sky-200",
  "Review required": "border-amber-300/30 bg-amber-300/10 text-amber-200",
  "Manual fallback": "border-slate-400/30 bg-slate-400/10 text-slate-200",
};
export default function IntegrationsPage() {
  return <main>
    <PageHero eyebrow="TRUTHFUL PLATFORM COVERAGE" title="Your accounts deserve real authorization—not promises." summary="Each social network has different account types, permissions, media restrictions, and commercial rules. We will display verified capabilities instead of pretending every connector is ready."/>
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platformPlans.map((platform) => <article className="rounded-3xl border border-white/10 bg-[#102630] p-7" key={platform.name}>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold text-white">{platform.name}</h2><span className={\`rounded-full border px-3 py-1.5 text-xs font-bold \${styles[platform.status]}\`}>{platform.status}</span></div>
          <p className="mt-4 text-sm font-semibold text-emerald-300">{platform.scope}</p><p className="mt-3 text-sm leading-7 text-slate-400">{platform.detail}</p>
        </article>)}
      </div>
      <div className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 text-sm leading-7 text-amber-100/85">
        <strong>Current availability:</strong> No live social account connections or automatic publishing have been enabled in the public-site foundation. Status labels above describe intended rollout, not operational readiness.
      </div>
      <p className="mt-7 text-sm leading-7 text-slate-400">Production publishing will use authorized official connections. Unofficial session connectors, if investigated, are isolated research only and disabled for commercial tenants. <Link className="font-semibold text-emerald-300 hover:underline" href="/blog/social-publishing-connection-safety">Why account safety matters ↗</Link></p>
    </section>
    <CallToAction/>
  </main>;
}
