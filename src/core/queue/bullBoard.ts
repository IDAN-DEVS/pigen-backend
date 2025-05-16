import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Express } from 'express';
import { createLogger } from '../../utils/logger';
import { emailQueueService } from './emailQueue';

const bullBoardLogger = createLogger('bullBoard');

/**
 * Create and configure Bull Board for queue monitoring
 */
export const configureBullBoard = (app: Express, basePath: string = '/admin/queues'): void => {
  bullBoardLogger.info(`Configuring Bull Board at ${basePath}`);

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(basePath);

  createBullBoard({
    queues: [new BullMQAdapter(emailQueueService.emailQueue)],
    serverAdapter,
  });

  bullBoardLogger.info('Adding Bull Board routes to Express app');
  app.use(basePath, serverAdapter.getRouter());
};
