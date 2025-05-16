import { AppError } from '../core/errors/appError';
import { StatusCodesEnum } from '../core/http/statusCodes';
import { ICloudflareUploadFile } from '../types/cloudflareMediaHelperType';
import { uploadMultipleFiles } from '../utils/cloudflareMediaHelper';

const uploadMedia = async (files: Express.Multer.File[]) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new AppError('No media files uploaded', StatusCodesEnum.BAD_REQUEST);
  }

  if (files.length > 5) {
    throw new AppError('Maximum 5 files allowed', StatusCodesEnum.BAD_REQUEST);
  }

  // Validate file type
  // Accept images, videos, PDFs, and Word documents
  const validMimeTypes = ['image/', 'video/', 'application/pdf', 'application/msword'];
  if (files.some(file => !validMimeTypes.some(type => file.mimetype.startsWith(type)))) {
    console.error(
      'Invalid file type',
      files.map(file => file.mimetype),
    );
    throw new AppError('Invalid File', StatusCodesEnum.BAD_REQUEST);
  }

  // Prepare files for upload
  const uploadFiles: ICloudflareUploadFile[] = files.map(file => ({
    fileName: file.originalname,
    mimetype: file.mimetype,
    buffer: file.buffer,
  }));

  // Upload to Cloudflare R2
  const result = await uploadMultipleFiles(uploadFiles);

  return result.map(res => res.mediaUrl);
};

export const mediaService = {
  uploadMedia,
};
