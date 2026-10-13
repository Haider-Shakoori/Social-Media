import Link from "next/link";
import type { ReactNode } from "react";
import type { MarketingPageContent } from "../lib/marketing-pages";

export function SectionHeading({ eyebrow, title, summary }: { eyebrow: string; title: string; summary?: string }) {
  return <div className="max-w-3xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-emerald-300">{eyebrow}</p>
    <h2 className="text-3xl font-bold tracking-[-.045em] text-white sm:text-5xl">{title}</h2>
    {summary && <p className="mt-5 text-base leading-8 text-slate-400">{summary}</p>}</div>;
}

export function PageHero({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary: string; children?: ReactNode }) {
  return <section className="relative overflow-hidden border-b border-white/8">
    <div className="pointer-events-none absolute -right-24 -top-36 size-[440px] rounded-full bg-emerald-400/10 blur-[100px]"/>
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 sm:pt-28">
      <span className="mb-6 inline-block rounded-full border border-emerald-400/25 bg-emerald-400/5 px-4 py-2 text-xs font-bold uppercase tracking-[.15em] text-emerald-300">{eyebrow}</span>
      <h1 className="max-w-5xl text-4xl font-bold leading-[1.07] tracking-[-.05em] text-white sm:text-6xl lg:text-7xl">{title}</h1>
      <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">{summary}</p>
      {children}
    </div>
  </section>;
}

export function CallToAction({ title = "Plan with control. Publish with confidence.", description = "Learn how approval-first workflows will work when the beta opens." }: { title?: string; description?: string }) {
  return <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"><div className="relative overflow-hidden rounded-[30px] border border-emerald-300/25 bg-gradient-to-br from-[#173e38] via-[#13303a] to-[#11212f] px-7 py-12 sm:px-12">
    <div className="pointer-events-none absolute -right-10 -top-20 size-72 rounded-full border-[60px] border-emerald-300/10" />
    <h2 className="relative max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
    <p className="relative mt-4 max-w-xl leading-7 text-slate-300">{description}</p>
    <div className="relative mt-8 flex flex-wrap gap-3">
      <Link className="rounded-xl bg-emerald-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-200" href="/register">See early access</Link>
      <Link className="rounded-xl border border-white/25 px-6 py-3 font-semibold text-white transition hover:bg-white/10" href="/docs">Read the documentation</Link>
    </div>
  </div></section>;
}

export function MarketingDetail({ content }: { content: MarketingPageContent }) {
  return <main>
    <PageHero eyebrow={content.eyebrow} title={content.title} summary={content.summary}>
      <div className="mt-9 flex flex-wrap gap-3"><Link href="/integrations" className="rounded-xl bg-emerald-300 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-200">View integrations</Link><Link href="/pricing" className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-white hover:bg-slate-800">See planned plans</Link></div>
    </PageHero>
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <SectionHeading eyebrow="BUILT WITH PURPOSE" title="The details make the workflow."/>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.highlights.map((card) => <article key={card.title} className="rounded-3xl border border-white/10 bg-[#10232d]/65 p-7 transition-colors hover:border-emerald-300/35">
          <span aria-hidden="true" className="mb-6 grid size-12 place-items-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-300">{card.symbol}</span>
          <h3 className="text-xl font-bold text-white">{card.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{card.description}</p>
        </article>)}
      </div>
    </section>
    <section className="border-y border-white/10 bg-[#0d202a]/65 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8"><SectionHeading eyebrow="A SIMPLE APPROACH" title="How the workflow comes together."/>
        <div className="mt-10 grid gap-4 md:grid-cols-3">{content.process.map((step, i) => <article key={step.title} className="rounded-3xl border border-white/10 bg-[#091922] p-7"><span className="text-sm font-bold tracking-widest text-emerald-300">STEP {String(i+1).padStart(2,"0")}</span><h3 className="mt-7 text-xl font-bold text-white">{step.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p></article>)}</div>
        <p className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-5 text-sm leading-7 text-amber-100/85"><strong>Availability note:</strong> {content.note}</p>
      </div>
    </section>
    <CallToAction/>
  </main>;
}
