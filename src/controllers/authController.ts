import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { ResponseHelper } from '../core/http/response';
import {
  IEmailLoginRequest,
  IRegisterPayload,
  IResetPasswordPayload,
  ISocialAuthPayload,
  IVerifyEmailRequest,
} from '../types/authType';
import { StatusCodesEnum } from '../core/http/statusCodes';

const register = asyncHandler(async (req: Request, res: Response) => {
  const payload: IRegisterPayload = req.body;

  const result = await authService.registerWithEmail(payload);

  const msg = result.user.isEmailVerified
    ? 'Registered successfully'
    : 'Registered successfully, please verify your email';

  return ResponseHelper.success(res, result, msg, 201);
});

const login = asyncHandler(async (req: Request, res: Response) => {
  const payload: IEmailLoginRequest = req.body;

  const result = await authService.loginWithEmail(payload);

  return ResponseHelper.success(res, result, 'Logged in successfully', 200);
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const payload: IVerifyEmailRequest = req.body;
  await authService.verifyEmail(payload);

  return ResponseHelper.success(res, null, 'Email verified successfully', 200);
});

const socialAuth = asyncHandler(async (req: Request, res: Response) => {
  const payload: ISocialAuthPayload = req.body;

  const result = await authService.socialAuth(payload);

  return ResponseHelper.success(res, result, 'Authenticated successfully', 200);
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const payload: IResetPasswordPayload = req.body;
  await authService.resetPassword(payload);
  return ResponseHelper.success(res, null, 'Password reset successfully', StatusCodesEnum.OK);
});

export const authController = {
  register,
  login,
  verifyEmail,
  socialAuth,
  resetPassword,
};
