import type { Metadata } from "next";
import { ResourceIndex } from "../../components/resource-pages";
import { guides } from "../../lib/resources";
import { getCmsResources } from "../../lib/cms";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Documentation",description:"Explore how onboarding, approvals and social connector availability are planned for Social-Media.",alternates:{canonical:"/docs"}};
export default async function DocsPage(){
 const cms=await getCmsResources("GUIDE");
 const items=[...guides,...cms.filter(item=>!guides.some(x=>x.slug===item.slug))];
 return <ResourceIndex eyebrow="PRODUCT HANDBOOK" title="Understand the workflow, before you connect." description="Read about planned setup, secure approval rules, and the distinctions between official, experimental and manual social integrations." items={items} basePath="/docs"/>;
}
