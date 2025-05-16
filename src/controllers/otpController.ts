import { ResponseHelper } from '../core/http/response';
import { otpService } from '../services/otpService';
import { IAuthRequest } from '../types/authType';
import { IRequestOtpPayload, IValidateOtpPayload } from '../types/otpType';
import { asyncHandler } from '../utils/asyncHandler';
import { Response } from 'express';

const requestOtp = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const payload: IRequestOtpPayload = req.body;
  const data = await otpService.requestOtp(payload, req.user);
  return ResponseHelper.success(res, data, 'OTP sent successfully');
});

const validateOtp = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const payload: IValidateOtpPayload = req.body;
  const data = await otpService.validateOtp(payload);
  return ResponseHelper.success(res, data, 'OTP validated successfully');
});

export const otpController = {
  requestOtp,
  validateOtp,
};
