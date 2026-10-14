-- A durable, immutable-version-bound queue. No existing target is sent by this migration.
ALTER TABLE "post_targets"
 ADD COLUMN "approved_version_id" UUID,
 ADD COLUMN "attempted_at" TIMESTAMP(3),
 ADD COLUMN "last_failure_code" VARCHAR(60),
 ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "post_targets_state_attempted_at_idx"
 ON "post_targets"("state","attempted_at");
CREATE INDEX "post_targets_approved_version_id_idx"
 ON "post_targets"("approved_version_id");
ALTER TABLE "post_targets" ADD CONSTRAINT "post_targets_approved_version_id_fkey"
 FOREIGN KEY ("approved_version_id") REFERENCES "post_versions"("id")
 ON DELETE SET NULL ON UPDATE CASCADE;
