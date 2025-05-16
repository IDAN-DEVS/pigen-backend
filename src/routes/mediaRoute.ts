import { Router } from 'express';
import { mediaController } from '../controllers/mediaController';
import { uploadMiddleware } from '../middleware/uploadMiddleware';
import { authenticate } from '../middleware/authMiddleware';

export const mediaRouter = Router();

mediaRouter.post(
  '/upload',
  authenticate,
  uploadMiddleware.handleMediaUpload,
  mediaController.uploadMedia,
);
