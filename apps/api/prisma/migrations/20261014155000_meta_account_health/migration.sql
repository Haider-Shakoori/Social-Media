-- Meta connection health status; never store access tokens in diagnostic columns.
ALTER TABLE "social_connections"
 ADD COLUMN "last_health_checked_at" TIMESTAMP(3),
 ADD COLUMN "last_health_reason" VARCHAR(64);
CREATE INDEX "social_connections_state_token_expires_at_idx"
 ON "social_connections"("state", "token_expires_at");
