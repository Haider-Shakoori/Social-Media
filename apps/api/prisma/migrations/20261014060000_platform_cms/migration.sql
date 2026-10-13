CREATE TYPE "CmsEntryType" AS ENUM ('ARTICLE','GUIDE','PAGE');
CREATE TYPE "CmsEntryStatus" AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');

CREATE TABLE "cms_entries" (
  "id" UUID NOT NULL,
  "type" "CmsEntryType" NOT NULL,
  "locale" VARCHAR(12) NOT NULL DEFAULT 'en',
  "slug" VARCHAR(100) NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "reading_time" VARCHAR(30) NOT NULL DEFAULT '4 min',
  "sections" JSONB NOT NULL,
  "status" "CmsEntryStatus" NOT NULL DEFAULT 'DRAFT',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_id" UUID NOT NULL,
  "updated_by_id" UUID NOT NULL,
  CONSTRAINT "cms_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cms_entries_type_locale_slug_key" ON "cms_entries"("type","locale","slug");
CREATE INDEX "cms_entries_status_type_locale_published_at_idx" ON "cms_entries"("status","type","locale","published_at");
ALTER TABLE "cms_entries" ADD CONSTRAINT "cms_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cms_entries" ADD CONSTRAINT "cms_entries_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "platform_settings" (
  "key" VARCHAR(100) NOT NULL,
  "value" JSONB NOT NULL,
  "updated_by_id" UUID NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "platform_audit_events" (
  "id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "resource_type" VARCHAR(60) NOT NULL,
  "resource_id" VARCHAR(150),
  "details" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "platform_audit_events_created_at_idx" ON "platform_audit_events"("created_at");
CREATE INDEX "platform_audit_events_resource_type_resource_id_idx" ON "platform_audit_events"("resource_type","resource_id");
ALTER TABLE "platform_audit_events" ADD CONSTRAINT "platform_audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
