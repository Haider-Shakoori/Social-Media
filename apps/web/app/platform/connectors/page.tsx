import type {Metadata} from "next";
import Link from "next/link";
import {PlatformConnectorConsole} from "../../../components/platform-connector-console";
export const metadata:Metadata={title:"Connector Management · Platform",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function ConnectorManagement(){
 return <main className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8">
  <p className="text-xs font-bold tracking-[.2em] text-emerald-300">PLATFORM CONTROL CENTER</p>
  <div className="mt-4 mb-9 flex flex-wrap items-center justify-between gap-4">
   <div><h1 className="text-3xl font-bold sm:text-4xl">Connector Management</h1>
    <p className="mt-3 max-w-2xl text-slate-300">Monitor the one-session browser lab and run approved read-only tests.</p></div>
   <Link href="/platform" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-emerald-200">← Platform dashboard</Link>
  </div><PlatformConnectorConsole/></main>;
}
