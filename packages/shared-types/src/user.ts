export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  subscription?: UserSubscription;
  preferences: UserPreferences;
}

export interface UserSubscription {
  id: string;
  plan: "free" | "basic" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due" | "incomplete";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  autoSync: boolean;
  defaultPlatform?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin" | "moderator";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}
