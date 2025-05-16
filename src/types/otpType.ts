export enum OtpTypeEnum {
  RESET_PASSWORD = 'reset_password',
  VERIFY_EMAIL = 'verify_email',
  VERIFY_GUEST = 'verify_guest',
  WITHDRAWAL = 'withdrawal',
}

export interface IRequestOtpPayload {
  email: string;
  type: OtpTypeEnum;
}

export interface IValidateOtpPayload {
  email: string;
  type: OtpTypeEnum;
  code: string;
  delete?: boolean;
}

export interface IOtpRequestMetadata {
  lastRequestTime: number;
  count: number;
}
