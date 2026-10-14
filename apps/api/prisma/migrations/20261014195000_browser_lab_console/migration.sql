-- Experimental control-plane only. No user credentials, cookies or proxy secrets in SQL.
CREATE TABLE "browser_lab_accounts" (
 "id" UUID NOT NULL, "account_key" VARCHAR(80) NOT NULL,
 "proxy_key" VARCHAR(80), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "browser_lab_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "browser_lab_accounts_account_key_key" ON "browser_lab_accounts"("account_key");
CREATE TABLE "browser_lab_jobs" (
 "id" UUID NOT NULL, "account_id" UUID NOT NULL, "driver" VARCHAR(20) NOT NULL,
 "state" VARCHAR(20) NOT NULL DEFAULT 'QUEUED', "title" VARCHAR(160),
 "failure_code" VARCHAR(60), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "started_at" TIMESTAMP(3), "finished_at" TIMESTAMP(3), "actor_id" UUID NOT NULL,
 CONSTRAINT "browser_lab_jobs_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "browser_lab_jobs_account_id_fkey" FOREIGN KEY ("account_id")
 REFERENCES "browser_lab_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "browser_lab_jobs_state_created_at_idx" ON "browser_lab_jobs"("state","created_at");
CREATE INDEX "browser_lab_jobs_account_id_created_at_idx" ON "browser_lab_jobs"("account_id","created_at");
CREATE TABLE "browser_lab_runtime" (
 "id" VARCHAR(20) NOT NULL DEFAULT 'primary', "last_seen_at" TIMESTAMP(3),
 "max_sessions" INTEGER NOT NULL DEFAULT 1, "agent_version" VARCHAR(40) NOT NULL DEFAULT 'unknown',
 "proxy_keys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 "worker_mode" VARCHAR(24) NOT NULL DEFAULT 'read_only',
 "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "browser_lab_runtime_pkey" PRIMARY KEY ("id")
);
