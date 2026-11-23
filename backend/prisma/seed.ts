import dotenv from "dotenv";
import { prisma } from "../src/infrastructure/prisma.js";
import { runDemoSeed } from "../src/bootstrap/demoSeed.js";

dotenv.config();

async function main() {
  if (process.env.FORCE_SEED !== "true") {
    const existing = await prisma.adminUser.count();
    if (existing > 0) {
      console.log(`Database already has ${existing} admin user(s). Skipping seed (set FORCE_SEED=true to wipe & reseed).`);
      return;
    }
  }
  await runDemoSeed();
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
