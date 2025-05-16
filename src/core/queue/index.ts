import { Queue, Worker } from 'bullmq';
import { closeQueue, closeWorker } from './baseQueue';
import { emailQueueService } from './emailQueue';
import { createLogger } from '../../utils/logger';

const queueSystemLogger = createLogger('queueSystem');

/**
 * Export all queue services
 */
export { emailQueueService };

/**
 * List of all queues and workers for management
 */
const queues: Queue[] = [emailQueueService.emailQueue];
const workers: Worker[] = [emailQueueService.emailWorker];

/**
 * Initialize the queue system
 * This ensures all workers are properly started
 */
export const initializeQueueSystem = () => {
  queueSystemLogger.info('Initializing queue system');

  try {
    // Log all available queues
    queueSystemLogger.info(
      `Initialized ${queues.length} queues: ${queues.map(q => q.name).join(', ')}`,
    );

    // Log all available workers
    queueSystemLogger.info(
      `Started ${workers.length} workers: ${workers.map(w => w.name).join(', ')}`,
    );

    queueSystemLogger.info('Queue system initialized successfully');
  } catch (error) {
    queueSystemLogger.error('Failed to initialize queue system', error);
    throw error;
  }
};

/**
 * Close all queues and workers gracefully
 */
export const closeAllQueues = async (): Promise<void> => {
  await Promise.all(queues.map(queue => closeQueue(queue)));
};

export const closeAllWorkers = async (): Promise<void> => {
  await Promise.all(workers.map(worker => closeWorker(worker)));
};

export const gracefulShutdown = async (): Promise<void> => {
  await closeAllWorkers();
  await closeAllQueues();
};
