import { defineStore } from 'pinia';
import { authApi, type LoginPayload, type RegisterPayload } from '../api/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null as any,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(payload: LoginPayload) {
      try {
        const response = await authApi.login(payload);
        this.token = response.data.access_token;
        localStorage.setItem('token', this.token);
        return true;
      } catch (error) {
        console.error('Login failed', error);
        return false;
      }
    },
    async register(payload: RegisterPayload) {
      try {
        const response = await authApi.register(payload);
        // Usually register might automatically login or require separate login
        // For simplicity, let's assume it returns token or we redirect to login
        return true;
      } catch (error) {
        console.error('Registration failed', error);
        return false;
      }
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
    },
  },
});
