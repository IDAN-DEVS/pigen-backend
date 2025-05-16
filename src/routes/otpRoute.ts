import { Router } from 'express';
import { validateBody } from '../middleware/validationMiddleware';
import { otpValidationSchema } from '../validation/schemas/otpSchema';
import { optionalAuth } from '../middleware/authMiddleware';
import { otpController } from '../controllers/otpController';

export const otpRouter = Router();

otpRouter.post(
  '/request',
  validateBody(otpValidationSchema.requestOtp),
  optionalAuth,
  otpController.requestOtp,
);

otpRouter.post(
  '/validate',
  validateBody(otpValidationSchema.validateOtp),
  optionalAuth,
  otpController.validateOtp,
);
