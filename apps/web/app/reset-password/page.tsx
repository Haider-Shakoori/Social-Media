import type {Metadata} from "next";
import {AuthForm} from "../../components/auth-form";
import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Choose a new password",robots:{index:false,follow:false}};
export default async function Reset({searchParams}:{searchParams:Promise<{token?:string}>}){
 const {token}=await searchParams;
 const enabled=process.env.NEXT_PUBLIC_AUTH_ENABLED==="true";
 return <main><PageHero eyebrow="SECURE RECOVERY" title="Choose a new password." summary="Using this link revokes other active sessions."/>
 <div className="px-5 pb-24">{enabled&&token?<AuthForm mode="reset" token={token}/>:<p className="text-center text-amber-200">Password recovery is not available or the link is incomplete.</p>}</div></main>;
}
