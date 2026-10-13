CREATE TYPE "CalendarSlotState" AS ENUM ('PLANNED','MANUAL_DUE','CANCELLED');
CREATE TABLE "calendar_slots"("id" UUID NOT NULL,"brand_id" UUID NOT NULL,"post_id" UUID NOT NULL,"scheduled_at" TIMESTAMP(3) NOT NULL,"timezone" VARCHAR(100) NOT NULL,"network" VARCHAR(30) NOT NULL,"state" "CalendarSlotState" NOT NULL DEFAULT 'PLANNED',"series_id" UUID,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "calendar_slots_pkey" PRIMARY KEY("id"));
CREATE INDEX "calendar_slots_brand_id_scheduled_at_idx" ON "calendar_slots"("brand_id","scheduled_at");
CREATE INDEX "calendar_slots_state_scheduled_at_idx" ON "calendar_slots"("state","scheduled_at");
ALTER TABLE "calendar_slots" ADD CONSTRAINT "calendar_slots_brand_id_fkey" FOREIGN KEY("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_slots" ADD CONSTRAINT "calendar_slots_post_id_fkey" FOREIGN KEY("post_id") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
