ALTER TABLE "admin_users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "admin_users" ADD COLUMN "google_sub" TEXT;
CREATE UNIQUE INDEX "admin_users_google_sub_key" ON "admin_users"("google_sub");
