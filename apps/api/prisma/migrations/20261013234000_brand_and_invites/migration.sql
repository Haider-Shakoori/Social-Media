ALTER TABLE "brands"
  ADD COLUMN "industry" VARCHAR(120),
  ADD COLUMN "description" TEXT,
  ADD COLUMN "website" VARCHAR(500),
  ADD COLUMN "logo_url" VARCHAR(500),
  ADD COLUMN "primary_color" VARCHAR(7) NOT NULL DEFAULT '#6ee7b7',
  ADD COLUMN "target_audience" TEXT,
  ADD COLUMN "tone" VARCHAR(120),
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY['en']::TEXT[],
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE TABLE "tenant_invitations"(
 "id" UUID NOT NULL,
 "tenant_id" UUID NOT NULL,
 "email" VARCHAR(255) NOT NULL,
 "role" "MembershipRole" NOT NULL,
 "token_hash" CHAR(64) NOT NULL,
 "invited_by_id" UUID NOT NULL,
 "expires_at" TIMESTAMP(3) NOT NULL,
 "accepted_at" TIMESTAMP(3),
 "revoked_at" TIMESTAMP(3),
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "tenant_invitations_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "tenant_invitations_token_hash_key" ON "tenant_invitations"("token_hash");
CREATE UNIQUE INDEX "tenant_invitations_tenant_id_email_key" ON "tenant_invitations"("tenant_id","email");
CREATE INDEX "tenant_invitations_email_expires_at_idx" ON "tenant_invitations"("email","expires_at");
ALTER TABLE "tenant_invitations" ADD CONSTRAINT "tenant_invitations_tenant_id_fkey" FOREIGN KEY("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenant_invitations" ADD CONSTRAINT "tenant_invitations_invited_by_id_fkey" FOREIGN KEY("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "brand_members"(
 "id" UUID NOT NULL,
 "brand_id" UUID NOT NULL,
 "user_id" UUID NOT NULL,
 "role" "MembershipRole" NOT NULL,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "brand_members_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "brand_members_brand_id_user_id_key" ON "brand_members"("brand_id","user_id");
CREATE INDEX "brand_members_user_id_idx" ON "brand_members"("user_id");
ALTER TABLE "brand_members" ADD CONSTRAINT "brand_members_brand_id_fkey" FOREIGN KEY("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brand_members" ADD CONSTRAINT "brand_members_user_id_fkey" FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
