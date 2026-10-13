import type { Metadata } from "next";
import { ResourceIndex } from "../../components/resource-pages";
import { guides } from "../../lib/resources";
export const metadata:Metadata={title:"Documentation",description:"Explore how onboarding, approvals and social connector availability are planned for Social-Media.",alternates:{canonical:"/docs"}};
export default function DocsPage(){return <ResourceIndex eyebrow="PRODUCT HANDBOOK" title="Understand the workflow, before you connect." description="Read about planned setup, secure approval rules, and the distinctions between official, experimental and manual social integrations." items={guides} basePath="/docs"/>;}
