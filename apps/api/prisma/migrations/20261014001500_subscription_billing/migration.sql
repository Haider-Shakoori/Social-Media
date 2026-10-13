-- Batch 5: a no-charge, operator-controlled billing ledger; no payment processor.
ALTER TABLE "users" ADD COLUMN "is_platform_admin" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "SubscriptionState" AS ENUM ('TRIALING','ACTIVE','GRACE','SUSPENDED','CANCELLED','EXPIRED');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY','YEARLY');
CREATE TYPE "PaymentState" AS ENUM ('PENDING','VERIFIED','REJECTED');
CREATE TYPE "InvoiceState" AS ENUM ('ISSUED','PAID','VOID');
CREATE TYPE "UsageMetric" AS ENUM ('AI_TEXT','AI_IMAGE','SCHEDULED_POST');

CREATE TABLE "plans" (
  "id" UUID NOT NULL,"code" VARCHAR(60) NOT NULL,"name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',"currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "monthlyPriceMinor" INTEGER,"yearlyPriceMinor" INTEGER,"trialDays" INTEGER NOT NULL DEFAULT 14,
  "maxBrands" INTEGER NOT NULL DEFAULT 1,"maxSeats" INTEGER NOT NULL DEFAULT 2,
  "maxConnections" INTEGER NOT NULL DEFAULT 1,"monthlyAiText" INTEGER NOT NULL DEFAULT 25,
  "monthlyAiImage" INTEGER NOT NULL DEFAULT 5,"monthlyScheduledPosts" INTEGER NOT NULL DEFAULT 20,
  "enabled" BOOLEAN NOT NULL DEFAULT false,"published" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plans_pkey" PRIMARY KEY("id"));
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

CREATE TABLE "subscriptions"(
  "id" UUID NOT NULL,"tenant_id" UUID NOT NULL,"plan_id" UUID NOT NULL,
  "state" "SubscriptionState" NOT NULL DEFAULT 'TRIALING',
  "cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
  "period_start" TIMESTAMP(3) NOT NULL,"period_end" TIMESTAMP(3) NOT NULL,
  "trial_ends_at" TIMESTAMP(3),"grace_ends_at" TIMESTAMP(3),
  "suspended_at" TIMESTAMP(3),"cancelled_at" TIMESTAMP(3),
  "maxBrands" INTEGER NOT NULL,"maxSeats" INTEGER NOT NULL,"maxConnections" INTEGER NOT NULL,
  "monthlyAiText" INTEGER NOT NULL,"monthlyAiImage" INTEGER NOT NULL,"monthlyScheduledPosts" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY("id"));
CREATE UNIQUE INDEX "subscriptions_tenant_id_key" ON "subscriptions"("tenant_id");
CREATE INDEX "subscriptions_state_period_end_idx" ON "subscriptions"("state","period_end");
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "usage_buckets"(
  "id" UUID NOT NULL,"tenant_id" UUID NOT NULL,"metric" "UsageMetric" NOT NULL,
  "month_start" TIMESTAMP(3) NOT NULL,"used" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_buckets_pkey" PRIMARY KEY("id"));
CREATE UNIQUE INDEX "usage_buckets_tenant_id_metric_month_start_key" ON "usage_buckets"("tenant_id","metric","month_start");
CREATE INDEX "usage_buckets_tenant_id_month_start_idx" ON "usage_buckets"("tenant_id","month_start");
ALTER TABLE "usage_buckets" ADD CONSTRAINT "usage_buckets_tenant_id_fkey" FOREIGN KEY("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "invoices"(
  "id" UUID NOT NULL,"number" VARCHAR(60) NOT NULL,"tenant_id" UUID NOT NULL,"plan_id" UUID,
  "amountMinor" INTEGER NOT NULL,"currency" CHAR(3) NOT NULL,
  "status" "InvoiceState" NOT NULL DEFAULT 'ISSUED',"issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "due_at" TIMESTAMP(3),"paid_at" TIMESTAMP(3),
  CONSTRAINT "invoices_pkey" PRIMARY KEY("id"));
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");
CREATE INDEX "invoices_tenant_id_issued_at_idx" ON "invoices"("tenant_id","issued_at");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_plan_id_fkey" FOREIGN KEY("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "payment_records"(
  "id" UUID NOT NULL,"tenant_id" UUID NOT NULL,"subscription_id" UUID,"invoice_id" UUID,
  "created_by_id" UUID NOT NULL,"amountMinor" INTEGER NOT NULL,"currency" CHAR(3) NOT NULL,
  "reference" VARCHAR(120) NOT NULL,"note" VARCHAR(500) NOT NULL DEFAULT '',
  "state" "PaymentState" NOT NULL DEFAULT 'PENDING',"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified_at" TIMESTAMP(3),
  CONSTRAINT "payment_records_pkey" PRIMARY KEY("id"));
CREATE UNIQUE INDEX "payment_records_tenant_id_reference_key" ON "payment_records"("tenant_id","reference");
CREATE INDEX "payment_records_tenant_id_created_at_idx" ON "payment_records"("tenant_id","created_at");
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_tenant_id_fkey" FOREIGN KEY("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_subscription_id_fkey" FOREIGN KEY("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoice_id_fkey" FOREIGN KEY("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_created_by_id_fkey" FOREIGN KEY("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "billing_audit_events"(
  "id" UUID NOT NULL,"tenant_id" UUID,"actor_id" UUID NOT NULL,
  "action" VARCHAR(80) NOT NULL,"details" JSONB NOT NULL,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_audit_events_pkey" PRIMARY KEY("id"));
CREATE INDEX "billing_audit_events_tenant_id_created_at_idx" ON "billing_audit_events"("tenant_id","created_at");
ALTER TABLE "billing_audit_events" ADD CONSTRAINT "billing_audit_events_tenant_id_fkey" FOREIGN KEY("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "billing_audit_events" ADD CONSTRAINT "billing_audit_events_actor_id_fkey" FOREIGN KEY("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sample plans are all private and disabled, except the trial baseline used by tenant creation.
INSERT INTO "plans" ("id","code","name","description","currency","monthlyPriceMinor","yearlyPriceMinor","trialDays",
"maxBrands","maxSeats","maxConnections","monthlyAiText","monthlyAiImage","monthlyScheduledPosts","enabled","published")
VALUES
('00000000-0000-4000-8000-000000000051','trial','Controlled Trial','No payment required; expires automatically','USD',NULL,NULL,14,2,3,2,30,8,24,true,false),
('00000000-0000-4000-8000-000000000052','starter','Starter','Not available for sale','USD',NULL,NULL,0,1,2,2,100,15,100,false,false),
('00000000-0000-4000-8000-000000000053','growth','Growth','Not available for sale','USD',NULL,NULL,0,6,10,10,500,100,750,false,false),
('00000000-0000-4000-8000-000000000054','agency','Agency','Not available for sale','USD',NULL,NULL,0,25,50,50,2000,300,3000,false,false);

-- Upgrade existing tenants from earlier batches safely; no double subscription.
INSERT INTO "subscriptions" ("id","tenant_id","plan_id","state","cycle","period_start","period_end","trial_ends_at",
"maxBrands","maxSeats","maxConnections","monthlyAiText","monthlyAiImage","monthlyScheduledPosts")
SELECT gen_random_uuid(),t.id,'00000000-0000-4000-8000-000000000051','TRIALING','MONTHLY',
CURRENT_TIMESTAMP,CURRENT_TIMESTAMP + INTERVAL '14 days',CURRENT_TIMESTAMP + INTERVAL '14 days',
2,3,2,30,8,24 FROM "tenants" t
WHERE NOT EXISTS (SELECT 1 FROM "subscriptions" s WHERE s.tenant_id=t.id);
