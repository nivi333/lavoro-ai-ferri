import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { AuthState, User, Company, AuthTokens, LoginCredentials } from '../types/auth';
import { AuthStorage } from '../utils/storage';
import { API_BASE_URL } from '../config/api';

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens; companies: Company[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_CURRENT_COMPANY'; payload: Company }
  | { type: 'REFRESH_COMPANIES'; payload: Company[] }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: AuthTokens }
  | {
      type: 'INITIALIZE_AUTH';
      payload: {
        user: User | null;
        tokens: AuthTokens | null;
        companies: Company[];
        currentCompany: Company | null;
      };
    };

// Initial state
const initialState: AuthState = {
  user: null,
  companies: [],
  currentCompany: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        companies: action.payload.companies,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'SET_CURRENT_COMPANY':
      return {
        ...state,
        currentCompany: action.payload,
      };

    case 'REFRESH_COMPANIES':
      return {
        ...state,
        companies: action.payload,
      };

    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        tokens: action.payload,
      };

    case 'INITIALIZE_AUTH':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        companies: action.payload.companies,
        currentCompany: action.payload.currentCompany,
        isAuthenticated: !!(action.payload.user && action.payload.tokens),
        isLoading: false,
      };

    default:
      return state;
  }
}

// Auth Context
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
  switchCompany: (company: Company) => void;
  refreshToken: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const user = AuthStorage.getUser();
      const tokens = AuthStorage.getTokens();
      const companies = AuthStorage.getCompanies();
      const currentCompany = AuthStorage.getCurrentCompany();

      dispatch({
        type: 'INITIALIZE_AUTH',
        payload: { user, tokens, companies, currentCompany },
      });
    };

    initializeAuth();
  }, []);

  // Warm up backend on app load (initial wake up)
  useEffect(() => {
    const warmUpBackend = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        toast.message('Waking up server...', {
          description: 'This might take up to a minute for the initial load.',
          duration: 10000, // Show for 10 seconds or until dismissed
        });
      }, 1500); // If ping takes more than 1.5s, assume cold start

      try {
        await fetch(`${API_BASE_URL}/health/ping`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        // If we showed the toast (implied by time passing), we could dismiss it or show success,
        // but typically the UI just becomes responsive.
        // We can check if it took long, then show "Ready!"
      } catch (error) {
        clearTimeout(timeoutId);
        // Silent error, maybe offline or server down
      }
    };
    warmUpBackend();
  }, []);

  // Login function (must call backend API)
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrPhone: credentials.emailOrPhone,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed. Please try again.');
      }

      const data = await response.json();
      const { user, tokens } = data;

      // Fetch companies after login (separate endpoint)
      const companiesRes = await fetch(`${API_BASE_URL}/companies`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      if (!companiesRes.ok) {
        throw new Error('Failed to fetch companies');
      }
      const companiesResponse = await companiesRes.json();
      const companies = companiesResponse.data || [];

      AuthStorage.setUser(user);
      AuthStorage.setTokens(tokens);
      AuthStorage.setCompanies(companies);
      // Optionally, set current company if there's only one
      if (companies.length === 1) {
        AuthStorage.setCurrentCompany(companies[0]);
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens, companies },
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Login failed. Please try again.' });
      throw error;
    }
  }, []);

  // Register function (must call backend API)
  const register = useCallback(async (userData: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed. Please try again.');
      }

      // Success - set loading to false
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message || 'Registration failed. Please try again.',
      });
      throw error;
    }
  }, []);

  // Forgot Password function (must call backend API)
  const forgotPassword = useCallback(async (email: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send password reset email.');
      }

      // Success - no need to handle response data
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message || 'Failed to send password reset email.',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    AuthStorage.clearAll();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const switchCompany = useCallback(async (company: Company) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const tokens = AuthStorage.getTokens();
      if (!tokens?.accessToken) {
        throw new Error('No access token available');
      }

      // Call switch company API to get new tokens with tenantId
      const response = await fetch(`${API_BASE_URL}/companies/${company.id}/switch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to switch company');
      }

      const data = await response.json();
      const newTokens = data.data.tokens;

      // Update localStorage with new tokens
      AuthStorage.setTokens(newTokens);
      AuthStorage.setCurrentCompany(company);

      dispatch({
        type: 'SET_CURRENT_COMPANY',
        payload: company,
      });

      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: newTokens,
      });
    } catch (error: any) {
      console.error('Error switching company:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const tokens = AuthStorage.getTokens();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newTokens: AuthTokens = {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        expiresAt: Date.now() + (data.tokens.expiresIn * 1000),
      };

      AuthStorage.setTokens(newTokens);
      dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: newTokens });
    } catch {
      logout();
    }
  }, [logout]);

  const refreshCompanies = useCallback(async () => {
    try {
      const tokens = AuthStorage.getTokens();
      if (!tokens?.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${API_BASE_URL}/companies`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const companiesResponse = await response.json();
      const companies = companiesResponse.data || [];

      AuthStorage.setCompanies(companies);

      dispatch({
        type: 'REFRESH_COMPANIES',
        payload: companies,
      });
    } catch (error) {
      console.error('Error refreshing companies:', error);
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const tokens = AuthStorage.getTokens();
      const currentUser = AuthStorage.getUser();

      if (!tokens?.accessToken || !currentUser?.id) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const result = await response.json();
      const updatedUser = result.data;

      AuthStorage.setUser(updatedUser);

      // We can reuse LOGIN_SUCCESS or create a new action.
      // Reusing LOGIN_SUCCESS requires tokens and companies which we have.
      // Or just update the user part.
      // Let's create a new action type UPDATE_USER or just use INITIALIZE_AUTH logic partially?
      // Actually, let's just dispatch INITIALIZE_AUTH with updated user and existing other data.

      const companies = AuthStorage.getCompanies();
      const currentCompany = AuthStorage.getCurrentCompany();

      dispatch({
        type: 'INITIALIZE_AUTH',
        payload: {
          user: updatedUser,
          tokens,
          companies,
          currentCompany,
        },
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Don't throw, just log
    }
  }, []);

  // Clear error state - memoized to prevent useEffect dependency loops
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    forgotPassword,
    logout,
    switchCompany,
    refreshToken,
    refreshCompanies,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export default function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
