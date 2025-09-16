import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the supabase import with inline mock
vi.mock('../../supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

import { AuthService } from '../auth-utils'
import { supabase } from '../../supabase'

// Get mocked supabase auth functions
const mockSupabaseAuth = vi.mocked(supabase.auth)

// Mock window.location for OAuth tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signIn', () => {
    it('should sign in with valid credentials', async () => {
      const mockData = { user: { id: '123', email: 'test@example.com' } }
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await AuthService.signIn('test@example.com', 'password123')

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual({ data: mockData })
    })

    it('should return formatted error for invalid credentials', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      const result = await AuthService.signIn('test@example.com', 'wrongpassword')

      expect(result).toEqual({ error: 'Invalid email or password' })
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAuth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.signIn('test@example.com', 'password123')

      expect(result).toEqual({ error: 'An unexpected error occurred during sign in' })
    })
  })

  describe('signUp', () => {
    it('should sign up with valid credentials', async () => {
      const mockData = { user: { id: '123', email: 'test@example.com' } }
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await AuthService.signUp('test@example.com', 'password123')

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual({ data: mockData })
    })

    it('should return formatted error for weak password', async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Password should be at least 6 characters' },
      })

      const result = await AuthService.signUp('test@example.com', '123')

      expect(result).toEqual({ error: 'Password must be at least 6 characters long' })
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAuth.signUp.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.signUp('test@example.com', 'password123')

      expect(result).toEqual({ error: 'An unexpected error occurred during sign up' })
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

      await expect(AuthService.signOut()).resolves.toBeUndefined()
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
    })

    it('should throw formatted error on sign out failure', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      await expect(AuthService.signOut()).rejects.toThrow('Sign out failed')
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAuth.signOut.mockRejectedValue(new Error('Network error'))

      await expect(AuthService.signOut()).rejects.toThrow(
        'An unexpected error occurred during sign out'
      )
    })
  })

  describe('signInWithGoogle', () => {
    it('should initiate Google OAuth sign in', async () => {
      const mockData = { url: 'https://oauth.google.com/callback' }
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await AuthService.signInWithGoogle()

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/dashboard',
        },
      })
      expect(result).toEqual({ data: mockData })
    })

    it('should return formatted error on OAuth failure', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider error' },
      })

      const result = await AuthService.signInWithGoogle()

      expect(result).toEqual({ error: 'OAuth provider error' })
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAuth.signInWithOAuth.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.signInWithGoogle()

      expect(result).toEqual({ error: 'An unexpected error occurred during Google sign in' })
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null })

      const result = await AuthService.resetPassword('test@example.com')

      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/reset-password',
        }
      )
      expect(result).toEqual({ success: true })
    })

    it('should return formatted error on failure', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Invalid email' },
      })

      const result = await AuthService.resetPassword('invalid-email')

      expect(result).toEqual({ error: 'Please enter a valid email address' })
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.resetPassword('test@example.com')

      expect(result).toEqual({ error: 'An unexpected error occurred during password reset' })
    })
  })

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null })

      const result = await AuthService.updatePassword('newpassword123')

      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
      expect(result).toEqual({ success: true })
    })

    it('should return formatted error on failure', async () => {
      mockSupabaseAuth.updateUser.mockResolvedValue({
        error: { message: 'Password should be at least 6 characters' },
      })

      const result = await AuthService.updatePassword('123')

      expect(result).toEqual({ error: 'Password must be at least 6 characters long' })
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAuth.updateUser.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.updatePassword('newpassword123')

      expect(result).toEqual({ error: 'An unexpected error occurred during password update' })
    })
  })

  describe('getCurrentSession', () => {
    it('should return current session', async () => {
      const mockSession = { user: { id: '123' }, access_token: 'token' }
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await AuthService.getCurrentSession()

      expect(result).toBe(mockSession)
    })

    it('should return null on error', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'No active session' },
      })

      const result = await AuthService.getCurrentSession()

      expect(result).toBe(null)
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAuth.getSession.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.getCurrentSession()

      expect(result).toBe(null)
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await AuthService.getCurrentUser()

      expect(result).toBe(mockUser)
    })

    it('should return null on error', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user found' },
      })

      const result = await AuthService.getCurrentUser()

      expect(result).toBe(null)
    })

    it('should handle unexpected errors', async () => {
      mockSupabaseAuth.getUser.mockRejectedValue(new Error('Network error'))

      const result = await AuthService.getCurrentUser()

      expect(result).toBe(null)
    })
  })

  describe('onAuthStateChange', () => {
    it('should set up auth state change listener', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()
      mockSupabaseAuth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      })

      const result = AuthService.onAuthStateChange(mockCallback)

      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
      expect(result).toEqual({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      })
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(AuthService.validateEmail('test@example.com')).toBe(true)
      expect(AuthService.validateEmail('user@domain.org')).toBe(true)
      expect(AuthService.validateEmail('name.surname@company.co.uk')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(AuthService.validateEmail('invalid-email')).toBe(false)
      expect(AuthService.validateEmail('test@')).toBe(false)
      expect(AuthService.validateEmail('@example.com')).toBe(false)
      expect(AuthService.validateEmail('test.example.com')).toBe(false)
      expect(AuthService.validateEmail('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = AuthService.validatePassword('password123')
      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it('should reject short passwords', () => {
      const result = AuthService.validatePassword('123')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Password must be at least 6 characters long')
    })

    it('should reject overly long passwords', () => {
      const longPassword = 'a'.repeat(129)
      const result = AuthService.validatePassword(longPassword)
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Password must be less than 128 characters')
    })

    it('should validate edge case lengths', () => {
      const sixCharPassword = '123456'
      expect(AuthService.validatePassword(sixCharPassword).isValid).toBe(true)

      const maxValidPassword = 'a'.repeat(128)
      expect(AuthService.validatePassword(maxValidPassword).isValid).toBe(true)
    })
  })

  describe('validatePasswordMatch', () => {
    it('should validate matching passwords', () => {
      expect(AuthService.validatePasswordMatch('password123', 'password123')).toBe(true)
    })

    it('should reject non-matching passwords', () => {
      expect(AuthService.validatePasswordMatch('password123', 'password456')).toBe(false)
      expect(AuthService.validatePasswordMatch('password', '')).toBe(false)
    })
  })

  describe('formatAuthError', () => {
    // Test the private formatAuthError method through public methods
    it('should format common Supabase error messages', async () => {
      // Test through signIn method
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Email not confirmed' },
      })

      const result = await AuthService.signIn('test@example.com', 'password')
      expect(result.error).toBe('Please check your email and click the confirmation link')
    })

    it('should format user already registered error', async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' },
      })

      const result = await AuthService.signUp('test@example.com', 'password')
      expect(result.error).toBe('An account with this email already exists')
    })

    it('should return generic message for unknown errors', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Unknown error' },
      })

      const result = await AuthService.signIn('test@example.com', 'password')
      expect(result.error).toBe('Unknown error')
    })
  })
})