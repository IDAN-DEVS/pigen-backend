import express, { Express } from 'express';
import morgan from 'morgan';
import { isDevelopment } from './config/env';
import { configureSecurityMiddleware } from './middleware/securityMiddleware';
import { configureErrorMiddleware } from './middleware/errorMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { router } from './routes/index';
import { logger } from './utils/logger';
import compression from 'compression';
import { configureBullBoard } from './core/queue/bullBoard';

/**
 * Create and configure Express application
 */
export const createApp = (): Express => {
  const app = express();

  // apply compression middleware
  app.use(compression());

  // Request logging middleware
  app.use(morgan(isDevelopment() ? 'dev' : 'combined'));

  // Apply rate limiting middleware
  app.use(rateLimitMiddleware());

  // Body parsing middleware
  app.use(express.json({ limit: '10kb' })); // Limit JSON body size
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Security middleware
  configureSecurityMiddleware(app);

  // Add request logging middleware
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Configure Bull Board for queue monitoring
  configureBullBoard(app);

  // Mount API routes
  const apiPrefix = '/api';
  app.use(apiPrefix, router);

  // Error handling middleware - should be configured last
  configureErrorMiddleware(app);

  return app;
};
