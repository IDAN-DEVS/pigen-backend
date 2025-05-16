import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../core/errors/appError';
import { ErrorCodesEnum, StatusCodesEnum } from '../core/http/statusCodes';
import { isDevelopment } from '../config/env';
import { ResponseHelper } from '../core/http/response';
import { logger } from '../utils/logger';

/**
 * Custom error wrapper for structured logging.
 */
class StructuredError extends Error {
  constructor(
    message: string,
    public details: Record<string, any>,
  ) {
    super(message);
    this.name = 'StructuredError';
  }
}

/**
 * Error handler for Mongoose validation errors
 * Handles errors from Mongoose's built-in validation system
 */
const handleMongooseValidationError = (error: MongooseError.ValidationError): AppError => {
  try {
    // Ensure we have errors to process
    if (!error.errors || Object.keys(error.errors).length === 0) {
      return new AppError('Mongoose Validation Error', StatusCodesEnum.BAD_REQUEST, null, true);
    }

    // Extract all validation error messages with better error checking
    const errors = Object.values(error.errors).map(err => ({
      path: err.path || 'unknown',
      message: err.message || 'Invalid value',
      kind: err.kind || 'validation',
      value: err.value,
    }));

    // Log the extracted errors for debugging
    logger.debug(`Processing Mongoose validation errors: ${JSON.stringify(errors)}`);

    // Build a more descriptive message
    let detailedMessage = 'Mongoose Validation Error';

    if (errors.length > 0) {
      const firstErrors = errors.slice(0, 3);
      const errorMessages = firstErrors.map(err => `${err.path}: ${err.message}`).join(', ');
      detailedMessage = `Mongoose Validation Error: ${errorMessages}`;

      // Add indication if there are more errors
      if (errors.length > 3) {
        detailedMessage += ` (and ${errors.length - 3} more)`;
      }
    }

    return new AppError(detailedMessage, StatusCodesEnum.BAD_REQUEST, null, true, {
      errors: errors,
      count: errors.length,
    });
  } catch (err) {
    // If there's an error in our error handler, log it and return a fallback
    logger.error(
      `Error in Mongoose validation error handler: ${err instanceof Error ? err.message : String(err)}`,
    );
    return new AppError(
      'Mongoose Validation Error (processing failed)',
      StatusCodesEnum.BAD_REQUEST,
      null,
      true,
    );
  }
};

/**
 * Error handler for Joi validation errors
 * Handles validation errors from the validation middleware using Joi
 */
const handleJoiValidationError = (error: AppError): AppError => {
  try {
    if (!error.details || !error.details.errors) {
      return error; // If no errors field, just return the original error
    }

    const errors = error.details.errors;
    logger.debug(`Processing Joi validation errors: ${JSON.stringify(errors)}`);

    // Build a more descriptive message with the first 3 errors
    let detailedMessage = 'Validation Error';

    if (Array.isArray(errors) && errors.length > 0) {
      const firstErrors = errors.slice(0, 3);
      const errorMessages = firstErrors.map(err => err.message as string).join(', ');
      detailedMessage = `Validation Error: ${errorMessages}`;

      // Add indication if there are more errors
      if (errors.length > 3) {
        detailedMessage += ` (and ${errors.length - 3} more)`;
      }
    }

    return new AppError(detailedMessage, StatusCodesEnum.BAD_REQUEST, null, true, error.details);
  } catch (err) {
    logger.error(
      `Error in Joi validation error handler: ${err instanceof Error ? err.message : String(err)}`,
    );
    return error; // Return original error if processing fails
  }
};

/**
 * Error handler for Mongoose cast errors (invalid ObjectId, etc.)
 */
const handleCastError = (error: MongooseError.CastError): AppError => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, StatusCodesEnum.BAD_REQUEST, null, true, {
    path: error.path,
    value: error.value,
    kind: error.kind,
  });
};

/**
 * Error handler for MongoDB duplicate key errors
 */
const handleDuplicateKeyError = (error: any): AppError => {
  // Extract the field name and value that caused the duplicate error
  const keyPattern = error.keyPattern
    ? Object.keys(error.keyPattern as Record<string, any>)[0]
    : 'field';
  const keyValue = error.keyValue ? error.keyValue[keyPattern] : 'unknown';

  const message = `Duplicate value: '${keyValue}' for ${keyPattern} field`;
  return new AppError(message, StatusCodesEnum.CONFLICT, null, true, {
    field: keyPattern,
    value: keyValue,
  });
};

/**
 * Error handler for MongoDB transaction errors
 */
const handleTransactionError = (error: any): AppError => {
  const message = 'Transaction failed: Database operation could not be completed';
  return new AppError(message, StatusCodesEnum.INTERNAL_SERVER_ERROR, null, true, {
    originalError: isDevelopment() ? error.message : null,
  });
};

/**
 * Error handler for MongoDB connection errors
 */
const handleConnectionError = (error: any): AppError => {
  const message = 'Database connection error';
  return new AppError(message, StatusCodesEnum.SERVICE_UNAVAILABLE, null, true, {
    originalError: isDevelopment() ? error.message : null,
  });
};

/**
 * Error handler for JWT token errors
 */
const handleJWTError = (): AppError => {
  const message = 'Invalid authentication token';
  return new AppError(message, StatusCodesEnum.UNAUTHORIZED, null, true);
};

/**
 * Error handler for JWT token expiration
 */
const handleJWTExpiredError = (): AppError => {
  const message = 'Your authentication token has expired. Please log in again';
  return new AppError(message, StatusCodesEnum.UNAUTHORIZED, null, true);
};

/**
 * Error handler for multer file upload errors
 */
const handleMulterError = (error: any): AppError => {
  let message = 'File upload error';

  if (error.code === 'LIMIT_FILE_SIZE') {
    message = 'File size exceeds the allowed limit';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected file field in upload';
  } else if (error.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files uploaded';
  } else if (error.code === 'LIMIT_FIELD_COUNT') {
    message = 'Too many fields in multipart form';
  }

  return new AppError(message, StatusCodesEnum.BAD_REQUEST, null, true, {
    code: error.code,
    field: error.field,
  });
};

/**
 * Format error response for development environment
 * In development, we provide detailed error information for debugging purposes
 */
const formatErrorDev = (error: AppError | Error, req: Request, res: Response): Response => {
  const structuredError = new StructuredError('Development Error', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    statusCode:
      error instanceof AppError ? error.statusCode : StatusCodesEnum.INTERNAL_SERVER_ERROR,
    details: error instanceof AppError ? error.details : null,
  });

  logger.debug(JSON.stringify(structuredError));

  if (error instanceof AppError) {
    // Special handling for validation errors to make them more readable
    if (error.statusCode === StatusCodesEnum.BAD_REQUEST && error.details?.errors) {
      return ResponseHelper.error(res, error.message, error.statusCode, {
        errors: error.details.errors,
        errorCode: error.errorCode || ErrorCodesEnum.ERROR,
      });
    }

    // Standard AppError handling
    return ResponseHelper.error(res, error.message, error.statusCode, {
      stack: error.stack,
      details: error.details || undefined,
      isOperational: error.isOperational,
      errorCode: error.errorCode || ErrorCodesEnum.ERROR,
    });
  }

  // For non-AppError types
  return ResponseHelper.error(res, error.message, StatusCodesEnum.INTERNAL_SERVER_ERROR, {
    stack: error.stack,
  });
};

/**
 * Format error response for production environment
 * In production, we hide sensitive details but still provide useful errors for operational issues
 */
const formatErrorProd = (error: AppError | Error, req: Request, res: Response): Response => {
  // Log error for debugging but don't expose to client
  const structuredError = new StructuredError('Production Error', {
    message: error.message,
    path: req.path,
    method: req.method,
    statusCode:
      error instanceof AppError ? error.statusCode : StatusCodesEnum.INTERNAL_SERVER_ERROR,
  });

  logger.error(JSON.stringify(structuredError));

  // If it's an operational error, send appropriate details to client
  if (error instanceof AppError && error.isOperational) {
    // Special handling for validation errors in production
    if (error.statusCode === StatusCodesEnum.BAD_REQUEST && error.details?.errors) {
      return ResponseHelper.error(res, error.message, error.statusCode, {
        errors: error.details.errors,
        errorCode: error?.errorCode || ErrorCodesEnum.ERROR,
      });
    }

    // Standard operational error handling
    return ResponseHelper.error(
      res,
      error.message,
      error.statusCode,
      error.errorCode ? { errorCode: error.errorCode } : undefined,
    );
  }

  // For programming or unknown errors, don't leak error details
  return ResponseHelper.error(
    res,
    'Something went wrong. Our team has been notified.',
    StatusCodesEnum.INTERNAL_SERVER_ERROR,
    undefined,
  );
};

/**
 * Main error handler that dispatches to specialized handlers
 */
export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  let processedError = error;

  // If headers are already sent, let Express handle it
  if (res.headersSent) {
    return next(error);
  }

  // Set default status code and status
  const statusCode = error.statusCode || StatusCodesEnum.INTERNAL_SERVER_ERROR;
  processedError.statusCode = statusCode;

  // Log the incoming error for debugging
  logger.debug(`Processing error in globalErrorHandler: ${error.name} - ${error.message}`);

  // Identify and handle specific error types
  if (error instanceof MongooseError.ValidationError) {
    // Handle Mongoose validation errors
    processedError = handleMongooseValidationError(error);
  } else if (
    error instanceof AppError &&
    error.statusCode === StatusCodesEnum.BAD_REQUEST &&
    error.details &&
    error.details.errors
  ) {
    // Handle Joi validation errors (from validation middleware)
    processedError = handleJoiValidationError(error);
  } else if (error instanceof MongooseError.CastError) {
    processedError = handleCastError(error);
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    processedError = handleDuplicateKeyError(error);
  } else if (error.name === 'TransactionError') {
    processedError = handleTransactionError(error);
  } else if (error.name === 'MongooseServerSelectionError') {
    processedError = handleConnectionError(error);
  } else if (error.name === 'JsonWebTokenError') {
    processedError = handleJWTError();
  } else if (error.name === 'TokenExpiredError') {
    processedError = handleJWTExpiredError();
  } else if (error.name === 'MulterError') {
    processedError = handleMulterError(error);
  }

  // Format and send response based on environment
  return isDevelopment()
    ? formatErrorDev(processedError as AppError | Error, req, res)
    : formatErrorProd(processedError as AppError | Error, req, res);
};

/**
 * Configure error handling middleware for the Express application
 */
export const configureErrorMiddleware = (app: any): void => {
  // 404 handler for undefined routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Route not found: ${req.originalUrl}`, StatusCodesEnum.NOT_FOUND));
  });

  // Global error handler that uses our specialized handlers
  app.use(globalErrorHandler);

  // Unhandled rejection handler
  process.on('unhandledRejection', (reason: any) => {
    const error = new StructuredError('Unhandled Promise Rejection', {
      message: reason?.message || 'Unknown reason',
      stack: reason?.stack || 'No stack trace',
    });
    logger.error(JSON.stringify(error));
  });

  // Uncaught exception handler
  process.on('uncaughtException', (error: Error) => {
    const structuredError = new StructuredError('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    logger.error(JSON.stringify(structuredError));

    // For uncaught exceptions, it's safer to exit the process
    // The process manager (PM2, etc.) should restart the application
    process.exit(1);
  });
};
