import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateBody } from '../middleware/validationMiddleware';
import { authValidationSchema } from '../validation/schemas/authSchema';

export const authRouter = Router();

authRouter.post('/register', validateBody(authValidationSchema.register), authController.register);

authRouter.post('/login', validateBody(authValidationSchema.login), authController.login);

authRouter.post(
  '/social',
  validateBody(authValidationSchema.socialAuth),
  authController.socialAuth,
);

authRouter.post(
  '/verify-email',
  validateBody(authValidationSchema.verifyEmail),
  authController.verifyEmail,
);

authRouter.post(
  '/reset-password',
  validateBody(authValidationSchema.resetPassword),
  authController.resetPassword,
);
