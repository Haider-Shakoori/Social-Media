import type { Metadata } from "next";
import { faqItems } from "../../lib/site";
import { PageHero, CallToAction } from "../../components/marketing-sections";

export const metadata: Metadata = { title: "Frequently asked questions", description: "Answers about account safety, approvals, AI quotas, subscription availability, and the Social-Media beta.", alternates:{canonical:"/faq"} };

export default function FaqPage(){
  return <main><PageHero eyebrow="YOUR QUESTIONS, ANSWERED" title="No hidden assumptions." summary="Straightforward answers about how the product is intended to work—and what is not yet available."/>
    <section className="mx-auto max-w-4xl space-y-3 px-5 py-20 sm:px-8">{faqItems.map(item=><details className="group rounded-2xl border border-white/10 bg-[#102630] p-6" key={item.q}><summary className="flex cursor-pointer items-center justify-between gap-6 text-base font-bold text-white">{item.q}<span className="text-2xl text-emerald-300 transition-transform group-open:rotate-45">+</span></summary><p className="mt-5 text-sm leading-8 text-slate-300">{item.a}</p></details>)}</section><CallToAction/></main>;
}
