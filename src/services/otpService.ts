import { cacheConstants } from '../constants/cacheConstant';
import { AppError } from '../core/errors/appError';
import { StatusCodesEnum } from '../core/http/statusCodes';
import { UserModel } from '../models/userModel';
import {
  IOtpRequestMetadata,
  IRequestOtpPayload,
  IValidateOtpPayload,
  OtpTypeEnum,
} from '../types/otpType';
import { IUser } from '../types/userType';
import { baseHelper } from '../utils/baseHelper';
import { cacheHelper } from '../utils/cacheHelper';
import { DateTime } from 'luxon';
import { mailService } from './mailService';
import { queueConstants } from '../constants/queueConstant';
import {
  forgotPasswordEmailTemplate,
  verifyEmailTemplate,
} from '../constants/emailTemplates/otpEmailTemplate';
import { baseEmailTemplate } from '../constants/emailTemplates/baseEmailTemplate';

const OTP_CONFIG = {
  MAX_REQUESTS_PER_DAY: 20,
  COOLDOWN_MINUTES: 1,
} as const;

const requestOtp = async (payload: IRequestOtpPayload, user?: IUser) => {
  // Validate withdrawal requests
  if (payload.type === OtpTypeEnum.WITHDRAWAL && !user) {
    throw new AppError(
      'Sorry you are not authorized to request OTP, kindly login again',
      StatusCodesEnum.FORBIDDEN,
    );
  }

  const email = payload.type === OtpTypeEnum.WITHDRAWAL ? user!.email : payload.email;
  const normalizedEmail = email.trim().toLowerCase();

  // Verify user exists
  const emailExists = await UserModel.exists({ email: normalizedEmail });
  if (!emailExists) {
    throw new AppError('Invalid email', StatusCodesEnum.NOT_FOUND);
  }

  // Check rate limiting and daily limits
  await validateOtpRequests(normalizedEmail);

  // Generate and send OTP
  await sendOtp({
    ...payload,
    email: normalizedEmail,
  });

  return;
};

const validateOtpRequests = async (email: string) => {
  const metadataKey = cacheConstants.cacheKeys.otpRequestCount(email);

  // Get metadata about previous requests
  const metadata: IOtpRequestMetadata = (await cacheHelper.getCache(metadataKey)) || {
    lastRequestTime: 0,
    count: 0,
  };

  // Check cooldown period
  const timeSinceLastRequest = DateTime.now().diff(
    DateTime.fromMillis(metadata.lastRequestTime),
    'minutes',
  ).minutes;

  if (timeSinceLastRequest < OTP_CONFIG.COOLDOWN_MINUTES) {
    const waitTime = Math.ceil(OTP_CONFIG.COOLDOWN_MINUTES - timeSinceLastRequest);
    throw new AppError(
      `Please wait ${waitTime} minute${waitTime > 1 ? 's' : ''} before requesting another OTP`,
      StatusCodesEnum.TOO_MANY_REQUESTS,
    );
  }

  // Check daily limit
  const now = DateTime.now();
  const startOfDay = now.startOf('day');

  if (metadata.lastRequestTime < startOfDay.toMillis()) {
    // Reset counter for new day
    metadata.count = 0;
  }

  if (metadata.count >= OTP_CONFIG.MAX_REQUESTS_PER_DAY) {
    const nextDay = startOfDay.plus({ days: 1 });
    const hoursRemaining = Math.ceil(nextDay.diff(now, 'hours').hours);

    throw new AppError(
      `Daily OTP limit reached. Please try again in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.`,
      StatusCodesEnum.TOO_MANY_REQUESTS,
    );
  }

  // Update metadata
  metadata.count += 1;
  metadata.lastRequestTime = Date.now();

  // Store updated metadata
  await cacheHelper.setCache(metadataKey, metadata, cacheConstants.cacheExpiry.aDay);
};

const sendOtp = async (payload: IRequestOtpPayload) => {
  const { email, type } = payload;

  const code = baseHelper.generateOTP(6);

  const templates = {
    [OtpTypeEnum.RESET_PASSWORD]: {
      template: forgotPasswordEmailTemplate({ code }),
      subject: 'Reset Your Password',
      priority: queueConstants.queuePriority.high,
    },
    [OtpTypeEnum.VERIFY_EMAIL]: {
      template: verifyEmailTemplate({ code }),
      subject: 'Verify Email',
      priority: queueConstants.queuePriority.high,
    },
    [OtpTypeEnum.WITHDRAWAL]: {
      template: baseEmailTemplate({
        title: 'Withdrawal OTP',
        content: `Your withdrawal OTP is ${code}`,
      }),
      subject: 'Withdrawal OTP',
      priority: queueConstants.queuePriority.low,
    },
  };

  const { template, subject, priority } = templates[type as keyof typeof templates];

  // Store OTP
  const otpCacheKey = cacheConstants.cacheKeys.otpRequest(email, type);
  await cacheHelper.setCache(otpCacheKey, code, cacheConstants.cacheExpiry.fiveMinutes);

  await mailService.sendEmail(
    {
      to: email,
      subject: subject,
      html: template,
    },
    true,
    priority,
  );
};

const validateOtp = async (payload: IValidateOtpPayload) => {
  const otpCacheKey = cacheConstants.cacheKeys.otpRequest(payload.email, payload.type);
  const cachedOtp = await cacheHelper.getCache(otpCacheKey);

  if (!cachedOtp) {
    throw new AppError('Invalid Or Expired OTP', StatusCodesEnum.BAD_REQUEST);
  }

  if (Number(cachedOtp) !== Number(payload.code)) {
    throw new AppError('Invalid OTP', StatusCodesEnum.BAD_REQUEST);
  }

  if (payload.delete) {
    await cacheHelper.removeFromCache(otpCacheKey);
  }

  return true;
};

export const otpService = {
  requestOtp,
  sendOtp,
  validateOtp,
};
