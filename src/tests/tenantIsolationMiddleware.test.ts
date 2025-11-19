import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { tenantIsolationMiddleware } from '../middleware/tenantIsolation';
import { globalPrisma, databaseManager } from '../database/connection';

jest.mock('jsonwebtoken');
jest.mock('../database/connection', () => {
  const actual = jest.requireActual('../database/connection');
  return {
    ...actual,
    globalPrisma: {
      userTenant: {
        findFirst: jest.fn(),
      },
    },
    databaseManager: {
      getTenantPrisma: jest.fn(),
      getTenantPool: jest.fn(),
    },
  };
});

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedGlobalPrisma = globalPrisma as unknown as {
  userTenant: { findFirst: jest.Mock };
};

describe('tenantIsolationMiddleware', () => {
  const next: NextFunction = jest.fn();

  const createMockRes = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when no Authorization header is provided', async () => {
    const req = { headers: {} } as Request;
    const res = createMockRes();

    await tenantIsolationMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('sets userId and tenantId when token is valid and user has access', async () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as unknown as Request;
    const res = createMockRes();

    mockedJwt.verify.mockReturnValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
    } as any);

    mockedGlobalPrisma.userTenant.findFirst.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      isActive: true,
      tenant: { isActive: true },
    });

    await tenantIsolationMiddleware(req, res, next);

    expect(req.userId).toBe('user-1');
    expect(req.tenantId).toBe('tenant-1');
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 if user does not have access to tenant in token', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid-tenant-token' },
    } as unknown as Request;
    const res = createMockRes();

    mockedJwt.verify.mockReturnValue({
      userId: 'user-1',
      tenantId: 'tenant-x',
    } as any);

    mockedGlobalPrisma.userTenant.findFirst.mockResolvedValue(null);

    await tenantIsolationMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
