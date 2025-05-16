import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from '../core/errors/appError';
import { StatusCodesEnum } from '../core/http/statusCodes';
import { logger } from '../utils/logger';

/**
 * Simple in-memory rate limiting implementation
 * For production systems, consider using Redis or a dedicated rate limiting service
 */

/**
 * Note: For production systems, consider replacing this in-memory implementation
 * with a distributed store like Redis to handle rate limiting across multiple instances.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * In-memory store for rate limiting
 * Will be cleared when server restarts
 */
const ipRequests: RateLimitStore = {};

/**
 * Validate and sanitize the extracted IP address to prevent potential abuse.
 */
const sanitizeIp = (ip: string): string => {
  // Basic validation to ensure IP is not empty or malformed
  if (!ip || typeof ip !== 'string' || ip.trim() === '') {
    // consider using a static identifier for all unknown IPs or consider other strategies
    // This will track all unknown IPs under one bucket, which might be too restrictive
    return 'unknown-ip';
  }
  return ip.trim();
};

/**
 * Extract IP address from request
 */
const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    // Handle potential comma-separated IPs (from proxies)
    return sanitizeIp(Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0]);
  }

  return sanitizeIp(req.socket.remoteAddress || 'unknown');
};

/**
 * Rate limiting middleware
 * Limits the number of requests a client can make within a time window
 * @param windowMs - The time window in milliseconds - default is 15 minutes
 * @param maxRequests - The maximum number of requests allowed within the time window - default is 100
 */
export const rateLimitMiddleware = (
  windowMs: number = env.RATE_LIMIT_WINDOW_MS,
  maxRequests: number = env.RATE_LIMIT_MAX_REQUESTS,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const now = Date.now();

    // Clean up expired entries (optional, could be done by a scheduled job)
    Object.keys(ipRequests).forEach(ip => {
      if (ipRequests[ip].resetTime < now) {
        delete ipRequests[ip];
      }
    });

    // Initialize or reset if window expired
    if (!ipRequests[clientIp] || ipRequests[clientIp].resetTime < now) {
      ipRequests[clientIp] = {
        count: 1,
        resetTime: now + windowMs,
      };

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString());
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(ipRequests[clientIp].resetTime / 1000).toString(),
      );

      return next();
    }

    // Increment request count
    ipRequests[clientIp].count += 1;

    // Check if over limit
    if (ipRequests[clientIp].count > maxRequests) {
      logger.warn(`Rate limit exceeded for IP: ${clientIp}`, {
        path: req.path,
        method: req.method,
        ip: clientIp,
      });

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(ipRequests[clientIp].resetTime / 1000).toString(),
      );
      res.setHeader(
        'Retry-After',
        Math.ceil((ipRequests[clientIp].resetTime - now) / 1000).toString(),
      );

      return next(
        new AppError(
          'Too many requests, please try again later',
          StatusCodesEnum.TOO_MANY_REQUESTS,
        ),
      );
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - ipRequests[clientIp].count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(ipRequests[clientIp].resetTime / 1000).toString());

    next();
  };
};
