import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../core/errors/appError';
import { logger } from '../utils/logger';
import { StatusCodesEnum } from '../core/http/statusCodes';

/**
 * Types of request data to validate
 */
type ValidationType = 'body' | 'params' | 'query' | 'headers';

/**
 * Enhanced validation options
 */
interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  allowUnknown?: boolean;
}

/**
 * Default validation options
 */
const defaultOptions: ValidationOptions = {
  abortEarly: false, // Returns all errors, not just the first one
  stripUnknown: true, // Removes unknown keys from the validated data
  allowUnknown: false, // Does not allow keys not defined in the schema
};

/**
 * Request schema validation middleware
 * Uses Joi to validate request data against a schema
 *
 * @param schema The Joi validation schema
 * @param type The request property to validate (body, params, query, headers)
 * @param options Joi validation options
 * @returns Express middleware function
 */
export const validate = (
  schema: Joi.Schema,
  type: ValidationType = 'body',
  options: ValidationOptions = defaultOptions,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the data to validate based on the type
    const data = req[type];

    // Validate the data against the schema
    const { error, value } = schema.validate(data, options);

    if (error) {
      logger.warn(`Validation error on ${req.method} ${req.path}`, {
        errors: error.details.map(detail => detail.message),
        path: req.path,
        data,
      });

      // Create a validation error with details
      return next(
        new AppError('Validation Error', StatusCodesEnum.BAD_REQUEST, null, true, {
          errors: error.details.map(detail => ({
            message: detail.message,
            path: detail.path.join('.'),
          })),
        }),
      );
    }

    // Update the request data with the validated value
    if (type === 'query') {
      Object.keys(value).forEach(key => {
        req.query[key] = value[key];
      });
    } else {
      req[type] = value;
    }

    next();
  };
};

/**
 * Convenience function to validate request body
 */
export const validateBody = (schema: Joi.Schema, options?: ValidationOptions) =>
  validate(schema, 'body', options);

/**
 * Convenience function to validate request params
 */
export const validateParams = (schema: Joi.Schema, options?: ValidationOptions) =>
  validate(schema, 'params', options);

/**
 * Convenience function to validate request query
 */
export const validateQuery = (schema: Joi.Schema, options?: ValidationOptions) =>
  validate(schema, 'query', options);

/**
 * Convenience function to validate request headers
 */
export const validateHeaders = (schema: Joi.Schema, options?: ValidationOptions) =>
  validate(schema, 'headers', options);

/**
 * Combine multiple validation middlewares into a single middleware
 */
export const validateRequest = (
  validations: Array<(req: Request, res: Response, next: NextFunction) => void>,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const validation of validations) {
        await new Promise<void>((resolve, reject) => {
          validation(req, res, err => {
            if (err) return reject(err as Error);
            resolve();
          });
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
