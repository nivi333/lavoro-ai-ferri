import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { redisClient } from '@/utils/redis';
import { globalPrisma } from '@/database/connection';

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
  private static generateToken(payload: Omit<JWTPayload, 'type'>, type: 'access' | 'refresh'): string {
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
    if (!userData.email && !userData.phone) {
      throw new Error('Email or phone number is required');
    }

    const whereConditions = [
      userData.email && { email: userData.email },
      userData.phone && { phone: userData.phone },
    ].filter(Boolean);

    const existingUser = await globalPrisma.users.findFirst({
      where: { OR: whereConditions },
    });

    if (existingUser) {
      throw new Error('User already exists with this email or phone');
    }

    const hashedPassword = await this.hashPassword(userData.password);

    const user = await globalPrisma.users.create({
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

    const sessionId = uuidv4();
    const tokens = await this.createSession({
      userId: user.id,
      sessionId,
      deviceInfo: userData.deviceInfo,
      userAgent: userData.userAgent,
      ipAddress: userData.ipAddress,
    });

    logger.info(`User registered: ${user.id}`);
    return { user, tokens };
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<{ user: any; tokens: AuthTokens }> {
    const user = await globalPrisma.users.findFirst({
      where: {
        OR: [
          { email: credentials.emailOrPhone },
          { phone: credentials.emailOrPhone },
        ],
        is_active: true,
      },
    });

    if (!user) {
      throw new Error('User not registered');
    }

    if (!(await this.verifyPassword(credentials.password, user.password))) {
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
  }

  /**
   * Create session and generate tokens
   */
  static async createSession(sessionData: {
    userId: string;
    sessionId: string;
    tenantId?: string;
    deviceInfo?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<AuthTokens> {
    const { userId, sessionId, tenantId, deviceInfo, userAgent, ipAddress } = sessionData;

    const tokenPayload = { userId, sessionId, tenantId };
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

    const refreshExpSec = Math.floor(refreshExpMs / 1000);
    await redisClient.setex(`refresh_token:${sessionId}`, refreshExpSec, refreshToken);

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
}
