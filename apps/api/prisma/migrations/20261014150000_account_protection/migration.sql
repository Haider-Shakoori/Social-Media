ALTER TABLE "brands" ADD COLUMN "publishing_paused" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "brands" ADD COLUMN "pause_reason" VARCHAR(300) NOT NULL DEFAULT 'Safety default: review required';
ALTER TABLE "social_connections" ADD COLUMN "paused_at" TIMESTAMP(3);
