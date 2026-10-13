CREATE TYPE "MembershipRole" AS ENUM ('OWNER','ADMIN','EDITOR','APPROVER','VIEWER');
CREATE TYPE "ConnectionMode" AS ENUM ('OFFICIAL','EXPERIMENTAL','MANUAL');
CREATE TYPE "ConnectionState" AS ENUM ('DISCONNECTED','CONNECTED','LIMITED','RESTRICTED');
CREATE TYPE "PostState" AS ENUM ('DRAFT','APPROVAL_PENDING','APPROVED','SCHEDULED','PUBLISHING','PUBLISHED','UNCERTAIN','FAILED','MANUAL_REQUIRED','CANCELLED');
CREATE TYPE "ApprovalState" AS ENUM ('PENDING','APPROVED','REJECTED','EXPIRED','REVOKED');
CREATE TYPE "EmailTokenPurpose" AS ENUM ('VERIFY_EMAIL','RESET_PASSWORD');

CREATE TABLE "users" (
  "id" UUID NOT NULL,"email" VARCHAR(255) NOT NULL,"password_hash" TEXT,
  "full_name" VARCHAR(150) NOT NULL DEFAULT '',"email_verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,CONSTRAINT "users_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "tenants" (
  "id" UUID NOT NULL,"slug" VARCHAR(100) NOT NULL,"name" VARCHAR(200) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenants_pkey" PRIMARY KEY("id"));
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

CREATE TABLE "memberships" (
  "id" UUID NOT NULL,"user_id" UUID NOT NULL,"tenant_id" UUID NOT NULL,
  "role" "MembershipRole" NOT NULL DEFAULT 'VIEWER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "memberships_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "memberships_tenant_id_user_id_key" ON "memberships"("tenant_id","user_id");
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

CREATE TABLE "workspaces" (
  "id" UUID NOT NULL,"tenant_id" UUID NOT NULL,"name" VARCHAR(200) NOT NULL,
  "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id"));
CREATE INDEX "workspaces_tenant_id_idx" ON "workspaces"("tenant_id");

CREATE TABLE "brands" (
  "id" UUID NOT NULL,"workspace_id" UUID NOT NULL,"name" VARCHAR(200) NOT NULL,
  "locale" VARCHAR(20) NOT NULL DEFAULT 'en',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "brands_pkey" PRIMARY KEY ("id"));
CREATE INDEX "brands_workspace_id_idx" ON "brands"("workspace_id");

CREATE TABLE "social_connections" (
  "id" UUID NOT NULL,"brand_id" UUID NOT NULL,"platform" VARCHAR(40) NOT NULL,
  "mode" "ConnectionMode" NOT NULL DEFAULT 'MANUAL',
  "state" "ConnectionState" NOT NULL DEFAULT 'DISCONNECTED',
  "external_account_id" VARCHAR(255),"encrypted_credentials" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id"));
CREATE INDEX "social_connections_brand_id_platform_idx" ON "social_connections"("brand_id","platform");

CREATE TABLE "content_posts" (
  "id" UUID NOT NULL,"brand_id" UUID NOT NULL,"state" "PostState" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,CONSTRAINT "content_posts_pkey" PRIMARY KEY ("id"));
CREATE INDEX "content_posts_brand_id_state_idx" ON "content_posts"("brand_id","state");

CREATE TABLE "post_versions" (
  "id" UUID NOT NULL,"post_id" UUID NOT NULL,"number" INTEGER NOT NULL,
  "caption" TEXT NOT NULL,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_versions_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "post_versions_post_id_number_key" ON "post_versions"("post_id","number");

CREATE TABLE "post_targets" (
  "id" UUID NOT NULL,"post_id" UUID NOT NULL,"social_connection_id" UUID NOT NULL,
  "state" "PostState" NOT NULL DEFAULT 'DRAFT',"scheduled_at" TIMESTAMP(3),
  "remote_id" VARCHAR(255),"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_targets_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "post_targets_post_id_social_connection_id_key" ON "post_targets"("post_id","social_connection_id");
CREATE INDEX "post_targets_state_scheduled_at_idx" ON "post_targets"("state","scheduled_at");

CREATE TABLE "approval_requests" (
  "id" UUID NOT NULL,"post_version_id" UUID NOT NULL,
  "state" "ApprovalState" NOT NULL DEFAULT 'PENDING',"expires_at" TIMESTAMP(3) NOT NULL,
  "approved_at" TIMESTAMP(3),"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id"));
CREATE INDEX "approval_requests_post_version_id_state_idx" ON "approval_requests"("post_version_id","state");

CREATE TABLE "sessions" (
  "id" UUID NOT NULL,"user_id" UUID NOT NULL,"token_hash" CHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),"user_agent" VARCHAR(300),
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id","expires_at");

CREATE TABLE "email_tokens" (
  "id" UUID NOT NULL,"user_id" UUID NOT NULL,"token_hash" CHAR(64) NOT NULL,
  "purpose" "EmailTokenPurpose" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),CONSTRAINT "email_tokens_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "email_tokens_token_hash_key" ON "email_tokens"("token_hash");
CREATE INDEX "email_tokens_user_id_purpose_expires_at_idx" ON "email_tokens"("user_id","purpose","expires_at");

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brands" ADD CONSTRAINT "brands_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_versions" ADD CONSTRAINT "post_versions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_targets" ADD CONSTRAINT "post_targets_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_targets" ADD CONSTRAINT "post_targets_social_connection_id_fkey" FOREIGN KEY ("social_connection_id") REFERENCES "social_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_post_version_id_fkey" FOREIGN KEY ("post_version_id") REFERENCES "post_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
