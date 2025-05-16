import { Types, Document } from 'mongoose';
import { MongooseResourceDocument } from '../types/baseHelperType';
import { randomBytes } from 'crypto';

const getMongoDbResourceId = <T = string>(
  resource: Document | MongooseResourceDocument | Types.ObjectId | string | null,
): string | T => {
  if (!resource) return null as T;

  try {
    // Handle Mongoose Document with _id
    if (
      (resource instanceof Document ||
        (typeof resource === 'object' && resource !== null && 'toObject' in resource)) &&
      '_id' in resource
    ) {
      return (resource as { _id: Types.ObjectId })._id.toString();
    }

    // Handle ObjectId
    if (resource instanceof Types.ObjectId) {
      return resource.toString();
    }

    // Handle string - validate if it's a valid ObjectId
    if (typeof resource === 'string') {
      return Types.ObjectId.isValid(resource) ? resource : (null as T);
    }

    // Handle plain object with _id
    if (typeof resource === 'object' && '_id' in resource) {
      const id = resource._id;
      if (id instanceof Types.ObjectId) {
        return id.toString();
      }
      if (typeof id === 'string' && Types.ObjectId.isValid(id)) {
        return id;
      }
    }

    return null as T;
  } catch (error) {
    console.error('Error getting MongoDB resource ID:', error);
    return null as T;
  }
};

const generateOTP = (length: number = 6): number => {
  // Input validation
  if (length < 1 || length > 16) {
    throw new Error('OTP length must be between 1 and 16 digits');
  }

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const slugifyData = (data: string) => {
  if (!data) return '';

  return data
    .toString() // Convert any input to string
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing spaces
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with single hyphen
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

const generateRandomString = (length: number) => {
  return randomBytes(length).toString('hex');
};

const generateRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateReferralCode = () => {
  // Create a prefix
  const prefix = 'OGA';

  // Generate 2 random numbers (0-9)
  const numbers = generateRandomNumber(10, 99);

  // Generate 2 random uppercase letters
  const letters = generateRandomString(2).toUpperCase().replace(/[0-9]/g, 'A'); // Replace any numbers with 'A'

  // Combine in format: OGA12CB
  return `${prefix}${numbers}${letters}`;
};

const getMimeTypeAndExtension = (
  buffer: Buffer,
): { mimeType: string; extension: string } | null => {
  const signatures: {
    [key: string]: { mimeType: string; extension: string };
  } = {
    '89504e47': { mimeType: 'image/png', extension: '.png' },
    ffd8ffe0: { mimeType: 'image/jpeg', extension: '.jpg' },
    ffd8ffe1: { mimeType: 'image/jpeg', extension: '.jpg' },
    ffd8ffe2: { mimeType: 'image/jpeg', extension: '.jpg' },
    '47494638': { mimeType: 'image/gif', extension: '.gif' },
    '25504446': { mimeType: 'application/pdf', extension: '.pdf' },
    '49492a00': { mimeType: 'image/tiff', extension: '.tiff' },
    '4d4d002a': { mimeType: 'image/tiff', extension: '.tiff' },
    '424d': { mimeType: 'image/bmp', extension: '.bmp' },
    '00000020': { mimeType: 'video/mp4', extension: '.mp4' },
    '00000018': { mimeType: 'video/mp4', extension: '.mp4' },
    '1a45dfa3': { mimeType: 'video/webm', extension: '.webm' },
  };

  // Get the first 4 bytes as the file signature
  const signature = buffer.slice(0, 4).toString('hex');

  for (const key of Object.keys(signatures)) {
    if (signature.startsWith(key)) {
      return signatures[key];
    }
  }

  return null; // Unknown MIME type
};

const omitPaths = <T extends object>(obj: T, paths: string[]): T => {
  if (!obj || typeof obj !== 'object') return obj;

  // Deep clone to avoid mutating the original object
  const clone = JSON.parse(JSON.stringify(obj));

  for (const path of paths) {
    if (!path || typeof path !== 'string') continue;
    const keys = path.split('.');
    let current = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current && typeof current === 'object' && keys[i] in current) {
        current = current[keys[i]];
      } else {
        current = null;
        break;
      }
    }
    if (current && typeof current === 'object') {
      delete current[keys[keys.length - 1]];
    }
  }

  return clone as T;
};

const copyMongooseDocument = <T extends Document>(doc: T): T => {
  if (typeof doc?.toJSON === 'function') {
    return doc.toJSON() as T;
  } else if (typeof doc?.toObject === 'function') {
    return doc.toObject() as T;
  }

  return { ...doc };
};

export const baseHelper = {
  getMongoDbResourceId,
  generateOTP,
  slugifyData,
  generateRandomString,
  generateRandomNumber,
  generateReferralCode,
  getMimeTypeAndExtension,
  omitPaths,
  copyMongooseDocument,
};
