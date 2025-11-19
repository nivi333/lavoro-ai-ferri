import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { databaseManager, globalPrisma } from '../database/connection';

// Extend Request interface to include tenant information
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
      userRole?: string;
      tenantPrisma?: any; // Will be properly typed after Prisma generation
    }
  }
}

interface JWTPayload {
  userId: string;
  tenantId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to extract and validate tenant context from JWT token
 */
export const tenantIsolationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authorization token required' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    req.userId = decoded.userId;
    
    if (decoded.tenantId) {
      req.tenantId = decoded.tenantId;
      req.userRole = decoded.role;
      
      const isValidTenant = await validateTenantAccess(decoded.userId, decoded.tenantId);
      if (!isValidTenant) {
        res.status(403).json({ success: false, message: 'Access denied to tenant' });
        return;
      }
      
      req.tenantPrisma = databaseManager.getTenantPrisma(decoded.tenantId);
      logger.debug(`Tenant context set: ${decoded.tenantId}`);
    }
    
    next();
  } catch (error) {
    logger.error('Tenant isolation error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Middleware that requires tenant context (for tenant-specific routes)
 */
export const requireTenantContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.tenantId) {
    res.status(400).json({ success: false, message: 'Tenant context required' });
    return;
  }
  next();
};

/**
 * Middleware to check user role within tenant
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

/**
 * Validate that user has access to the specified tenant
 */
async function validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  try {
    logger.debug(`Validating tenant access: user ${userId} -> tenant ${tenantId}`);
    const access = await globalPrisma.user_companies.findFirst({
      where: {
        user_id: userId,
        company_id: tenantId,
        is_active: true,
        companies: { is_active: true }
      },
      include: { companies: true }
    });
    return !!access;
  } catch (error) {
    logger.error('Error validating tenant access:', error);
    return false;
  }
}

/**
 * Middleware to log tenant operations for audit trail
 */
export const auditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.on('finish', () => {
    logger.info('Tenant Operation', {
      userId: req.userId,
      tenantId: req.tenantId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    });
  });
  next();
};
