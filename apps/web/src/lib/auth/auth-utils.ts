/**
 * Authentication utilities for NetPost V2
 * Provides authentication service methods and validation functions
 */

import { createClient } from '../supabase/client';

export class AuthService {
  private static supabase = createClient();

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password requirements
   */
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password || password.length < 6) {
      return {
        isValid: false,
        message: 'Password must be at least 6 characters long'
      };
    }
    return { isValid: true };
  }

  /**
   * Validate password confirmation match
   */
  static validatePasswordMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  /**
   * Sign up new user with email and password
   */
  static async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error: 'An unexpected error occurred during sign up' };
    }
  }

  /**
   * Sign in user with email and password
   */
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error: 'An unexpected error occurred during sign in' };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Google sign in exception:', error);
      return { error: 'An unexpected error occurred with Google sign in' };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        return { error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out exception:', error);
      return { error: 'An unexpected error occurred during sign out' };
    }
  }

  /**
   * Reset password with email
   */
  static async resetPassword(email: string) {
    try {
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('Reset password error:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Reset password exception:', error);
      return { error: 'An unexpected error occurred during password reset' };
    }
  }

  /**
   * Update password (requires authenticated user)
   */
  static async updatePassword(newPassword: string) {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Update password error:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Update password exception:', error);
      return { error: 'An unexpected error occurred during password update' };
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Get session error:', error);
        return { error: error.message };
      }

      return { session };
    } catch (error) {
      console.error('Get session exception:', error);
      return { error: 'An unexpected error occurred getting session' };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error) {
        console.error('Get current user error:', error);
        return { error: error.message };
      }

      return { user };
    } catch (error) {
      console.error('Get current user exception:', error);
      return { error: 'An unexpected error occurred getting user' };
    }
  }
}