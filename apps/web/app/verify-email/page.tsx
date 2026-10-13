import type {Metadata} from "next";
import Link from "next/link";
import {Suspense,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {PageHero} from "../../components/marketing-sections";
import {EmailVerifier} from "../../components/email-verifier";
export const metadata:Metadata={title:"Verify your email",robots:{index:false,follow:false}};
export default function VerifyEmail(){const enabled=process.env.NEXT_PUBLIC_AUTH_ENABLED==="true";return <main><PageHero eyebrow="VERIFY ACCOUNT" title="Confirm your email address." summary="Verification links expire after 24 hours and are valid for one use."/><div className="px-5 pb-24">{enabled?<Suspense fallback={<p className="text-center">Checking verification...</p>}><EmailVerifier/></Suspense>:<p className="text-center">Email verification is not publicly enabled.</p>}</div></main>;}
