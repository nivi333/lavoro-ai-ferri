export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string;
  logoUrl?: string;
  role: CompanyRole;
  country?: string;
  description?: string;
  status?: 'CONFIRMED' | 'PENDING';
  invitationId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: User | null;
  companies: Company[];
  currentCompany: Company | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type CompanyRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface LoginCredentials {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
}
