import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Buffer } from 'buffer';
import { env } from '../config/env';
import { ICloudflareUploadFile } from '../types/cloudflareMediaHelperType';
import { AppError } from '../core/errors/appError';
import { logger } from './logger';
import { baseHelper } from './baseHelper';
import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import * as os from 'os';
import { promisify } from 'util';

// Import ffmpeg-static path for fluent-ffmpeg
import ffmpegPath from 'ffmpeg-static';
import { appConstants } from '../constants/appConstant';

// Configure ffmpeg to use the static binary
ffmpeg.setFfmpegPath(ffmpegPath as string);

// Utility functions for file operations
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Ensure temp directory exists
const TMP_DIR = path.join(os.tmpdir(), `${appConstants.appName.toLowerCase()}-media-processing`);
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Optimize Sharp performance globally
sharp.cache(false); // Disable cache to reduce memory usage
sharp.concurrency(Math.max(1, Math.min(4, os.cpus().length))); // Optimal CPU use

// Configure S3 client with optimized settings
export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
  retryMode: 'adaptive',
});

// Image format quality presets - adjust based on needs
const FORMAT_OPTIONS = {
  jpeg: { quality: 80, progressive: true, mozjpeg: true },
  webp: { quality: 75, alphaQuality: 80, lossless: false },
  png: { compressionLevel: 9, quality: 80 },
  avif: { quality: 60, speed: 5 },
};

// Video format settings
const VIDEO_PRESETS = {
  mp4: {
    codec: 'libx264',
    preset: 'medium', // Balance between speed and compression
    crf: 23, // Lower = better quality, higher = better compression
    maxBitrate: '1500k',
    audioBitrate: '128k',
    audioCodec: 'aac',
    maxWidth: 1280,
    maxHeight: 720,
  },
  webm: {
    codec: 'libvpx-vp9',
    crf: 30,
    maxBitrate: '1000k',
    audioBitrate: '128k',
    audioCodec: 'libopus',
    maxWidth: 1280,
    maxHeight: 720,
  },
};

/**
 * Selects the optimal output format based on mime type
 * @param mimeType Original image mime type
 * @returns Object with target format and extension
 */
function selectOptimalFormat(mimeType: string): {
  format: keyof typeof FORMAT_OPTIONS;
  extension: string;
} {
  // Default to jpeg for most images
  let format: keyof typeof FORMAT_OPTIONS = 'jpeg';
  let extension = '.jpg';

  // If it's already webp, keep it webp
  if (mimeType === 'image/webp') {
    return { format: 'webp', extension: '.webp' };
  }

  // For transparent images, use webp or png
  if (mimeType === 'image/png' || mimeType === 'image/gif') {
    // WebP is better for web delivery
    return { format: 'webp', extension: '.webp' };
  }

  return { format, extension };
}

/**
 * Optimizes an image buffer based on size and content
 */
async function optimizeImage(
  buffer: Buffer,
  mimeType: string,
  maxSizeInBytes: number = 1024 * 1024,
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { buffer, mimeType, extension: '.jpg' };
  }

  // Skip optimization for small files
  if (buffer.length <= maxSizeInBytes / 2) {
    return {
      buffer,
      mimeType,
      extension:
        mimeType === 'image/jpeg'
          ? '.jpg'
          : mimeType === 'image/png'
            ? '.png'
            : mimeType === 'image/webp'
              ? '.webp'
              : mimeType === 'image/gif'
                ? '.gif'
                : '.jpg',
    };
  }

  try {
    // Get image metadata without full decode
    const metadata = await sharp(buffer).metadata();

    // Skip processing for tiny images
    if (
      (metadata.width || 0) < 500 &&
      (metadata.height || 0) < 500 &&
      buffer.length < maxSizeInBytes / 2
    ) {
      return {
        buffer,
        mimeType,
        extension:
          mimeType === 'image/jpeg'
            ? '.jpg'
            : mimeType === 'image/png'
              ? '.png'
              : mimeType === 'image/webp'
                ? '.webp'
                : mimeType === 'image/gif'
                  ? '.gif'
                  : '.jpg',
      };
    }

    // Choose optimal output format
    const { format, extension } = selectOptimalFormat(mimeType);

    // Calculate reasonable dimensions (max 2000px but maintain aspect ratio)
    const MAX_DIM = 2000;
    let resizeOptions = {};

    if ((metadata.width || 0) > MAX_DIM || (metadata.height || 0) > MAX_DIM) {
      resizeOptions = {
        width: Math.min(metadata.width || MAX_DIM, MAX_DIM),
        height: Math.min(metadata.height || MAX_DIM, MAX_DIM),
        fit: 'inside',
        withoutEnlargement: true,
      };
    }

    // Process the image with optimal settings
    const optimizedBuffer = await sharp(buffer)
      .resize(resizeOptions)
      [format](FORMAT_OPTIONS[format])
      .toBuffer();

    return {
      buffer: optimizedBuffer,
      mimeType: `image/${format}`,
      extension,
    };
  } catch (error) {
    logger.error('Image optimization error:', error);
    return { buffer, mimeType, extension: '.jpg' };
  }
}

/**
 * Optimizes a video file with ffmpeg
 * @param buffer Video buffer
 * @param mimeType Video mime type
 * @returns Promise with optimized video buffer and metadata
 */
async function optimizeVideo(
  buffer: Buffer,
  mimeType: string,
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  // Create a unique temporary file path
  const tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  const inputPath = path.join(TMP_DIR, `input_${tempId}.mp4`);
  let outputPath = path.join(TMP_DIR, `output_${tempId}.mp4`);
  let targetFormat = 'mp4';
  let targetMimeType = 'video/mp4';
  let extension = '.mp4';

  try {
    // Write buffer to temporary file
    await writeFileAsync(inputPath, buffer);

    // Skip optimization for very small videos (under 2MB)
    if (buffer.length < 2 * 1024 * 1024) {
      logger.info(`Skipping optimization for small video (${buffer.length / 1024 / 1024} MB)`);
      await unlinkAsync(inputPath);
      return {
        buffer,
        mimeType,
        extension: mimeType.includes('mp4') ? '.mp4' : '.webm',
      };
    }

    // Get video info - this is where ffprobe error occurs
    let videoInfo;
    try {
      videoInfo = await getVideoInfo(inputPath);
    } catch (ffprobeError) {
      logger.error('FFprobe not found or failed, skipping video optimization:', ffprobeError);
      await unlinkAsync(inputPath);
      return {
        buffer,
        mimeType,
        extension: mimeType.includes('mp4') ? '.mp4' : '.webm',
      };
    }

    // Choose output format
    if (mimeType.includes('webm')) {
      targetFormat = 'webm';
      targetMimeType = 'video/webm';
      extension = '.webm';
      outputPath = path.join(TMP_DIR, `output_${tempId}.webm`);
    }

    const preset = VIDEO_PRESETS[targetFormat as keyof typeof VIDEO_PRESETS];

    // Calculate target dimensions while maintaining aspect ratio
    const { width, height } = calculateVideoDimensions(
      videoInfo.width || 1280,
      videoInfo.height || 720,
      preset.maxWidth,
      preset.maxHeight,
    );

    logger.info(
      `Optimizing video: ${buffer.length / 1024 / 1024} MB, ${
        videoInfo.width
      }x${videoInfo.height} to ${width}x${height}`,
    );

    // Process the video with more aggressive compression
    await new Promise<void>((resolve, reject) => {
      let outputOptions = [
        `-c:v ${preset.codec}`,
        `-b:v ${preset.maxBitrate}`,
        `-c:a ${preset.audioCodec}`,
        `-b:a ${preset.audioBitrate}`,
        '-movflags +faststart', // Optimize for web streaming
        `-vf scale=${width}:${height}`,
      ];

      // Add format-specific options as separate array elements
      if (targetFormat === 'mp4') {
        outputOptions.push(`-preset ${(preset as typeof VIDEO_PRESETS.mp4).preset}`);
        outputOptions.push(`-crf ${preset.crf + 2}`);
      } else {
        outputOptions.push(`-crf ${preset.crf + 2}`);
        outputOptions.push('-deadline good');
        outputOptions.push('-cpu-used 2');
      }

      const command = ffmpeg(inputPath).outputOptions(outputOptions).output(outputPath);

      command.on('end', () => {
        logger.info(`Video optimization completed: ${outputPath}`);
        resolve();
      });
      command.on('error', err => {
        logger.error(`Video optimization error: ${err.message}`);
        reject(err);
      });
      command.run();
    });

    // Read the processed video back to buffer
    const optimizedBuffer = await fs.promises.readFile(outputPath);
    logger.info(`Optimized video size: ${optimizedBuffer.length / 1024 / 1024} MB`);

    // Cleanup temporary files
    await Promise.all([
      unlinkAsync(inputPath).catch(() => {}),
      unlinkAsync(outputPath).catch(() => {}),
    ]);

    return {
      buffer: optimizedBuffer,
      mimeType: targetMimeType,
      extension,
    };
  } catch (error) {
    logger.error('Video optimization error:', error);

    // Cleanup temporary files on error
    try {
      await Promise.all([
        fs.existsSync(inputPath) ? unlinkAsync(inputPath) : Promise.resolve(),
        fs.existsSync(outputPath) ? unlinkAsync(outputPath) : Promise.resolve(),
      ]);
    } catch (cleanupError) {
      logger.error('Error cleaning up temporary files:', cleanupError);
    }

    // Return original buffer if optimization fails
    return {
      buffer,
      mimeType,
      extension: mimeType.includes('mp4') ? '.mp4' : '.webm',
    };
  }
}

/**
 * Get video information using ffmpeg
 */
async function getVideoInfo(
  filePath: string,
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');

      if (!videoStream) {
        return reject(new Error('No video stream found'));
      }

      resolve({
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        duration: metadata.format.duration || 0,
      });
    });
  });
}

/**
 * Calculate video dimensions maintaining aspect ratio
 */
function calculateVideoDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  // If dimensions are already smaller than max, return original
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;

  // Calculate new dimensions
  let newWidth = maxWidth;
  let newHeight = Math.round(maxWidth / aspectRatio);

  // If new height exceeds max height, recalculate using height as constraint
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = Math.round(maxHeight * aspectRatio);
  }

  // Make dimensions even (required by some codecs)
  newWidth = newWidth - (newWidth % 2);
  newHeight = newHeight - (newHeight % 2);

  return { width: newWidth, height: newHeight };
}

/**
 * Upload multiple files concurrently with intelligent batching
 */
export const uploadMultipleFiles = async (
  files: ICloudflareUploadFile[],
): Promise<Array<{ mediaUrl: string }>> => {
  // Group files in optimal batches (10 at a time to avoid overwhelming the system)
  const batchSize = 10;
  const results: Array<{ mediaUrl: string }> = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchPromises = batch.map(file => uploadSingleFile(file));

    try {
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error('File upload failed:', result.reason);
          results.push({ mediaUrl: '' });
        }
      });
    } catch (error) {
      logger.error('Batch upload error:', error);
    }
  }

  if (results.length === 0) {
    throw new AppError('All file uploads failed');
  }

  return results;
};

/**
 * Upload a single file with optimized processing
 */
export const uploadSingleFile = async (
  payload: ICloudflareUploadFile,
): Promise<{ mediaUrl: string }> => {
  const { fileName, buffer, mimetype } = payload;

  if (!fileName || !buffer || !mimetype) {
    throw new AppError('File name, buffer and mimetype are required');
  }

  try {
    // Perform basic validation
    const detectedType = baseHelper.getMimeTypeAndExtension(buffer);
    if (!detectedType) {
      throw new AppError('Unsupported file type');
    }

    // Generate a unique and clean filename
    const timestamp = new Date().toISOString().replace(/[:.T]/g, '').slice(0, 15); // Format: YYYYMMDDHHMMSS
    const randomStr = Math.random().toString(36).substring(2, 7); // Short random string
    const uniqueFileName = `media_${timestamp}_${randomStr}`;

    let optimizedBuffer = buffer;
    let finalMimeType = detectedType.mimeType;
    let extension = detectedType.extension;

    // Process based on file type
    if (detectedType.mimeType.startsWith('image/')) {
      // Process image files
      const optimizeResult = await optimizeImage(buffer, detectedType.mimeType);
      optimizedBuffer = optimizeResult.buffer;
      finalMimeType = optimizeResult.mimeType;
      extension = optimizeResult.extension;
    } else if (detectedType.mimeType.startsWith('video/') || mimetype.startsWith('video/')) {
      // Process video files
      const optimizeResult = await optimizeVideo(buffer, mimetype);
      optimizedBuffer = optimizeResult.buffer;
      finalMimeType = optimizeResult.mimeType;
      extension = optimizeResult.extension;
    }

    const finalFileName = `${uniqueFileName}${extension}`;

    // Upload to S3/R2
    const uploadParams = {
      Bucket: env.R2_BUCKET_NAME,
      Key: finalFileName,
      Body: optimizedBuffer,
      ContentType: finalMimeType,
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return {
      mediaUrl: `${env.R2_PUBLIC_URL}/${finalFileName}`,
    };
  } catch (error) {
    logger.error('Upload error:', error);
    throw new AppError(error instanceof Error ? error.message : 'Upload failed - please try again');
  }
};

/**
 * Delete a file from storage
 */
export const deleteSingleFile = async (fileName: string): Promise<void> => {
  if (!fileName) {
    throw new AppError('File name is required');
  }

  // Extract just the filename from the full URL if needed
  const key = fileName.includes('/') ? fileName.split('/').pop() || fileName : fileName;

  const deleteParams = {
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
  } catch (error) {
    logger.error('Delete file error', error);
    throw new AppError('Unable to delete file');
  }
};
