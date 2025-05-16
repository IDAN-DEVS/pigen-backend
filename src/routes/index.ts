import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { appRouter } from './appRoute';
import { authRouter } from './authRoute';
import { ResponseHelper } from '../core/http/response';
import { otpRouter } from './otpRoute';
import { userRouter } from './userRoute';
import { mediaRouter } from './mediaRoute';

// Create the main router
export const router = Router();

/**
 * Health check endpoint
 * Used for monitoring and ensuring the API is running
 */
router.get(
  '/health',
  asyncHandler(async (_, res) => {
    return Promise.resolve(
      ResponseHelper.success(res, {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }),
    );
  }),
);

router.use('/auth', authRouter);
router.use('/app', appRouter);
router.use('/otp', otpRouter);
router.use('/user', userRouter);
router.use('/media', mediaRouter);
