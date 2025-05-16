import { ResponseHelper } from '../core/http/response';
import { userService } from '../services/userService';
import { IAuthRequest } from '../types/authType';
import { IUpdateUserProfilePayload, IUser } from '../types/userType';
import { asyncHandler } from '../utils/asyncHandler';
import { Response } from 'express';

const updateUserProfile = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const payload: IUpdateUserProfilePayload = req.body;
  const user = req.user as IUser;

  await userService.updateUserProfile(payload, user);

  return ResponseHelper.success(res, null, 'Profile updated successfully', 200);
});

const checkUsernameAvailability = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { username } = req.query as { username: string };

  if (!username) {
    return ResponseHelper.error(res, 'Username is required', 400);
  }

  const isAvailable = await userService.checkUsernameAvailability(username);

  return ResponseHelper.success(res, { isAvailable }, 'Username is available', 200);
});

export const userController = {
  updateUserProfile,
  checkUsernameAvailability,
};
