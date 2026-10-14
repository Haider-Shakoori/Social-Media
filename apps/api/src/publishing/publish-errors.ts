/** Provider writes have no safe automatic idempotency key. Treat ambiguous results as UNCERTAIN. */
export class PublishOutcomeUnknown extends Error{
 constructor(readonly reason:string){super('Provider outcome requires manual reconciliation');}
}
