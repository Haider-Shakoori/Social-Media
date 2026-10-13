import Link from "next/link";
import { footerGroups } from "../lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#061119]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_3fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-xl font-bold tracking-tight text-white">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-300 text-lg font-black text-slate-950">S</span>Social-Media
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">AI-assisted content workflows with human approval and accurate platform availability.</p>
            <p className="mt-5 max-w-sm rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-6 text-amber-100/80">Pre-launch product preview. Live account connections, subscriptions, and publishing are not available yet.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {footerGroups.map((group) => <div key={group.title}>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-white">{group.title}</h2>
              <ul className="space-y-3">{group.links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-slate-400 transition hover:text-emerald-300">{link.label}</Link></li>)}</ul>
            </div>)}
          </div>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500">
          <p>© {new Date().getUTCFullYear()} Social-Media. Working product name.</p>
          <p>Designed for transparent approval-first publishing · No ban-proof claims.</p>
        </div>
      </div>
    </footer>
  );
}
