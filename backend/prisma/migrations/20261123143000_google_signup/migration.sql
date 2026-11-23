-- AlterTable
ALTER TABLE "admin_users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN "google_sub" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_google_sub_key" ON "admin_users"("google_sub");
