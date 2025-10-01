import { supabase } from "../supabase";

export class AuthService {
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: this.formatAuthError(error) };
      }

      return { data };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: "An unexpected error occurred during sign in" };
    }
  }

  static async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: this.formatAuthError(error) };
      }

      return { data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: "An unexpected error occurred during sign up" };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(this.formatAuthError(error));
      }
    } catch (error) {
      // If it's our formatted auth error (contains specific messages), re-throw it
      if (error instanceof Error && error.message.includes('Sign out failed')) {
        throw error;
      }
      // For network errors or other unexpected errors, use generic message
      throw new Error("An unexpected error occurred during sign out");
    }
  }

  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        return { error: this.formatAuthError(error) };
      }

      return { data };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { error: "An unexpected error occurred during Google sign in" };
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: this.formatAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: "An unexpected error occurred during password reset" };
    }
  }

  static async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { error: this.formatAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return { error: "An unexpected error occurred during password update" };
    }
  }

  static async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        // Don't throw error for common "no session" scenarios
        if (error.message?.includes('session_not_found') ||
            error.message?.includes('No active session') ||
            error.message?.includes('Auth session missing')) {
          return null;
        }
        throw new Error(this.formatAuthError(error));
      }

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        // Don't throw error for common "no user" scenarios
        if (error.message?.includes('session_not_found') ||
            error.message?.includes('No user found') ||
            error.message?.includes('Auth session missing')) {
          return null;
        }
        throw new Error(this.formatAuthError(error));
      }

      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  static onAuthStateChange(
    callback: (event: string, session: unknown) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  private static formatAuthError(error: { message?: string }): string {
    // Common Supabase auth error messages
    const errorMessages: Record<string, string> = {
      "Invalid login credentials": "Invalid email or password",
      "Email not confirmed":
        "Please check your email and click the confirmation link",
      "User already registered": "An account with this email already exists",
      "Password should be at least 6 characters":
        "Password must be at least 6 characters long",
      "Signup requires a valid password": "Please enter a valid password",
      "Unable to validate email address": "Please enter a valid email address",
      "Invalid email": "Please enter a valid email address",
    };

    return (
      errorMessages[error.message || ""] ||
      error.message ||
      "An authentication error occurred"
    );
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    message?: string;
  } {
    if (password.length < 6) {
      return {
        isValid: false,
        message: "Password must be at least 6 characters long",
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        message: "Password must be less than 128 characters",
      };
    }

    return { isValid: true };
  }

  static validatePasswordMatch(
    password: string,
    confirmPassword: string
  ): boolean {
    return password === confirmPassword;
  }
}
