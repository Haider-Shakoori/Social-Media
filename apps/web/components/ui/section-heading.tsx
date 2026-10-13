import type { ReactNode } from 'react';

export function SectionHeading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="mb-4 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-300">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl">{children}</h2>
    </div>
  );
}
