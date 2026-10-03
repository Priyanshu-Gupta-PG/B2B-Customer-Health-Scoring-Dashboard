import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./infrastructure/logger.js";
import { prisma } from "./infrastructure/prisma.js";
import { startCron } from "./workers/cronManager.js";

async function main() {
  await prisma.$connect();
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
