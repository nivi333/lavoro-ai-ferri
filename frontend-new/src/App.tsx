import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import CompaniesListPage from './pages/company/CompaniesListPage';
import LocationListPage from './pages/company/LocationListPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />

          {/* Company Selection - Protected but outside MainLayout */}
          <Route
            path='/companies'
            element={
              <ProtectedRoute>
                <CompaniesListPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes with MainLayout */}
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to='/companies' replace />} />
            <Route path='locations' element={<LocationListPage />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Catch all - redirect to companies */}
          <Route path='*' element={<Navigate to='/companies' replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast Notifications */}
      <Toaster position='top-right' richColors />
    </AuthProvider>
  );
}

export default App;
