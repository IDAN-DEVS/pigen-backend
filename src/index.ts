import { logger } from './utils/logger';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { Server } from 'http';
import { gracefulShutdown as shutdownQueues, initializeQueueSystem } from './core/queue';

const startServer = async () => {
  try {
    const app = createApp();

    await connectDatabase();
    initializeQueueSystem();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server started on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`Queue dashboard available at: http://localhost:${env.PORT}/admin/queues`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      handleShutdown(server);
    });
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      handleShutdown(server);
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

function handleShutdown(server: Server) {
  // close server
  server.close(async () => {
    logger.info('HTTP server closed');

    // Perform graceful shutdown of all services
    await Promise.all([shutdownQueues(), disconnectDatabase()]);
  });
}

// Start the server
startServer()
  .then(() => {})
  .catch(err => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
