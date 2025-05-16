import { appConstants } from '../constants/appConstant';
import { userConstant } from '../constants/userConstant';
import { AppError } from '../core/errors/appError';
import { UserModel } from '../models/userModel';
import { IUpdateUserProfilePayload, IUser } from '../types/userType';
import { baseHelper } from '../utils/baseHelper';
import { DateTime } from 'luxon';

const updateUserProfile = async (payload: IUpdateUserProfilePayload, user: IUser) => {
  const { username, fullName, socketId, profilePicture } = payload;

  let updatePayload: Partial<IUser> = {
    ...(fullName && { fullName }),
    ...(profilePicture && { profilePicture }),
    ...(socketId && { socketId }),
  };

  if (username) {
    // check if username is already taken
    const usernameAvailable = await checkUsernameAvailability(username);
    if (!usernameAvailable) {
      throw new AppError('Username already taken');
    }
    updatePayload.username = username; // also update username itself
    updatePayload.usernameSlug = baseHelper.slugifyData(username);
    updatePayload.usernameUpdatedAt = new Date(); // Set usernameUpdatedAt
  }

  if (Object.keys(updatePayload).length > 0) {
    // Only update if there's something to update
    await UserModel.updateOne(
      { _id: baseHelper.getMongoDbResourceId(user) },
      { $set: updatePayload },
    );
  }
};

const checkUsernameAvailability = async (username: string) => {
  if (userConstant.reservedUsernames.includes(username.toLowerCase())) {
    return false;
  }

  const usernameRecord = await UserModel.exists({ username });
  return !usernameRecord;
};

const checkAndResetDailyTokens = async (user: IUser): Promise<void> => {
  const now = DateTime.now();
  const lastReset = DateTime.fromJSDate(user.lastIdeaResetDate);

  // Check if it's a new day (comparing dates in user's timezone)
  if (!lastReset.hasSame(now, 'day')) {
    await UserModel.updateOne(
      { _id: baseHelper.getMongoDbResourceId(user) },
      {
        $set: {
          remainingIdeas: appConstants.freeTokenPerDay,
          lastIdeaResetDate: now.toJSDate(),
        },
      },
    );
  }
};

export const userService = {
  updateUserProfile,
  checkUsernameAvailability,
  checkAndResetDailyTokens,
};
