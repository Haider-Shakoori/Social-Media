import type {Metadata} from "next";
import {PageHero} from "../../../components/marketing-sections";
import {AcceptInvitation} from "../../../components/accept-invitation";
export const metadata:Metadata={title:"Accept team invitation",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function InvitePage({searchParams}:{searchParams:Promise<{token?:string}>}){
 const {token}=await searchParams;
 const enabled=process.env.NEXT_PUBLIC_AUTH_ENABLED==="true";
 return <main><PageHero eyebrow="ORGANIZATION INVITATION" title="Join your team's workspace." summary="Confirm your account is signed in using the invited email address. No invitation can grant access to another identity."/>
 <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">{enabled&&token?<AcceptInvitation token={token}/>:<p className="rounded-2xl border border-amber-300/20 p-6 text-amber-100">Team invitations are not publicly available or this link is incomplete.</p>}</section></main>;
}
