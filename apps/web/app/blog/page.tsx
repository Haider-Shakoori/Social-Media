import type { Metadata } from "next";
import { ResourceIndex } from "../../components/resource-pages";
import { articles } from "../../lib/resources";
export const metadata:Metadata={title:"Articles and guides",description:"Practical resources on safe social publishing, content approvals, and multilingual AI content.",alternates:{canonical:"/blog"}};
export default function BlogPage(){return <ResourceIndex eyebrow="CONTENT OPERATIONS" title="Practical thinking for better social workflows." description="Short, useful guides on safer account connections, reliable approval systems, and clear content processes." items={articles} basePath="/blog"/>;}
