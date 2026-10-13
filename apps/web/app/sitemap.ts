import type {MetadataRoute} from "next";
import {site} from "../lib/site";
import {marketingPages,solutions} from "../lib/marketing-pages";
import {articles,guides} from "../lib/resources";
import {getCmsResources} from "../lib/cms";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const [cmsArticles,cmsGuides,cmsPages]=await Promise.all([
  getCmsResources("ARTICLE"),getCmsResources("GUIDE"),getCmsResources("PAGE"),
 ]);
 const paths=["","integrations","pricing","faq","contact","blog","docs","status","changelog",
  ...Object.keys(marketingPages),...Object.keys(solutions).map(s=>"solutions/"+s),
  ...articles.map(x=>"blog/"+x.slug),...guides.map(x=>"docs/"+x.slug),
  ...cmsArticles.map(x=>"blog/"+x.slug),...cmsGuides.map(x=>"docs/"+x.slug),...cmsPages.map(x=>x.slug),
 ];
 return [...new Set(paths)].map(path=>({url:site.url+(path?"/"+path:""),changeFrequency:"monthly" as const,priority:path?0.5:1}));
}
