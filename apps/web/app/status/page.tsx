import type {Metadata} from "next";import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Service status",description:"Truthful pre-launch service availability.",alternates:{canonical:"/status"}};
export default function Status(){const services=[
 {name:"Public website",state:"Development",note:"Website source is being built; live deployment is not authorized."},
 {name:"Accounts and subscriptions",state:"Not active",note:"Registration, sign-in and billing have not been enabled."},
 {name:"Social publishing",state:"Not active",note:"No production social publishing connector is currently authorized."}
];return <main><PageHero eyebrow="OPERATING STATUS" title="Pre-launch. No customer services enabled." summary="This page reports product-stage availability, not real-time uptime or a production monitoring service."/><section className="mx-auto grid max-w-7xl gap-5 px-5 pb-24 sm:px-8 md:grid-cols-3">{services.map(s=><article key={s.name} className="rounded-3xl border border-white/10 bg-[#102630] p-8"><span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">{s.state}</span><h2 className="mt-6 text-xl font-bold">{s.name}</h2><p className="mt-4 text-sm leading-7 text-slate-300">{s.note}</p></article>)}</section></main>;}
