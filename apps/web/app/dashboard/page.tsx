import type {Metadata} from "next";
import {TenantDashboard} from "../../components/tenant-dashboard";
export const metadata:Metadata={title:"My workspaces",robots:{index:false,follow:false}};
export default function Dashboard(){return <main className="mx-auto max-w-7xl px-5 pb-28 pt-16 sm:px-8"><TenantDashboard/></main>;}
