import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./infrastructure/logger.js";
import { prisma } from "./infrastructure/prisma.js";
import { seedIfEmpty } from "./bootstrap/demoSeed.js";
import { startCron } from "./workers/cronManager.js";

async function main() {
  await prisma.$connect();

  // Free Render has no Shell — auto-seed empty DBs on boot from the Vercel mock sites.
  if (process.env.SEED_ON_BOOT !== "false") {
    try {
      const result = await seedIfEmpty();
      if (result.seeded) logger.info("Boot seed finished");
    } catch (err) {
      logger.error({ err }, "Boot seed failed — API will start anyway");
    }
  }

  startCron();
  const app = createApp();
  app.listen(config.port, () => {
    logger.info({ port: config.port }, "express api listening");
  });
}

main().catch((err) => {
  logger.fatal({ err }, "failed to start");
  process.exit(1);
});
