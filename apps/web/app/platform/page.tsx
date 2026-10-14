import type {Metadata} from "next";
import Link from "next/link";
import {PlatformConsole} from "../../components/platform-console";
import {PlatformProviders} from "../../components/platform-providers";
export const metadata:Metadata={title:"Platform Super-Admin",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function Platform(){
 return <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
  <p className="text-xs font-bold tracking-[.2em] text-emerald-300">PLATFORM CONTROL CENTER</p>
  <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
   <div><h1 className="text-4xl font-bold">Operations and website CMS</h1><p className="mt-3 max-w-3xl text-slate-300">Manage editorial content, review tenant activity and inspect system operation. Access is restricted to explicitly designated platform administrators.</p></div>
   <Link href="/platform/connectors" className="rounded-xl border border-emerald-300/30 px-5 py-3 text-sm font-bold text-emerald-200">Connector Management ↗</Link>
   <Link href="/platform/billing" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-emerald-200">Billing administration ↗</Link>
  </div>
  <PlatformConsole/>
  <PlatformProviders/>
 </main>;
}
