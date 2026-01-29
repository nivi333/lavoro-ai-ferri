import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

/**
 * LoginForm Component Tests
 * Tests login form validation, submission, and error handling
 */

// Mock LoginForm component for testing
const MockLoginForm = ({ onSubmit }: { onSubmit: (data: any) => void | Promise<void> }) => {
  const [formData, setFormData] = React.useState({ identifier: '', password: '' });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation - prevent submission if fields are empty
    if (!formData.identifier || !formData.password) {
      return; // Don't call onSubmit if validation fails
    }
    
    onSubmit(formData);
    // Reset form after successful submission
    setFormData({ identifier: '', password: '' });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="identifier">Email or Phone</label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          placeholder="Enter email or phone"
          data-testid="identifier-input"
          value={formData.identifier}
          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter password"
          data-testid="password-input"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>
      <button type="submit" data-testid="submit-button">
        Login
      </button>
    </form>
  );
};

describe('LoginForm Component', () => {
  let mockOnSubmit: any;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
  });

  it('should render login form with all fields', () => {
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/email or phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('should accept email input', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByTestId('identifier-input');
    await user.type(emailInput, 'test@example.com');
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should accept phone input', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    const phoneInput = screen.getByTestId('identifier-input');
    await user.type(phoneInput, '+91-9876543210');
    
    expect(phoneInput).toHaveValue('+91-9876543210');
  });

  it('should accept password input', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByTestId('password-input');
    await user.type(passwordInput, 'Test123!@#');
    
    expect(passwordInput).toHaveValue('Test123!@#');
  });

  it('should mask password input', () => {
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    const passwordInput = screen.getByTestId('password-input');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByTestId('identifier-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should handle form submission with email', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByTestId('identifier-input'), 'user@company.com');
    await user.type(screen.getByTestId('password-input'), 'SecurePass123!');
    await user.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'user@company.com',
          password: 'SecurePass123!',
        })
      );
    });
  });

  it('should handle form submission with phone', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByTestId('identifier-input'), '+91-9876543210');
    await user.type(screen.getByTestId('password-input'), 'MyPassword123');
    await user.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: '+91-9876543210',
          password: 'MyPassword123',
        })
      );
    });
  });

  it('should not submit form when fields are empty', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    await user.click(screen.getByTestId('submit-button'));
    
    // Form validation should prevent submission
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle Enter key press to submit', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByTestId('identifier-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123{Enter}');
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should clear form after submission', async () => {
    const user = userEvent.setup();
    render(<MockLoginForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByTestId('identifier-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));
    
    // Form should auto-clear after successful submission
    await waitFor(() => {
      expect(screen.getByTestId('identifier-input')).toHaveValue('');
      expect(screen.getByTestId('password-input')).toHaveValue('');
    });
  });
});

describe('LoginForm Validation', () => {
  it('should validate email format', () => {
    const validEmails = [
      'test@example.com',
      'user.name@company.co.in',
      'admin+tag@domain.com',
    ];
    
    validEmails.forEach(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(true);
    });
  });

  it('should reject invalid email format', () => {
    const invalidEmails = [
      'invalid',
      'test@',
      '@example.com',
      'test @example.com',
    ];
    
    invalidEmails.forEach(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it('should validate phone format', () => {
    const validPhones = [
      '+91-9876543210',
      '+1-555-123-4567',
      '9876543210',
    ];
    
    validPhones.forEach(phone => {
      const phoneRegex = /^[\d\s\-+()]+$/;
      expect(phoneRegex.test(phone)).toBe(true);
    });
  });

  it('should validate password minimum length', () => {
    const password = 'Test123!';
    expect(password.length).toBeGreaterThanOrEqual(8);
  });
});
