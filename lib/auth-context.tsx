'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { userLogin, userRegister, userMe, userLogout, userUpdateProfile } from './user-api';
import type { User as ApiUser } from './user-api';
import { initializeUserDataIsolation, cleanupUserData, cleanupLegacySharedData } from './user-data-utils';

// Re-export the User type from the API
export type User = ApiUser;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (userData: { fullName: string; email: string; password: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loading: boolean;
}

// Store user data key for localStorage
const USER_STORAGE_KEY = 'auralearn_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage and verify with backend on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Skip user authentication verification on admin routes
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        setLoading(false);
        return;
      }

      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Verify with backend
          const response = await userMe();
          if (response?.user) {
            setUser(response.user);
          } else {
            // Clear invalid session
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
          }
        } catch (error) {
          // Only log auth errors if it's not a 401 (expected when not logged in)
          if (error && typeof error === 'object' && 'message' in error && 
              typeof error.message === 'string' && !error.message.includes('401')) {
            console.error('Error initializing auth:', error);
          }
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await userLogin({ email, password });
      setUser(response.user);
      
      // Initialize user data isolation for this user
      if (response.user?.id) {
        initializeUserDataIsolation(response.user.id);
      }
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      return false;
    }
  };

  const signUp = async (userData: { fullName: string; email: string; password: string }): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await userRegister(userData);
      setUser(response.user);
      
      // Initialize user data isolation for this new user
      if (response.user?.id) {
        // Clean up any legacy shared data first
        cleanupLegacySharedData();
        initializeUserDataIsolation(response.user.id);
      }
      
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      setLoading(false);
      return false;
    }
  };

  const signOut = async () => {
    // Get current user ID before clearing user state
    const currentUserId = user?.id;
    
    try {
      await userLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state
      setUser(null);
      
      // Optional: Clean up user data on logout (uncomment if desired)
      // if (currentUserId) {
      //   cleanupUserData(currentUserId);
      // }
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        const response = await userUpdateProfile(updates);
        setUser(response.user);
      } catch (error) {
        console.error('Update user error:', error);
        // Fallback to local update if API fails
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      }
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 