import type {Metadata} from "next";
import Link from "next/link";
import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Contact",description:"Contact and launch information for Social-Media.",alternates:{canonical:"/contact"}};
export default function ContactPage(){
 const raw=process.env.PUBLIC_CONTACT_EMAIL?.trim();
 const address=raw&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)?raw:null;
 return <main><PageHero eyebrow="GET IN TOUCH" title="Questions about our platform?" summary="We're building the first release with account safety and human approval at its core. Public customer registration is not yet enabled."/>
 <section className="mx-auto grid max-w-7xl gap-5 px-5 py-20 sm:px-8 md:grid-cols-2">
 <div className="rounded-3xl border border-white/10 bg-[#102630] p-8"><h2 className="text-2xl font-bold">{address?"Email the project":"Contact channel coming soon"}</h2>
 <p className="mt-4 text-sm leading-8 text-slate-300">{address?"You can reach the project through its configured email address.":"No project-owned public contact inbox has been configured. We will not offer a form that silently discards messages."}</p>
 {address?<a className="mt-7 inline-block rounded-xl bg-emerald-300 px-6 py-3 font-semibold text-slate-950" href={"mailto:"+address+"?subject=Social-Media%20Inquiry"}>Email {address} ↗</a>:<p className="mt-6 text-sm text-amber-200">Not yet accepting inquiries</p>}</div>
 <div className="rounded-3xl border border-white/10 bg-[#102630] p-8"><h2 className="text-2xl font-bold">Learn more</h2><div className="mt-7 grid gap-4">
 <Link className="rounded-xl border border-white/10 p-4 text-sm text-emerald-200 hover:border-emerald-200/30" href="/docs">Product documentation ↗</Link>
 <Link className="rounded-xl border border-white/10 p-4 text-sm text-emerald-200 hover:border-emerald-200/30" href="/integrations">Integration availability ↗</Link>
 <Link className="rounded-xl border border-white/10 p-4 text-sm text-emerald-200 hover:border-emerald-200/30" href="/faq">Frequently asked questions ↗</Link>
 </div></div></section></main>;
}
