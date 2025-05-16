import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables from .env file
dotenv.config();

// Define environment schema with validation rules
const parseJoiInt = (defaultVal: string | number) => {
  return Joi.string()
    .default(defaultVal)
    .custom(value => parseInt(value as string));
};

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('debug'),
  PORT: parseJoiInt(4888),
  RATE_LIMIT_WINDOW_MS: parseJoiInt(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: parseJoiInt(100),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  MONGO_URI: Joi.string().required().uri(),
  REDIS_URL: Joi.string().required().uri().default('redis://localhost:6379'),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  GOOGLE_CLIENT_IDS: Joi.string().optional().allow(''),
  APPLE_CLIENT_IDS: Joi.string().optional().allow(''), // for now it'll be optional until the client ids are provided
  GEMINI_API_KEY: Joi.string().required(),
  R2_ACCOUNT_ID: Joi.string().required(),
  R2_ACCESS_KEY_ID: Joi.string().required(),
  R2_SECRET_ACCESS_KEY: Joi.string().required(),
  R2_BUCKET_NAME: Joi.string().required(),
  R2_PUBLIC_URL: Joi.string().required(),
}).unknown();

// Validate and extract environment config
const { error, value: validatedEnv } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export interface IEnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  LOG_LEVEL: string;
  PORT: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  MONGO_URI: string;
  REDIS_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  GOOGLE_CLIENT_IDS: string;
  APPLE_CLIENT_IDS?: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
  GEMINI_API_KEY: string;
}

// Create typed environment configuration
export const env: IEnvConfig = {
  NODE_ENV: validatedEnv.NODE_ENV,
  LOG_LEVEL: validatedEnv.LOG_LEVEL,
  PORT: Number(validatedEnv.PORT),
  RATE_LIMIT_WINDOW_MS: Number(validatedEnv.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQUESTS: Number(validatedEnv.RATE_LIMIT_MAX_REQUESTS),
  JWT_SECRET: validatedEnv.JWT_SECRET,
  JWT_EXPIRES_IN: validatedEnv.JWT_EXPIRES_IN,
  MONGO_URI: validatedEnv.MONGO_URI,
  REDIS_URL: validatedEnv.REDIS_URL,
  SMTP_HOST: validatedEnv.SMTP_HOST,
  SMTP_PORT: Number(validatedEnv.SMTP_PORT),
  SMTP_USER: validatedEnv.SMTP_USER,
  SMTP_PASSWORD: validatedEnv.SMTP_PASSWORD,
  GOOGLE_CLIENT_IDS: validatedEnv.GOOGLE_CLIENT_IDS,
  APPLE_CLIENT_IDS: validatedEnv.APPLE_CLIENT_IDS,
  R2_ACCOUNT_ID: validatedEnv.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: validatedEnv.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: validatedEnv.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: validatedEnv.R2_BUCKET_NAME,
  R2_PUBLIC_URL: validatedEnv.R2_PUBLIC_URL,
  GEMINI_API_KEY: validatedEnv.GEMINI_API_KEY,
};

// Helper functions for environment checks
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';
