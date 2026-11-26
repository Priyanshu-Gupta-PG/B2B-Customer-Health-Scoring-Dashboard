-- CreateTable
CREATE TABLE "playbook_tasks" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "playbook_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "playbook_tasks_status_created_at_idx" ON "playbook_tasks"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "playbook_tasks_account_id_idx" ON "playbook_tasks"("account_id");

-- AddForeignKey
ALTER TABLE "playbook_tasks" ADD CONSTRAINT "playbook_tasks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
