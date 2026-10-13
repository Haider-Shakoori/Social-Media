import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, CallToAction } from "../../components/marketing-sections";
import { plans, faqItems } from "../../lib/site";

export const metadata: Metadata = {
  title: "Planned pricing",
  description: "Explore illustrative plan features for individuals, businesses and agencies. Subscriptions are not yet on sale.",
  alternates: { canonical:"/pricing" },
};

export default function PricingPage() {
  return <main>
    <PageHero eyebrow="SIMPLE PLANS, HONEST LIMITS" title="Plans designed around how teams actually publish." summary="Starter, Growth, and Agency are proposed plan structures. Final pricing, limits and payment availability will be announced after beta validation. No subscriptions can be purchased yet."/>
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map(plan => <article key={plan.name} className={`flex flex-col rounded-[28px] border p-7 sm:p-9 ${plan.featured?"border-emerald-300/45 bg-gradient-to-b from-[#174337] to-[#10262d]":"border-white/10 bg-[#10242e]"}`}>
          {plan.featured?<span className="mb-6 self-start rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-950">Planned popular</span>:<div className="mb-6 h-7"/>}
          <h2 className="text-3xl font-bold">{plan.name}</h2><p className="mt-2 text-sm text-slate-300">{plan.subtitle}</p>
          <p className="mt-8 text-2xl font-bold text-white">Pricing TBA</p><p className="mt-1 text-xs text-slate-400">No active billing · Preview only</p>
          <div className="my-8 h-px bg-white/10"/>
          <ul className="flex-1 space-y-4">{plan.features.map(feature=><li key={feature} className="flex gap-3 text-sm leading-6 text-slate-200"><span className="font-bold text-emerald-300" aria-hidden="true">✓</span>{feature}</li>)}</ul>
          <Link href="/register" className="mt-9 rounded-xl border border-emerald-300/35 px-5 py-3 text-center text-sm font-bold text-emerald-200 hover:bg-emerald-300/10">Early access information</Link>
        </article>)}
      </div>
      <p className="mt-8 rounded-2xl border border-white/10 bg-[#0c202a] p-6 text-sm leading-7 text-slate-400">The launch will enforce image-generation credits, scheduled post limits, approval usage and allowed social connections. Free external API usage is limited and may change independently of the product.</p>
      <div className="mt-20"><h2 className="text-3xl font-bold text-white">Common questions</h2><div className="mt-7 space-y-3">{faqItems.slice(3,7).map(item=><details key={item.q} className="group rounded-2xl border border-white/10 bg-[#102630] p-5"><summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-white">{item.q}<span className="text-emerald-300 group-open:rotate-45">+</span></summary><p className="mt-4 text-sm leading-7 text-slate-300">{item.a}</p></details>)}</div><Link href="/faq" className="mt-6 inline-block text-sm font-bold text-emerald-300 hover:underline">See all questions ↗</Link></div>
    </section><CallToAction/>
  </main>;
}
