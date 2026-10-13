import type {Metadata} from "next";
import Link from "next/link";import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Login status",description:"Login is not yet enabled.",robots:{index:false,follow:false}};
export default function Login(){return <main><PageHero eyebrow="ACCOUNT ACCESS" title="Sign-in will open with the private beta." summary="Authentication has not been activated. We will not show a login form until secure sessions, verification and tenant permissions are ready."/>
 <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8"><Link href="/register" className="inline-block rounded-xl bg-emerald-300 px-6 py-3 font-bold text-slate-950">See early access ↗</Link></div></main>;}
