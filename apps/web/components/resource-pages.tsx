import Link from "next/link";
import { PageHero, CallToAction } from "./marketing-sections";
import type { Resource } from "../lib/resources";

export function ResourceIndex({ eyebrow, title, description, items, basePath }: {
  eyebrow: string; title: string; description: string; items: readonly Resource[]; basePath: string;
}) {
  return <main>
    <PageHero eyebrow={eyebrow} title={title} summary={description}/>
    <section className="mx-auto grid max-w-7xl gap-5 px-5 py-20 sm:px-8 md:grid-cols-2 lg:grid-cols-3">
      {items.map(item => <Link key={item.slug} href={basePath+"/"+item.slug} className="group flex min-h-72 flex-col rounded-3xl border border-white/10 bg-[#112630] p-7 transition hover:border-emerald-300/40">
        <span className="text-xs font-bold uppercase tracking-[.14em] text-emerald-300">{item.category} · {item.readingTime}</span>
        <h2 className="mt-6 text-xl font-bold leading-8 text-white group-hover:text-emerald-200">{item.title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-400">{item.description}</p>
        <span className="mt-auto pt-6 text-sm font-semibold text-emerald-300">Read resource ↗</span>
      </Link>)}
    </section>
    <CallToAction/>
  </main>;
}

export function ResourceDetail({ resource, basePath, groupName }: { resource: Resource; basePath: string; groupName: string }) {
  return <main>
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-16 sm:px-8">
      <Link href={basePath} className="text-sm font-semibold text-emerald-300 hover:underline">← All {groupName}</Link>
      <p className="mt-12 text-xs font-bold uppercase tracking-[.2em] text-emerald-300">{resource.category} · {resource.readingTime}</p>
      <h1 className="mt-5 text-4xl font-bold tracking-[-.045em] text-white sm:text-6xl">{resource.title}</h1>
      <p className="mt-6 text-lg leading-9 text-slate-300">{resource.description}</p>
      <div className="mt-12 space-y-11 border-t border-white/10 pt-12">
        {resource.sections.map(section => <section key={section.heading}>
          <h2 className="text-2xl font-bold text-white">{section.heading}</h2>
          <p className="mt-4 text-base leading-9 text-slate-300">{section.body}</p>
        </section>)}
      </div>
      <p className="mt-14 rounded-xl border border-white/10 bg-[#10232d] p-5 text-sm leading-7 text-slate-400">This is pre-launch educational content. Platform capabilities and availability may change as development and provider reviews progress.</p>
    </div>
    <CallToAction/>
  </main>;
}
