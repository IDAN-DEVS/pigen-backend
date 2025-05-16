import { IUser, UserRoleEnum } from '../types/userType';
import { baseHelper } from '../utils/baseHelper';

/**
 * Transforms a user object for client consumption, omitting private fields unless
 * the requester is the user themselves, an admin, or the request is internal.
 */
const transform = (user: IUser, requester?: IUser, isInternal?: boolean): IUser => {
  const alwaysRemove: (keyof IUser)[] = ['password'];
  const privateData: (keyof IUser)[] = [
    'email',
    'isEmailVerified',
    'passwordUpdatedAt',
    'lastLoginAt',
  ];

  if (!user) {
    return null as unknown as IUser;
  }

  // Always work on a copy to avoid mutating the original
  let userObj = baseHelper.copyMongooseDocument(user);

  const isAdmin = requester && requester.role === UserRoleEnum.ADMIN;
  const isOwner = requester
    ? baseHelper.getMongoDbResourceId(userObj) === baseHelper.getMongoDbResourceId(requester)
    : false;

  if (!isInternal) {
    if (!isAdmin && !isOwner) {
      userObj = baseHelper.omitPaths(userObj, privateData);
    }

    // remove always remove fields
    userObj = baseHelper.omitPaths(userObj, alwaysRemove);
  }

  return userObj;
};

export const userTransformer = {
  transform,
};
