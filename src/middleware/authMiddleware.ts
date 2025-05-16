import { NextFunction, Response } from 'express';
import { IAuthRequest } from '../types/authType';
import { UserModel } from '../models/userModel';
import { logger } from '../utils/logger';
import { AppError } from '../core/errors/appError';
import { authHelperUtil } from '../utils/authHelper';
import { UserRoleEnum } from '../types/userType';
import { StatusCodesEnum } from '../core/http/statusCodes';

export const authenticate = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(
      'Authentication required. Please provide a valid token.',
      StatusCodesEnum.UNAUTHORIZED,
    );
  }

  // Extract token from header
  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = authHelperUtil.verifyJwtToken(token);

    // Find user by ID
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      throw new AppError(
        'User associated with this token no longer exists.',
        StatusCodesEnum.UNAUTHORIZED,
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error(
      'Token verification failed',
      error instanceof Error ? error : new Error(String(error)),
    );
    throw new AppError(
      'Invalid or expired token. Please authenticate again.',
      StatusCodesEnum.UNAUTHORIZED,
    );
  }
};

export const authorize = (allowedRoles: UserRoleEnum[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(
        'Authentication required. Please login first.',
        StatusCodesEnum.UNAUTHORIZED,
      );
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError(
        "You don't have permission to access this resource.",
        StatusCodesEnum.FORBIDDEN,
      );
    }

    next();
  };
};

// Shorthand middleware for admin-only routes
export const adminOnly = authorize([UserRoleEnum.ADMIN]);

/**
 * Optional authentication middleware
 *
 * This middleware attempts to authenticate the user, but continues
 * the request even if authentication fails. Useful for routes that
 * can work with or without authentication.
 */
export const optionalAuth = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = authHelperUtil.verifyJwtToken(token);
      const user = await UserModel.findById(decoded.userId);

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail and continue without authenticated user
      logger.debug('Optional authentication failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    next();
  } catch (error) {
    // Continue without authentication in case of error
    logger.error(
      'Optional auth middleware error',
      error instanceof Error ? error : new Error(String(error)),
    );
    next();
  }
};
