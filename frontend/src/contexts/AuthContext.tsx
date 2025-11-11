import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User, Company, AuthTokens, LoginCredentials } from '../types/auth';
import { AuthStorage } from '../utils/storage';

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens; companies: Company[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_CURRENT_COMPANY'; payload: Company }
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
  logout: () => void;
  switchCompany: (company: Company) => void;
  refreshToken: () => Promise<void>;
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

  // Login function (must call backend API)
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/login`, {
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
      const companiesRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/companies`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );
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
  };

  // Register function (must call backend API)
  const register = async (userData: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed. Please try again.');
      }

      // No need to handle tokens or user here, just let the UI show success
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message || 'Registration failed. Please try again.',
      });
      throw error;
    }
  };

  const logout = () => {
    AuthStorage.clearAll();
    dispatch({ type: 'LOGOUT' });
  };

  const switchCompany = (company: Company) => {
    AuthStorage.setCurrentCompany(company);
    dispatch({ type: 'SET_CURRENT_COMPANY', payload: company });
  };

  const refreshToken = async () => {
    try {
      // TODO: Implement real refresh token API call here
      throw new Error('refreshToken API not implemented');
    } catch {
      logout();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    switchCompany,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
