import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetail } from "../../../components/resource-pages";
import { guides } from "../../../lib/resources";
export function generateStaticParams(){return guides.map(x=>({slug:x.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;const item=guides.find(x=>x.slug===slug);
  return item?{title:item.title,description:item.description,alternates:{canonical:"/docs/"+slug}}:{};
}
export default async function GuidePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const item=guides.find(x=>x.slug===slug);if(!item)notFound();
  return <ResourceDetail resource={item} basePath="/docs" groupName="guides"/>;
}
