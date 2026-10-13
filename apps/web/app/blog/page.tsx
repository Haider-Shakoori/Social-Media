import type { Metadata } from "next";
import { ResourceIndex } from "../../components/resource-pages";
import { articles } from "../../lib/resources";
import { getCmsResources } from "../../lib/cms";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Articles and guides",description:"Practical resources on safe social publishing, content approvals, and multilingual AI content.",alternates:{canonical:"/blog"}};
export default async function BlogPage(){
 const cms=await getCmsResources("ARTICLE");
 const items=[...articles,...cms.filter(item=>!articles.some(x=>x.slug===item.slug))];
 return <ResourceIndex eyebrow="CONTENT OPERATIONS" title="Practical thinking for better social workflows." description="Short, useful guides on safer account connections, reliable approval systems, and clear content processes." items={items} basePath="/blog"/>;
}
