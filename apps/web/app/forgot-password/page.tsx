import type {Metadata} from "next";
import {AuthForm} from "../../components/auth-form";
import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Reset request",robots:{index:false,follow:false}};
export default function Forgot(){
 const enabled=process.env.NEXT_PUBLIC_AUTH_ENABLED==="true";
 return <main><PageHero eyebrow="ACCOUNT RECOVERY" title="Request a password reset" summary="Recovery links are time-limited and can only be used once."/>
 {enabled?<div className="px-5 pb-24"><AuthForm mode="forgot"/></div>:<p className="mx-auto max-w-7xl px-5 pb-24">Account recovery is not publicly enabled.</p>}</main>;
}
