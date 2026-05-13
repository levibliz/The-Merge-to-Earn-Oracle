import { createApp } from './app.js';
import { loadConfig } from './config/index.js';
import { logger } from './config/logger.js';

async function main(): Promise<void> {
  const config = loadConfig();

  const app = createApp();

  app.listen(config.port, config.host, () => {
    logger.info(
      { port: config.port, host: config.host, env: config.env },
      'Merge-to-Earn Oracle server started',
    );
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
