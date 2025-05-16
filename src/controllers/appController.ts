import { Request, Response } from 'express';
import { ResponseHelper } from '../core/http/response';
import { asyncHandler } from '../utils/asyncHandler';
import { appConstants } from '../constants/appConstant';

const getAppInfo = asyncHandler(async (req: Request, res: Response) => {
  return Promise.resolve(
    ResponseHelper.success(res, {
      appName: appConstants.appName,
      appVersion: appConstants.appVersion,
      appDescription: appConstants.appDescription,
    }),
  );
});

export const appController = {
  getAppInfo,
};
