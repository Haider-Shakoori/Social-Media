import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Social-Media | Content approval and publishing', template: '%s | Social-Media' },
  description: 'A social content workflow for teams and agencies: create, approve and schedule, with availability based on platform permissions.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
