import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { userValidationSchema } from '../validation/schemas/userSchema';
import { validateBody } from '../middleware/validationMiddleware';
import { userController } from '../controllers/userController';

export const userRouter = Router();

userRouter.patch(
  '/update-profile',
  authenticate,
  validateBody(userValidationSchema.updateUserProfile),
  userController.updateUserProfile,
);

userRouter.get('/check-username-availability', userController.checkUsernameAvailability);
