/**
 * @format
 */

import React from 'react';

// Mock the authentication context
const mockUseAuth = {
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
};

jest.mock('../src/hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockUseAuth,
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
}));

// Simple test to verify tests are working
describe('App', () => {
  it('should run tests successfully', () => {
    expect(1 + 1).toBe(2);
  });
});