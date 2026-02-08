import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { redisClient } from '@/utils/redis';
import { globalPrisma } from '@/database/connection';
import gdprService from '@/services/gdprService';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  tenantId?: string;
  role?: string;
  type: 'access' | 'refresh';
  sessionId: string;
}

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
  deviceInfo?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  deviceInfo?: string;
  userAgent?: string;
  ipAddress?: string;
  hasConsentedToTerms?: boolean;
  hasConsentedToPrivacy?: boolean;
  hasConsentedToCookies?: boolean;
}

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token (access or refresh)
   */
  private static generateToken(
    payload: Omit<JWTPayload, 'type'>,
    type: 'access' | 'refresh'
  ): string {
    const tokenPayload: JWTPayload = { ...payload, type };
    const secret = type === 'access' ? config.jwt.secret : config.jwt.refreshSecret;
    const expiresIn = type === 'access' ? config.jwt.expiresIn : config.jwt.refreshExpiresIn;

    const options: SignOptions = { expiresIn: expiresIn as StringValue };
    return jwt.sign(tokenPayload, secret, options);
  }

  static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    return this.generateToken(payload, 'access');
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    return this.generateToken(payload, 'refresh');
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string, type: 'access' | 'refresh' = 'access'): JWTPayload {
    const secret = type === 'access' ? config.jwt.secret : config.jwt.refreshSecret;
    const decoded = jwt.verify(token, secret) as JWTPayload;

    if (decoded.type !== type) {
      throw new Error('Invalid token type');
    }

    return decoded;
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterData): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      if (!userData.email && !userData.phone) {
        throw new Error('Email or phone number is required');
      }

      const whereConditions = [
        userData.email && { email: userData.email },
        userData.phone && { phone: userData.phone },
      ].filter(Boolean);

      let existingUser;
      try {
        existingUser = await globalPrisma.users.findFirst({
          where: { OR: whereConditions },
        });
      } catch (prismaError: any) {
        logger.error('Database error during registration check:', prismaError);
        throw new Error('Registration service temporarily unavailable');
      }

      if (existingUser) {
        throw new Error('User already exists with this email or phone');
      }

      const hashedPassword = await this.hashPassword(userData.password);

      let user;
      try {
        user = await globalPrisma.users.create({
          data: {
            id: uuidv4(),
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            password: hashedPassword,
            updated_at: new Date(),
          },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            is_active: true,
            created_at: true,
          },
        });
      } catch (prismaError: any) {
        logger.error('Database error during user creation:', prismaError);
        throw new Error('Registration failed. Please try again.');
      }

      const sessionId = uuidv4();
      const tokens = await this.createSession({
        userId: user.id,
        sessionId,
        deviceInfo: userData.deviceInfo,
        userAgent: userData.userAgent,
        ipAddress: userData.ipAddress,
      });

      // Record GDPR consents asynchronously (non-blocking)
      if (
        userData.hasConsentedToTerms ||
        userData.hasConsentedToPrivacy ||
        userData.hasConsentedToCookies
      ) {
        // Fire and forget - don't block registration response
        const consentPromises = [];
        
        if (userData.hasConsentedToTerms) {
          consentPromises.push(
            gdprService.recordConsent({
              userId: user.id,
              consentType: 'TERMS_AND_CONDITIONS',
              hasConsented: true,
              ipAddress: userData.ipAddress,
              userAgent: userData.userAgent,
            })
          );
        }
        
        if (userData.hasConsentedToPrivacy) {
          consentPromises.push(
            gdprService.recordConsent({
              userId: user.id,
              consentType: 'PRIVACY_POLICY',
              hasConsented: true,
              ipAddress: userData.ipAddress,
              userAgent: userData.userAgent,
            })
          );
        }
        
        if (userData.hasConsentedToCookies) {
          consentPromises.push(
            gdprService.recordConsent({
              userId: user.id,
              consentType: 'COOKIE_POLICY',
              hasConsented: true,
              ipAddress: userData.ipAddress,
              userAgent: userData.userAgent,
            })
          );
        }
        
        // Execute in background without blocking
        Promise.allSettled(consentPromises).catch(gdprError => {
          logger.error('Failed to record GDPR consent during registration:', gdprError);
        });
      }

      logger.info(`User registered: ${user.id}`);
      return { user, tokens };
    } catch (error: any) {
      // Ensure we don't expose internal errors
      if (error.message.includes('Email or phone number is required') || 
          error.message.includes('User already exists') ||
          error.message.includes('Registration service temporarily unavailable') ||
          error.message.includes('Registration failed. Please try again.')) {
        throw error;
      }
      
      // Log unexpected errors but don't expose them
      logger.error('Unexpected registration error:', error);
      throw new Error('Registration failed. Please try again.');
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      // Validate input
      if (!credentials.emailOrPhone || !credentials.password) {
        throw new Error('Email/phone and password are required');
      }

      // Find user with proper error handling
      let user;
      try {
        user = await globalPrisma.users.findFirst({
          where: {
            OR: [
              { email: credentials.emailOrPhone },
              { phone: credentials.emailOrPhone }
            ],
            is_active: true,
          },
        });
      } catch (prismaError: any) {
        logger.error('Database error during login:', prismaError);
        throw new Error('Authentication service temporarily unavailable');
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Verify password with error handling
      let passwordValid = false;
      try {
        passwordValid = await this.verifyPassword(credentials.password, user.password);
      } catch (bcryptError: any) {
        logger.error('Password verification error:', bcryptError);
        throw new Error('Invalid credentials');
      }

      if (!passwordValid) {
        throw new Error('Invalid credentials');
      }

      const sessionId = uuidv4();
      const tokens = await this.createSession({
        userId: user.id,
        sessionId,
        deviceInfo: credentials.deviceInfo,
        userAgent: credentials.userAgent,
        ipAddress: credentials.ipAddress,
      });

      const userResponse = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
      };

      logger.info(`User logged in: ${user.id}`);
      return { user: userResponse, tokens };
    } catch (error: any) {
      // Ensure we don't expose internal errors
      if (error.message.includes('User not found') || 
          error.message.includes('Invalid credentials') ||
          error.message.includes('Email/phone and password are required') ||
          error.message.includes('Authentication service temporarily unavailable')) {
        throw error;
      }
      
      // Log unexpected errors but don't expose them
      logger.error('Unexpected login error:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Create session and generate tokens
   */
  static async createSession(sessionData: {
    userId: string;
    sessionId: string;
    tenantId?: string;
    role?: string;
    deviceInfo?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthTokens> {
    const { userId, sessionId, tenantId, role, deviceInfo, userAgent, ipAddress } = sessionData;

    const tokenPayload = { userId, sessionId, tenantId, role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    const refreshExpMs = this.parseExpirationTime(config.jwt.refreshExpiresIn);
    const expiresAt = new Date(Date.now() + refreshExpMs);

    await globalPrisma.sessions.create({
      data: {
        id: sessionId,
        user_id: userId,
        company_id: tenantId,
        token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date(),
      },
    });

    // Cache in Redis asynchronously (non-blocking)
    const refreshExpSec = Math.floor(refreshExpMs / 1000);
    redisClient.setex(`refresh_token:${sessionId}`, refreshExpSec, refreshToken).catch(err => {
      logger.error('Failed to cache refresh token in Redis:', err);
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationTime(config.jwt.expiresIn) / 1000,
    };
  }

  /**
   * Parse expiration time string to milliseconds
   */
  private static parseExpirationTime(expirationString: string): number {
    const match = expirationString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error('Invalid time unit');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify the refresh token
      const decoded = this.verifyToken(refreshToken, 'refresh');
      
      // Check if session exists in database
      const session = await globalPrisma.sessions.findFirst({
        where: {
          id: decoded.sessionId,
          user_id: decoded.userId,
          token: refreshToken,
          expires_at: { gt: new Date() },
        },
      });

      if (!session) {
        throw new Error('Invalid or expired refresh token');
      }

      // Check if user still exists and is active
      const user = await globalPrisma.users.findFirst({
        where: {
          id: decoded.userId,
          is_active: true,
        },
      });

      if (!user) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const newSessionId = uuidv4();
      const tokenPayload = {
        userId: decoded.userId,
        sessionId: newSessionId,
        tenantId: decoded.tenantId,
        role: decoded.role,
      };

      const newAccessToken = this.generateAccessToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken(tokenPayload);

      // Update session with new token
      const refreshExpMs = this.parseExpirationTime(config.jwt.refreshExpiresIn);
      const expiresAt = new Date(Date.now() + refreshExpMs);

      await globalPrisma.sessions.update({
        where: { id: session.id },
        data: {
          id: newSessionId,
          token: newRefreshToken,
          expires_at: expiresAt,
          updated_at: new Date(),
        },
      });

      // Update Redis cache
      const refreshExpSec = Math.floor(refreshExpMs / 1000);
      await redisClient.del(`refresh_token:${decoded.sessionId}`).catch(() => {});
      redisClient.setex(`refresh_token:${newSessionId}`, refreshExpSec, newRefreshToken).catch(err => {
        logger.error('Failed to cache new refresh token in Redis:', err);
      });

      logger.info(`Token refreshed for user: ${decoded.userId}`);
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.parseExpirationTime(config.jwt.expiresIn) / 1000,
      };
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('User not found')) {
        throw error;
      }
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await globalPrisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isValid = await this.verifyPassword(currentPassword, user.password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      const hashedPassword = await this.hashPassword(newPassword);
      await globalPrisma.users.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updated_at: new Date(),
        },
      });

      // Invalidate all existing sessions except current
      await globalPrisma.sessions.deleteMany({
        where: {
          user_id: userId,
        },
      });

      logger.info(`Password changed for user: ${userId}`);
    } catch (error: any) {
      logger.error('Password change error:', error);
      if (error.message.includes('User not found') || error.message.includes('Current password')) {
        throw error;
      }
      throw new Error('Password change failed');
    }
  }
}
