/**
 * Authentication utilities
 */

import { apiClient } from './api';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'ANALYST';
}

export async function login(username: string, password: string): Promise<boolean> {
  try {
    await apiClient.login(username, password);
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

export function logout() {
  apiClient.logout();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
  }
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token');
}

export function getToken(): string | undefined {
  return Cookies.get('access_token');
}

export function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  const role = localStorage.getItem('user_role');
  return role;
}

export function setUserRole(role: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_role', role);
}

export function setUsername(username: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_name', username);
}

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_name');
}

export function hasRole(role: string | string[]): boolean {
  const userRole = getUserRole();
  if (!userRole) return false;

  if (Array.isArray(role)) {
    return role.includes(userRole);
  }

  return userRole === role;
}
