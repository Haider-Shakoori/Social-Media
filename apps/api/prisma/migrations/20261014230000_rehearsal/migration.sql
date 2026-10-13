CREATE TABLE "dispatch_rehearsals" (
 "id" UUID NOT NULL,"brand_id" UUID NOT NULL,"post_id" UUID NOT NULL,
 "network" VARCHAR(20) NOT NULL,"request_key" VARCHAR(90) NOT NULL,
 "version_id" UUID NOT NULL,"results" JSONB NOT NULL,
 "attempted_by_id" UUID NOT NULL,"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "dispatch_rehearsals_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "dispatch_rehearsals_brand_id_request_key_key" ON "dispatch_rehearsals"("brand_id","request_key");
CREATE INDEX "dispatch_rehearsals_brand_id_created_at_idx" ON "dispatch_rehearsals"("brand_id","created_at");
ALTER TABLE "dispatch_rehearsals" ADD CONSTRAINT "dispatch_rehearsals_brand_id_fkey" FOREIGN KEY("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispatch_rehearsals" ADD CONSTRAINT "dispatch_rehearsals_post_id_fkey" FOREIGN KEY("post_id") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
