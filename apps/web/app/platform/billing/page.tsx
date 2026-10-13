import type {Metadata} from "next";
import {PlatformBillingPanel} from "../../../components/platform-billing-panel";
export const metadata:Metadata={title:"Platform billing operations",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function BillingAdminPage(){return <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><PlatformBillingPanel/></main>;}
