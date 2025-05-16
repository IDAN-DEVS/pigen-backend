import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../core/errors/appError';
import { StatusCodesEnum } from '../core/http/statusCodes';

// Maximum file size for any media (image or video)
const MAX_MEDIA_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_MEDIA_FILES = 5;

// Configure multer for in-memory storage
const storage = multer.memoryStorage();

// Multer for handling up to 5 media files (images or videos)
const uploadMedia = multer({
  storage,
  limits: {
    fileSize: MAX_MEDIA_SIZE,
    files: MAX_MEDIA_FILES,
  },
}).array('medias', MAX_MEDIA_FILES);

// Wrapper middleware for handling multer errors
const handleMediaUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadMedia(req, res, err => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(
            `File size exceeds the ${MAX_MEDIA_SIZE / (1024 * 1024)}MB limit`,
            StatusCodesEnum.BAD_REQUEST,
          ),
        );
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(
          new AppError(`Maximum ${MAX_MEDIA_FILES} files allowed`, StatusCodesEnum.BAD_REQUEST),
        );
      }
      return next(new AppError(`Upload error: ${err.message}`, StatusCodesEnum.BAD_REQUEST));
    }
    if (err) {
      return next(err);
    }
    next();
  });
};

export const uploadMiddleware = {
  handleMediaUpload,
};
