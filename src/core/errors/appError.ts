import { StatusCodesEnum } from '../http/statusCodes';

/**
 * Custom application error class
 * Extends the built-in Error class with additional properties for API error handling
 */
export class AppError extends Error {
  /**
   * HTTP status code for the error
   */
  public statusCode: number;

  /**
   * Whether this is an operational error (expected) or a programming error (unexpected)
   */
  public isOperational: boolean;

  /**
   * Additional error details for debugging
   */
  public details: Record<string, any> | null;

  /**
   * Error code for client-side error handling
   */
  public errorCode: string | null;

  constructor(
    message: string,
    statusCode: number = StatusCodesEnum.INTERNAL_SERVER_ERROR,
    errorCode: string | null = null,
    isOperational: boolean = true,
    details: Record<string, any> | null = null,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.errorCode = errorCode;

    // Capture stack trace for better debugging
    Error.captureStackTrace(this, this.constructor);
  }
}
