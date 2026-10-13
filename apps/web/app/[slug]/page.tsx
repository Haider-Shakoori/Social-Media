import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {MarketingDetail} from "../../components/marketing-sections";
import {marketingPages} from "../../lib/marketing-pages";
import {draftLegalPages} from "../../lib/legal";
export function generateStaticParams(){return [...Object.keys(marketingPages),...Object.keys(draftLegalPages)].map(slug=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const page=marketingPages[slug];if(page)return {title:page.title,description:page.summary,alternates:{canonical:"/"+slug}};
 const legal=draftLegalPages[slug];return legal?{title:legal.title,description:legal.intro,robots:{index:false,follow:false}}:{};
}
export default async function MarketingPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const page=marketingPages[slug];if(page)return <MarketingDetail content={page}/>;
 const legal=draftLegalPages[slug];if(!legal)notFound();
 return <main className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
 <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-bold text-amber-200">Draft — not effective</span>
 <h1 className="mt-9 text-4xl font-bold tracking-tight sm:text-6xl">{legal.title}</h1><p className="mt-7 text-lg leading-9 text-slate-300">{legal.intro}</p>
 <div className="mt-12 space-y-12 border-t border-white/10 pt-12">{legal.sections.map(s=><section key={s.heading}><h2 className="text-2xl font-semibold">{s.heading}</h2><p className="mt-4 leading-8 text-slate-300">{s.body}</p></section>)}</div>
 </main>;
}
