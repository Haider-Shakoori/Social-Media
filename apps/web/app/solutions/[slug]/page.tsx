import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingDetail } from "../../../components/marketing-sections";
import { solutions } from "../../../lib/marketing-pages";

export function generateStaticParams() {
  return Object.keys(solutions).map(slug => ({ slug }));
}
export async function generateMetadata({ params }: { params: Promise<{slug: string}> }): Promise<Metadata> {
  const { slug } = await params;
  const page = solutions[slug];
  return page ? {title:page.title,description:page.summary,alternates:{canonical:"/solutions/"+slug}} : {};
}
export default async function SolutionPage({ params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params;
  const page = solutions[slug];
  if (!page) notFound();
  return <MarketingDetail content={page}/>;
}
