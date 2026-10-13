import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingDetail } from "../../components/marketing-sections";
import { marketingPages } from "../../lib/marketing-pages";

export function generateStaticParams() {
  return Object.keys(marketingPages).map(slug => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{slug: string}> }): Promise<Metadata> {
  const { slug } = await params;
  const page = marketingPages[slug];
  return page ? { title: page.title, description: page.summary, alternates: { canonical: "/"+slug } } : {};
}
export default async function MarketingPage({ params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params;
  const page = marketingPages[slug];
  if (!page) notFound();
  return <MarketingDetail content={page}/>;
}
