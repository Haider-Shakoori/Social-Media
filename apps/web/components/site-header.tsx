import Link from "next/link";
import { primaryNavigation } from "../lib/site";

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-white/8 bg-[#07131b]/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-white" aria-label="Social-Media home">
          <span className="grid size-10 place-items-center rounded-2xl bg-emerald-300 text-xl font-black text-[#072c26] shadow-[0_0_25px_rgba(110,231,183,.22)]">S</span>
          <span className="text-lg font-bold tracking-tight">Social-Media</span>
          <span className="hidden rounded-full border border-emerald-300/25 px-2 py-1 text-[10px] font-bold tracking-widest text-emerald-300 sm:block">PREVIEW</span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 lg:flex">
          {primaryNavigation.map((item) => <Link href={item.href} key={item.href} className="text-sm font-medium text-slate-300 transition-colors hover:text-emerald-300">{item.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="px-3 py-2 text-sm font-semibold text-slate-200 hover:text-white">Log in</Link>
          <Link href="/register" className="rounded-xl border border-emerald-300/60 bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200">Early access</Link>
        </div>
        <details className="relative ml-auto md:hidden">
          <summary aria-label="Open navigation menu" className="cursor-pointer list-none rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white marker:hidden">Menu</summary>
          <nav aria-label="Mobile navigation" className="absolute right-0 top-12 z-40 grid max-h-[70vh] w-[min(85vw,300px)] gap-1 overflow-y-auto rounded-2xl border border-white/15 bg-[#10242c] p-3 shadow-2xl">
            {primaryNavigation.map((item) => <Link className="rounded-xl px-4 py-3 text-sm text-slate-100 hover:bg-white/10" href={item.href} key={item.href}>{item.label}</Link>)}
            <Link href="/docs" className="rounded-xl px-4 py-3 text-sm text-slate-100 hover:bg-white/10">Documentation</Link>
            <Link href="/contact" className="rounded-xl px-4 py-3 text-sm text-slate-100 hover:bg-white/10">Contact</Link>
            <Link href="/login" className="rounded-xl px-4 py-3 text-sm text-slate-100 hover:bg-white/10">Login</Link>
            <Link href="/register" className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-slate-950">Early access</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
