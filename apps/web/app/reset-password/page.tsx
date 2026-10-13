import type {Metadata} from "next";
import {Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {AuthForm} from "../../components/auth-form";
import {PageHero} from "../../components/marketing-sections";
export const metadata:Metadata={title:"Choose a new password",robots:{index:false,follow:false}};
function ResetBody(){const token=useSearchParams().get("token")||"";return token?<AuthForm mode="reset" token={token}/>:<p className="text-center text-rose-200">Invalid recovery link.</p>;}
export default function Reset(){
 const enabled=process.env.NEXT_PUBLIC_AUTH_ENABLED==="true";
 return <main><PageHero eyebrow="SECURE RECOVERY" title="Choose a new password." summary="This action will revoke your other signed-in sessions."/>
 <div className="px-5 pb-24">{enabled?<Suspense fallback={<p className="text-center">Loading...</p>}><ResetBody/></Suspense>:<p className="text-center">Password recovery is not publicly enabled.</p>}</div></main>;
}
