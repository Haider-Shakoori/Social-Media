import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {LOCALES,isLocale,isRtl,dictionaryFor} from '../../../lib/i18n';
import {site} from '../../../lib/site';
export function generateStaticParams(){return LOCALES.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
 const {locale}=await params;if(!isLocale(locale))return {robots:{index:false}};
 const t=dictionaryFor(locale);
 return {title:t.title,description:t.subtitle,alternates:{
  canonical:'/l/'+encodeURIComponent(locale),languages:Object.fromEntries(LOCALES.map(l=>[l,'/l/'+encodeURIComponent(l)]))
 },openGraph:{title:t.title,description:t.subtitle,url:site.url+'/l/'+encodeURIComponent(locale)}};
}
export default async function LocalizedOverview({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 const t=dictionaryFor(locale);
 return <main lang={locale} dir={isRtl(locale)?'rtl':'ltr'} className="mx-auto max-w-5xl px-6 py-20">
  <div className="mb-10 flex flex-wrap gap-3">{LOCALES.map(l=><Link key={l} href={'/l/'+l} hrefLang={l} aria-current={l===locale?'page':undefined}
    className={'rounded-lg border px-4 py-2 text-sm '+(l===locale?'border-emerald-300 text-emerald-300':'border-white/20')}>{l==='fa-AF'?'دری':l==='ps'?'پښتو':l==='ar'?'العربية':'English'}</Link>)}</div>
  <p className="text-sm font-semibold text-emerald-300">{t.early}</p>
  <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">{t.title}</h1>
  <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-300">{t.subtitle}</p>
  <div className="mt-10 rounded-2xl border border-white/15 bg-[#102630] p-8">
   <h2 className="text-xl font-bold">{t.privacy}</h2>
   <p className="mt-4 text-slate-300">{t.pilot}</p>
   <p className="mt-4 text-slate-300">{t.actions}</p>
  </div>
  <div className="mt-10"><Link href="/login" className="inline-flex rounded-xl bg-emerald-300 px-6 py-3 font-bold text-slate-950">{t.login}</Link></div>
 </main>;
}
