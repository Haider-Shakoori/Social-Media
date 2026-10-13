import type {Metadata} from "next";
import {AuthForm} from "../../components/auth-form";
import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Register",description:"Create a verified account for the controlled Social-Media beta.",robots:{index:false,follow:false}};
export default function Register(){
 const enabled=process.env.NEXT_PUBLIC_AUTH_ENABLED==="true";
 return <main><PageHero eyebrow="EARLY ACCESS" title={enabled?"Create your account.":"Registration opens after the beta security checks."} summary={enabled?"Register, verify your email, and create a workspace. No social publishing access is enabled yet.":"Public signups are not yet accepting credentials. Controlled beta testing requires an operator-enabled registration flag and working mail delivery."}/>
 {enabled?<div className="px-5 pb-24"><AuthForm mode="register"/></div>:<p className="mx-auto max-w-7xl px-5 pb-24 text-sm text-amber-200 sm:px-8">Please return when controlled beta access is announced.</p>}</main>;
}
