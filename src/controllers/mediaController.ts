import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ResponseHelper } from '../core/http/response';
import { StatusCodesEnum } from '../core/http/statusCodes';
import { mediaService } from '../services/mediaService';

const uploadMedia = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return ResponseHelper.error(res, 'No files uploaded', StatusCodesEnum.BAD_REQUEST);
  }

  const result = await mediaService.uploadMedia(files);

  return ResponseHelper.success(
    res,
    result,
    'Media uploaded successfully',
    StatusCodesEnum.CREATED,
  );
});

export const mediaController = {
  uploadMedia,
};
