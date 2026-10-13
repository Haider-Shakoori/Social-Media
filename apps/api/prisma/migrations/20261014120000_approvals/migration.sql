ALTER TABLE "approval_requests" ADD COLUMN "requested_by_id" UUID;
ALTER TABLE "approval_requests" ADD COLUMN "reviewed_by_id" UUID;
ALTER TABLE "approval_requests" ADD COLUMN "reviewed_at" TIMESTAMP(3);
ALTER TABLE "approval_requests" ADD COLUMN "review_note" VARCHAR(500) NOT NULL DEFAULT '';
CREATE UNIQUE INDEX "approval_requests_post_version_id_key" ON "approval_requests"("post_version_id");
