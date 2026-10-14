import type {Metadata} from "next";
import {EmailApprovalReview} from "../../components/email-approval-review";
export const metadata:Metadata={title:"Review a social post",robots:{index:false,follow:false}};
export default function ReviewPage(){
 return <main className="mx-auto max-w-3xl px-5 pb-28 pt-16 sm:px-8"><EmailApprovalReview/></main>;
}
