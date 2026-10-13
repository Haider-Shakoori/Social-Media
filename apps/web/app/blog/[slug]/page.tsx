import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetail } from "../../../components/resource-pages";
import { articles } from "../../../lib/resources";
export function generateStaticParams(){return articles.map(x=>({slug:x.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;const item=articles.find(x=>x.slug===slug);
  return item?{title:item.title,description:item.description,alternates:{canonical:"/blog/"+slug}}:{};
}
export default async function ArticlePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const item=articles.find(x=>x.slug===slug);if(!item)notFound();
  return <ResourceDetail resource={item} basePath="/blog" groupName="articles"/>;
}
