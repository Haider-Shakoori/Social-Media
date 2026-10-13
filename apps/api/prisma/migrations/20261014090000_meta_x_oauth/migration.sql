ALTER TABLE "social_connections" ADD COLUMN "external_account_name" VARCHAR(255);
ALTER TABLE "social_connections" ADD COLUMN "token_expires_at" TIMESTAMP(3);
ALTER TABLE "social_connections" ADD COLUMN "token_scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "social_connections" ADD COLUMN "connected_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "social_connections_brand_id_platform_external_account_id_key" ON "social_connections"("brand_id","platform","external_account_id");
CREATE TABLE "social_oauth_attempts" (
  "id" UUID NOT NULL,"state_hash" CHAR(64) NOT NULL,"network" VARCHAR(20) NOT NULL,
  "brand_id" UUID NOT NULL,"session_id" UUID NOT NULL,"user_id" UUID NOT NULL,
  "verifier_cipher" TEXT,"pending_cipher" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,"state_used_at" TIMESTAMP(3),"selected_at" TIMESTAMP(3),
  CONSTRAINT "social_oauth_attempts_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "social_oauth_attempts_state_hash_key" ON "social_oauth_attempts"("state_hash");
CREATE INDEX "social_oauth_attempts_user_id_expires_at_idx" ON "social_oauth_attempts"("user_id","expires_at");
CREATE INDEX "social_oauth_attempts_brand_id_created_at_idx" ON "social_oauth_attempts"("brand_id","created_at");
ALTER TABLE "social_oauth_attempts" ADD CONSTRAINT "social_oauth_attempts_brand_id_fkey" FOREIGN KEY("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_oauth_attempts" ADD CONSTRAINT "social_oauth_attempts_session_id_fkey" FOREIGN KEY("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_oauth_attempts" ADD CONSTRAINT "social_oauth_attempts_user_id_fkey" FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
