CREATE TABLE "x_budget_policies" (
 "id" UUID NOT NULL,"tenant_id" UUID NOT NULL,
 "monthly_ceiling_minor" INTEGER NOT NULL DEFAULT 0,
 "operator_approved" BOOLEAN NOT NULL DEFAULT false,
 "paid_calls_enabled" BOOLEAN NOT NULL DEFAULT false,
 "last_reviewed_at" TIMESTAMP(3),
 "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "x_budget_policies_pkey" PRIMARY KEY("id"),
 CONSTRAINT "x_budget_policies_monthly_ceiling_nonnegative" CHECK ("monthly_ceiling_minor" >= 0)
);
CREATE UNIQUE INDEX "x_budget_policies_tenant_id_key" ON "x_budget_policies"("tenant_id");
ALTER TABLE "x_budget_policies" ADD CONSTRAINT "x_budget_policies_tenant_id_fkey" FOREIGN KEY("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
