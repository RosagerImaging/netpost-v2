import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthService } from '../auth-utils'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase client for integration tests
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

import { supabase } from '../../supabase'

const mockSupabaseAuth = vi.mocked(supabase.auth)

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Sign In Flow', () => {
    it('should handle successful sign in with session creation', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = {
        user: mockUser,
        access_token: 'token123',
        expires_at: Date.now() + 3600000
      }

      // Mock successful sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock session retrieval
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Test sign in
      const signInResult = await AuthService.signIn('test@example.com', 'password123')
      expect(signInResult.data).toEqual({ user: mockUser })

      // Test session retrieval after sign in
      const session = await AuthService.getCurrentSession()
      expect(session).toEqual(mockSession)

      // Verify mock calls
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockSupabaseAuth.getSession).toHaveBeenCalled()
    })

    it('should handle sign in failure and maintain no session', async () => {
      // Mock failed sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      })

      // Mock no session
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Test sign in failure
      const signInResult = await AuthService.signIn('test@example.com', 'wrongpassword')
      expect(signInResult.error).toBe('Invalid email or password')

      // Test no session after failed sign in
      const session = await AuthService.getCurrentSession()
      expect(session).toBeNull()
    })
  })

  describe('Complete Sign Up Flow', () => {
    it('should handle successful sign up and user creation', async () => {
      const mockUser = { id: '456', email: 'newuser@example.com' }

      // Mock successful sign up
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock user retrieval
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Test sign up
      const signUpResult = await AuthService.signUp('newuser@example.com', 'password123')
      expect(signUpResult.data).toEqual({ user: mockUser })

      // Test user retrieval after sign up
      const user = await AuthService.getCurrentUser()
      expect(user).toEqual(mockUser)

      // Verify mock calls
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      })
      expect(mockSupabaseAuth.getUser).toHaveBeenCalled()
    })

    it('should handle sign up with existing email', async () => {
      // Mock sign up failure
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' },
      })

      // Test sign up failure
      const signUpResult = await AuthService.signUp('existing@example.com', 'password123')
      expect(signUpResult.error).toBe('An account with this email already exists')
    })
  })

  describe('Authentication State Management', () => {
    it('should handle complete sign in -> sign out flow', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token123' }

      // Mock successful sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock session with user
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })

      // Mock successful sign out
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

      // Mock session cleared after sign out
      mockSupabaseAuth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      // Test sign in
      const signInResult = await AuthService.signIn('test@example.com', 'password123')
      expect(signInResult.data).toEqual({ user: mockUser })

      // Verify session exists
      const sessionBefore = await AuthService.getCurrentSession()
      expect(sessionBefore).toEqual(mockSession)

      // Test sign out
      await expect(AuthService.signOut()).resolves.toBeUndefined()

      // Verify session cleared
      const sessionAfter = await AuthService.getCurrentSession()
      expect(sessionAfter).toBeNull()

      // Verify all calls
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalled()
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
      expect(mockSupabaseAuth.getSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('Password Reset Flow', () => {
    it('should handle complete password reset flow', async () => {
      // Mock successful reset email
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null })

      // Mock successful password update
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null })

      // Test password reset email
      const resetResult = await AuthService.resetPassword('test@example.com')
      expect(resetResult.success).toBe(true)

      // Test password update
      const updateResult = await AuthService.updatePassword('newpassword123')
      expect(updateResult.success).toBe(true)

      // Verify mock calls
      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/reset-password',
        }
      )
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })
  })

  describe('OAuth Authentication Flow', () => {
    it('should handle Google OAuth flow', async () => {
      const mockOAuthData = {
        url: 'https://accounts.google.com/oauth/authorize?...'
      }

      // Mock successful OAuth initiation
      mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
        data: mockOAuthData,
        error: null,
      })

      // Test OAuth sign in
      const result = await AuthService.signInWithGoogle()
      expect(result.data).toEqual(mockOAuthData)

      // Verify correct OAuth parameters
      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/dashboard',
        },
      })
    })
  })

  describe('Auth State Change Integration', () => {
    it('should handle auth state changes', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()

      // Mock auth state change subscription
      mockSupabaseAuth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      })

      // Test auth state change listener setup
      const subscription = AuthService.onAuthStateChange(mockCallback)

      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
      expect(subscription).toEqual({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      })
    })
  })

  describe('Input Validation Integration', () => {
    it('should validate inputs before authentication attempts', () => {
      // Test email validation
      expect(AuthService.validateEmail('valid@example.com')).toBe(true)
      expect(AuthService.validateEmail('invalid-email')).toBe(false)

      // Test password validation
      expect(AuthService.validatePassword('validpass123').isValid).toBe(true)
      expect(AuthService.validatePassword('short').isValid).toBe(false)
      expect(AuthService.validatePassword('a'.repeat(129)).isValid).toBe(false)

      // Test password matching
      expect(AuthService.validatePasswordMatch('pass123', 'pass123')).toBe(true)
      expect(AuthService.validatePasswordMatch('pass123', 'different')).toBe(false)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network errors across all auth methods', async () => {
      const networkError = new Error('Network error')

      // Mock network errors for all methods
      mockSupabaseAuth.signInWithPassword.mockRejectedValue(networkError)
      mockSupabaseAuth.signUp.mockRejectedValue(networkError)
      mockSupabaseAuth.signOut.mockRejectedValue(networkError)
      mockSupabaseAuth.resetPasswordForEmail.mockRejectedValue(networkError)
      mockSupabaseAuth.updateUser.mockRejectedValue(networkError)

      // Test all methods handle network errors gracefully
      const signInResult = await AuthService.signIn('test@example.com', 'password')
      expect(signInResult.error).toBe('An unexpected error occurred during sign in')

      const signUpResult = await AuthService.signUp('test@example.com', 'password')
      expect(signUpResult.error).toBe('An unexpected error occurred during sign up')

      await expect(AuthService.signOut()).rejects.toThrow(
        'An unexpected error occurred during sign out'
      )

      const resetResult = await AuthService.resetPassword('test@example.com')
      expect(resetResult.error).toBe('An unexpected error occurred during password reset')

      const updateResult = await AuthService.updatePassword('newpassword')
      expect(updateResult.error).toBe('An unexpected error occurred during password update')
    })
  })
})