import type {Metadata} from "next";
import Link from "next/link";import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Early access",description:"Registration is not yet available.",robots:{index:false,follow:false}};
export default function Register(){return <main><PageHero eyebrow="EARLY ACCESS" title="Registration opens after the security checks." summary="We are not collecting account credentials before tenant isolation, official API eligibility, approvals and subscription controls are verified."/>
 <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8"><Link href="/features" className="inline-block rounded-xl bg-emerald-300 px-6 py-3 font-bold text-slate-950">Explore product features ↗</Link></div></main>;}
