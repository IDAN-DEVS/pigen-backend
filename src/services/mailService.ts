import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { appConstants } from '../constants/appConstant';
import { ISendMailOptions } from '../types/mailType';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { queueConstants } from '../constants/queueConstant';
import { addJob } from '../core/queue/baseQueue';
import { emailQueueService } from '../core/queue';

export const mailerTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export const mailSender = {
  name: appConstants.appName,
  email: appConstants.smtpSenderEmail,
};

export const sendEmail = async (
  options: ISendMailOptions,
  queue: boolean = true,
  priority: number = queueConstants.queuePriority.medium,
) => {
  try {
    if (!queue) {
      const mailer = mailerTransport;

      const mailOptions: any = {
        from: `"${mailSender.name}" <${mailSender.email}>`,
        ...options,
      };

      // Convert headers format if provided
      if (options.headers && options.headers.length > 0) {
        mailOptions.headers = {};
        options.headers.forEach(header => {
          mailOptions.headers[header.key] = header.value;
        });
      }

      return mailer.sendMail(mailOptions as SMTPTransport.Options);
    } else {
      await addJob(emailQueueService.emailQueue, options, { priority });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const mailService = {
  sendEmail,
};
