ALTER TABLE "users" ADD COLUMN "notification_email_opt_in" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "social_notifications"("id" UUID NOT NULL,"recipient_id" UUID NOT NULL,"tenant_id" UUID NOT NULL,"event_key" VARCHAR(180) NOT NULL,"subject" VARCHAR(160) NOT NULL,"message" VARCHAR(500) NOT NULL,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"read_at" TIMESTAMP(3),"emailed_at" TIMESTAMP(3),CONSTRAINT "social_notifications_pkey" PRIMARY KEY("id"));
CREATE UNIQUE INDEX "social_notifications_recipient_id_event_key_key" ON "social_notifications"("recipient_id","event_key");
CREATE INDEX "social_notifications_recipient_id_read_at_created_at_idx" ON "social_notifications"("recipient_id","read_at","created_at");
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_recipient_id_fkey" FOREIGN KEY("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_tenant_id_fkey" FOREIGN KEY("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
