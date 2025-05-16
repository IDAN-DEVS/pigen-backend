export enum StatusCodesEnum {
  // Success Responses
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // Client Error Responses
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // Server Error Responses
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export enum ErrorCodesEnum {
  ERROR = 'ERROR',
  PASSWORD_NOT_CONFIGURED = 'PASSWORD_NOT_CONFIGURED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
}

export const StatusMessages = {
  [StatusCodesEnum.OK]: 'Success',
  [StatusCodesEnum.CREATED]: 'Created',
  [StatusCodesEnum.ACCEPTED]: 'Accepted',
  [StatusCodesEnum.NO_CONTENT]: 'No Content',
  [StatusCodesEnum.BAD_REQUEST]: 'Bad Request',
  [StatusCodesEnum.UNAUTHORIZED]: 'Unauthorized',
  [StatusCodesEnum.FORBIDDEN]: 'Forbidden',
  [StatusCodesEnum.NOT_FOUND]: 'Not Found',
  [StatusCodesEnum.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [StatusCodesEnum.CONFLICT]: 'Conflict',
  [StatusCodesEnum.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [StatusCodesEnum.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [StatusCodesEnum.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [StatusCodesEnum.NOT_IMPLEMENTED]: 'Not Implemented',
  [StatusCodesEnum.BAD_GATEWAY]: 'Bad Gateway',
  [StatusCodesEnum.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [StatusCodesEnum.GATEWAY_TIMEOUT]: 'Gateway Timeout',
};
