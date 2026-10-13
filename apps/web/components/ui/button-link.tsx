import type { ReactNode } from 'react';

type ButtonLinkProps = {
  children: ReactNode;
  href: string;
  variant?: 'primary' | 'secondary';
  className?: string;
};

export function ButtonLink({ children, href, variant = 'primary', className = '' }: ButtonLinkProps) {
  const styles = variant === 'primary'
    ? 'bg-emerald-300 text-slate-950 hover:bg-emerald-200'
    : 'border border-slate-600 bg-slate-800/70 text-white hover:bg-slate-700';

  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 text-sm font-bold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 ${styles} ${className}`}
    >
      {children}
    </a>
  );
}
