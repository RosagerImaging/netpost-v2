import { User as SupabaseUser, Session } from '@supabase/supabase-js'

export type AuthUser = SupabaseUser

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string) => Promise<{ error?: string }>
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  confirmPassword?: string
}

export interface PasswordResetData {
  email: string
}

export interface PasswordUpdateData {
  password: string
  confirmPassword: string
}