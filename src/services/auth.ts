import { apiClient } from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  coins: number;
}

export interface AuthResponse {
  status: string;
  token: string;
  user: User;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileParams {
  username?: string;
  email?: string;
}

export interface UpdatePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateCoinsParams {
  coins: number;
}

/**
 * Authentication service for handling user auth operations
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(params: RegisterParams): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', params);
  }

  /**
   * Login a user
   */
  async login(params: LoginParams): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', params);
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<{ status: string; user: User }> {
    return apiClient.get<{ status: string; user: User }>('/auth/me');
  }

  /**
   * Update user profile
   */
  async updateProfile(params: UpdateProfileParams): Promise<{ status: string; user: User }> {
    return apiClient.patch<{ status: string; user: User }>('/users/profile', params);
  }

  /**
   * Update user password
   */
  async updatePassword(params: UpdatePasswordParams): Promise<{ status: string; message: string }> {
    return apiClient.patch<{ status: string; message: string }>('/users/password', params);
  }

  /**
   * Update user coins
   */
  async updateCoins(params: UpdateCoinsParams): Promise<{ status: string; user: User }> {
    return apiClient.patch<{ status: string; user: User }>('/users/coins', params);
  }
}

// Create and export a singleton instance
export const authService = new AuthService(); 