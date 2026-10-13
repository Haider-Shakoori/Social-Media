CREATE TYPE "ProviderRolloutState" AS ENUM ('PLANNED','MANUAL_ONLY','AWAITING_APPROVAL','TESTING','PRODUCTION_READY','RESTRICTED','DISABLED');
CREATE TABLE "social_provider_policies"(
  "network" VARCHAR(40) NOT NULL,
  "rollout_state" "ProviderRolloutState" NOT NULL DEFAULT 'PLANNED',
  "operator_enabled" BOOLEAN NOT NULL DEFAULT false,
  "api_approved" BOOLEAN NOT NULL DEFAULT false,
  "cost_approved" BOOLEAN NOT NULL DEFAULT false,
  "production_verified" BOOLEAN NOT NULL DEFAULT false,
  "last_verified_at" TIMESTAMP(3),
  "notes" VARCHAR(500) NOT NULL DEFAULT '',
  "updated_by_id" UUID,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "social_provider_policies_pkey" PRIMARY KEY ("network")
);
ALTER TABLE "social_provider_policies" ADD CONSTRAINT "social_provider_policies_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO "social_provider_policies"("network","rollout_state")
VALUES ('instagram','PLANNED'),('facebook','PLANNED'),('threads','PLANNED'),
 ('pinterest','PLANNED'),('linkedin','PLANNED'),('tiktok','PLANNED'),
 ('youtube','PLANNED'),('google_business_profile','PLANNED'),
 ('x','MANUAL_ONLY'),('reddit','MANUAL_ONLY');
