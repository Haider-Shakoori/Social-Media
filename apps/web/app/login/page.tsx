import type {Metadata} from "next";
import {AuthForm} from "../../components/auth-form";
import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Log in",description:"Secure tenant login for Social-Media.",robots:{index:false,follow:false}};
export default function Login(){
 const enabled=process.env.NEXT_PUBLIC_AUTH_ENABLED==="true";
 return <main><PageHero eyebrow="ACCOUNT ACCESS" title={enabled?"Welcome back.":"Account access is not publicly open."} summary={enabled?"Sign in to manage your own organization workspaces.":"The secure identity foundation is implemented for controlled beta testing. Public access remains disabled until launch review."}/>
 {enabled?<div className="px-5 pb-24"><AuthForm mode="login"/></div>:<p className="mx-auto max-w-7xl px-5 pb-24 text-sm text-amber-200 sm:px-8">Access will be enabled when beta registration and security review are approved.</p>}</main>;
}
