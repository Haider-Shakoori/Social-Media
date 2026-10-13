import type {MetadataRoute} from "next";
import {site} from "../lib/site";import {marketingPages,solutions} from "../lib/marketing-pages";import {articles,guides} from "../lib/resources";
export default function sitemap():MetadataRoute.Sitemap{
 const paths=["","integrations","pricing","faq","contact","blog","docs","status","changelog",...Object.keys(marketingPages),...Object.keys(solutions).map(s=>"solutions/"+s),...articles.map(x=>"blog/"+x.slug),...guides.map(x=>"docs/"+x.slug)];
 return [...new Set(paths)].map(path=>({url:site.url+(path?"/"+path:""),changeFrequency:"monthly" as const,priority:path?0.5:1}));
}
