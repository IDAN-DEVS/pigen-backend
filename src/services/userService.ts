import { userConstant } from '../constants/userConstant';
import { AppError } from '../core/errors/appError';
import { UserModel } from '../models/userModel';
import { IUpdateUserProfilePayload, IUser } from '../types/userType';
import { authHelperUtil } from '../utils/authHelper';
import { baseHelper } from '../utils/baseHelper';

const updateUserProfile = async (payload: IUpdateUserProfilePayload, user: IUser) => {
  const { password, ...rest } = payload;

  let updatePayload: Partial<IUser> = {
    ...rest,
  };

  if (payload.username) {
    // check if username is already taken
    const usernameAvailable = await checkUsernameAvailability(payload.username);
    if (!usernameAvailable) {
      throw new AppError('Username already taken');
    }
    updatePayload.usernameSlug = baseHelper.slugifyData(payload.username);
  }

  if (password) {
    updatePayload.password = await authHelperUtil.hashPassword(password);
  }

  await UserModel.updateOne({ _id: baseHelper.getMongoDbResourceId(user) }, updatePayload);
};

const checkUsernameAvailability = async (username: string) => {
  if (userConstant.reservedUsernames.includes(username.toLowerCase())) {
    return false;
  }

  const usernameRecord = await UserModel.exists({ username });
  return !usernameRecord;
};

export const userService = {
  updateUserProfile,
  checkUsernameAvailability,
};
