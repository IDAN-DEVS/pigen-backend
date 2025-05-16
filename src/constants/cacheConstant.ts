import { env } from '../config/env';
import { OtpTypeEnum } from '../types/otpType';
import { appConstants } from './appConstant';

const cacheExpiry = {
  oneMinute: 60,
  fiveMinutes: 60 * 5,
  fifteenMinutes: 60 * 15,
  thirtyMinutes: 60 * 30,
  oneHour: 60 * 60,
  twoHours: 60 * 60 * 2,
  threeHours: 60 * 60 * 3,
  fiveHours: 60 * 60 * 5,
  aDay: 60 * 60 * 24,
  aWeek: 60 * 60 * 24 * 7,
  aMonth: 60 * 60 * 24 * 30,
  aYear: 60 * 60 * 24 * 365,
};

const cacheKeyPrefix = `${appConstants.appName}:${env.NODE_ENV}:`;
const addCacheKey = (key: string) => `${cacheKeyPrefix}${key}`;

export const cacheKeys = {
  otpRequestCount: (email: string) => addCacheKey(`otpRequestCount:${email}`),
  otpRequest: (email: string, type: OtpTypeEnum) => addCacheKey(`otpRequest:${email}:${type}`),
};

export const cacheConstants = {
  cacheExpiry,
  cacheKeys,
};
