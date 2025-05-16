import { Queue, Worker, Job, QueueOptions, WorkerOptions, JobsOptions } from 'bullmq';
import { createLogger } from '../../utils/logger';
import { appConstants } from '../../constants/appConstant';
import { env } from '../../config/env';
import { redisClient } from '../../utils/cacheHelper';

const queueLogger = createLogger('queue');

/**
 * Default options for queues
 */
export const defaultQueueOptions: QueueOptions = {
  connection: redisClient,
  prefix: `${appConstants.appName}:${env.NODE_ENV}`,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60 * 1000, // 24 hours
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60 * 1000, // 7 days
      count: 200, // Keep last 200 failed jobs
    },
  },
};

/**
 * Default options for workers
 */
export const defaultWorkerOptions: WorkerOptions = {
  connection: redisClient,
  prefix: `${appConstants.appName}:${env.NODE_ENV}`,
  autorun: true, // Automatically start the worker when created
  concurrency: 5, // Process 5 jobs at a time
  lockDuration: 10000, // 10 seconds lock
};

/**
 * Create a queue with the given name and options
 */
export const createQueue = <T = any>(
  name: string,
  options: Partial<QueueOptions> = {},
): Queue<T> => {
  const queue = new Queue<T>(name, {
    ...defaultQueueOptions,
    ...options,
  });

  // Log queue events
  queue.on('error', error => {
    queueLogger.error(`Queue ${name} error`, error);
  });

  queueLogger.info(`Queue ${name} created`);
  return queue;
};

/**
 * Create a worker for processing jobs from a queue
 */
export const createWorker = <T = any, R = any>(
  queueName: string,
  processor: (job: Job<T>) => Promise<R>,
  options: Partial<WorkerOptions> = {},
): Worker<T, R> => {
  const worker = new Worker<T, R>(
    queueName,
    async job => {
      queueLogger.debug(`Processing job ${job.id} of type ${queueName}`, {
        data: job.data,
        attemptsMade: job.attemptsMade,
      });

      try {
        const result = await processor(job);
        queueLogger.debug(`Job ${job.id} of type ${queueName} completed`, {
          result,
        });
        return result;
      } catch (error) {
        queueLogger.error(`Job ${job.id} of type ${queueName} failed`, error, {
          data: job.data,
          attemptsMade: job.attemptsMade,
        });
        throw error;
      }
    },
    {
      ...defaultWorkerOptions,
      ...options,
    },
  );

  // Log worker events
  worker.on('error', error => {
    queueLogger.error(`Worker for queue ${queueName} error`, error);
  });

  worker.on('failed', (job, error) => {
    queueLogger.error(
      `Job ${job?.id} in queue ${queueName} failed with ${job?.attemptsMade} attempts`,
      error,
      { jobData: job?.data },
    );
  });

  worker.on('completed', job => {
    queueLogger.debug(`Job ${job.id} in queue ${queueName} completed successfully`);
  });

  queueLogger.info(`Worker for queue ${queueName} created`);
  return worker;
};

/**
 * Add a job to a queue with the given data and options
 */
export const addJob = async (
  queue: Queue,
  data: any,
  options: Partial<JobsOptions> = {},
): Promise<Job> => {
  const jobName = `job-${Date.now()}`;
  const job = await queue.add(jobName, data, {
    ...defaultQueueOptions.defaultJobOptions,
    ...options,
  });

  queueLogger.debug(`Job ${job.id} added to queue ${queue.name}`, { data });
  return job;
};

/**
 * Close a queue gracefully
 */
export const closeQueue = async (queue: Queue): Promise<void> => {
  queueLogger.info(`Closing queue ${queue.name}`);
  await queue.close();
};

/**
 * Close a worker gracefully
 */
export const closeWorker = async (worker: Worker): Promise<void> => {
  queueLogger.info(`Closing worker for queue ${worker.name}`);
  await worker.close();
};
