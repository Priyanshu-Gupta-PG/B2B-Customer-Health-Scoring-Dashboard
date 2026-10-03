CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "owner_csm" TEXT NOT NULL,
    "arr" INTEGER NOT NULL,
    "current_score" INTEGER NOT NULL DEFAULT 100,
    "health_status" TEXT NOT NULL DEFAULT 'Healthy',
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_company_name_key" ON "accounts"("company_name");
CREATE INDEX "accounts_health_status_idx" ON "accounts"("health_status");
CREATE INDEX "accounts_current_score_idx" ON "accounts"("current_score");

CREATE TABLE "scoring_rules" (
    "id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "weight_percentage" INTEGER NOT NULL,
    "impact_direction" TEXT NOT NULL,
    "threshold" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "scoring_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scoring_rules_metric_name_key" ON "scoring_rules"("metric_name");

CREATE TABLE "account_metrics" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "source_api" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "metric_value" DECIMAL(12,2) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_metrics_account_id_metric_type_key" ON "account_metrics"("account_id", "metric_type");

CREATE TABLE "score_snapshots" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "calculated_score" INTEGER NOT NULL,
    "health_status" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "score_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "score_snapshots_account_id_recorded_at_idx" ON "score_snapshots"("account_id", "recorded_at" DESC);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metric_name" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);
CREATE INDEX "audit_logs_actor_email_idx" ON "audit_logs"("actor_email");

CREATE TABLE "job_locks" (
    "name" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "job_locks_pkey" PRIMARY KEY ("name")
);

CREATE TABLE "system_state" (
    "id" TEXT NOT NULL,
    "last_ingestion_at" TIMESTAMP(3),
    "cron_status" TEXT NOT NULL DEFAULT 'idle',
    CONSTRAINT "system_state_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "account_metrics" ADD CONSTRAINT "account_metrics_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_current_score_check" CHECK ("current_score" >= 0 AND "current_score" <= 100);
