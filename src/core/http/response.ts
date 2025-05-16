import { Response as ExpressResponse } from 'express';
import { StatusCodesEnum, StatusMessages } from './statusCodes';

interface ErrorResponse {
  message?: string;
  errorCode?: string;
  errors?: any[];
  stack?: string;
  details?: Record<string, any>;
  isOperational?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: ErrorResponse | null;
  timestamp: string;
}

export const ResponseHelper = {
  success<T>(
    res: ExpressResponse,
    data?: T,
    message: string = StatusMessages[StatusCodesEnum.OK],
    statusCode: number = StatusCodesEnum.OK,
  ): ExpressResponse {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  },

  error(
    res: ExpressResponse,
    message: string = StatusMessages[StatusCodesEnum.INTERNAL_SERVER_ERROR],
    statusCode: number = StatusCodesEnum.INTERNAL_SERVER_ERROR,
    error?: ErrorResponse | null,
  ): ExpressResponse {
    const response: ApiResponse<null> = {
      success: false,
      message,
      error: error || null,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  },

  created<T>(
    res: ExpressResponse,
    data?: T,
    message: string = StatusMessages[StatusCodesEnum.CREATED],
  ): ExpressResponse {
    return this.success(res, data, message, StatusCodesEnum.CREATED);
  },

  notFound(
    res: ExpressResponse,
    message: string = StatusMessages[StatusCodesEnum.NOT_FOUND],
  ): ExpressResponse {
    return this.error(res, message, StatusCodesEnum.NOT_FOUND);
  },

  badRequest(
    res: ExpressResponse,
    message: string = StatusMessages[StatusCodesEnum.BAD_REQUEST],
    error: ErrorResponse | null = null,
  ): ExpressResponse {
    return this.error(res, message, StatusCodesEnum.BAD_REQUEST, error);
  },

  unauthorized(
    res: ExpressResponse,
    message: string = StatusMessages[StatusCodesEnum.UNAUTHORIZED],
  ): ExpressResponse {
    return this.error(res, message, StatusCodesEnum.UNAUTHORIZED);
  },

  forbidden(
    res: ExpressResponse,
    message: string = StatusMessages[StatusCodesEnum.FORBIDDEN],
  ): ExpressResponse {
    return this.error(res, message, StatusCodesEnum.FORBIDDEN);
  },
};
