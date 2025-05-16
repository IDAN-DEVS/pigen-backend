import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IJwtPayload } from '../types/authType';
import { logger } from './logger';
import { UserRoleEnum } from '../types/userType';
import ms from 'ms';

const generateJwtToken = (userId: string, role: UserRoleEnum, expiresIn?: string): string => {
  try {
    const payload: IJwtPayload = {
      userId,
      role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: (expiresIn || env.JWT_EXPIRES_IN) as ms.StringValue,
    });
  } catch (error: unknown) {
    const jwtError = error instanceof Error ? error : new Error(String(error));
    logger.error('Error generating JWT token', jwtError);
    throw new Error('Error generating authentication token');
  }
};

const verifyJwtToken = (token: string): IJwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as IJwtPayload;
  } catch (error: unknown) {
    const jwtError = error instanceof Error ? error : new Error(String(error));
    logger.error('Error verifying JWT token', jwtError);
    throw new Error('Invalid or expired authentication token');
  }
};

const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error: unknown) {
    const bcryptError = error instanceof Error ? error : new Error(String(error));
    logger.error('Error hashing password', bcryptError);
    throw new Error('Error processing password');
  }
};

const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error: unknown) {
    const bcryptError = error instanceof Error ? error : new Error(String(error));
    logger.error('Error comparing passwords', bcryptError);
    throw new Error('Error verifying password');
  }
};

export const authHelperUtil = {
  generateJwtToken,
  verifyJwtToken,
  hashPassword,
  comparePassword,
};
