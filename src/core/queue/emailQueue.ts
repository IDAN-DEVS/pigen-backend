import { Job } from 'bullmq';
import { ISendMailOptions } from '../../types/mailType';
import { createLogger } from '../../utils/logger';
import { mailService } from '../../services/mailService';
import { createQueue, createWorker } from './baseQueue';
import { queueConstants } from '../../constants/queueConstant';

const emailQueueLogger = createLogger('emailQueue');

const emailQueue = createQueue<ISendMailOptions>(queueConstants.queueNames.email);

/**
 * Process email jobs
 */
const processEmailJob = async (job: Job<ISendMailOptions>) => {
  const { to, subject, html, attachments, headers } = job.data;

  emailQueueLogger.info(`Processing email job ${job.id}`, {
    to,
    subject,
  });

  try {
    await mailService.sendEmail(
      {
        to,
        subject,
        html,
        attachments,
        headers,
      },
      false,
    );

    emailQueueLogger.info(`Email sent successfully for job ${job.id}`);
  } catch (error) {
    emailQueueLogger.error(`Failed to send email for job ${job.id}`, error);
    throw error;
  }
};

const emailWorker = createWorker<ISendMailOptions>(
  queueConstants.queueNames.email,
  processEmailJob,
);

/**
 * Email queue service exports
 */
export const emailQueueService = {
  emailQueue,
  emailWorker,
};
