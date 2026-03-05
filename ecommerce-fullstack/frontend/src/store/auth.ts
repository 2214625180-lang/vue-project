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
        console.log('🔑 Login Response:', response);

        // Robust token extraction
        // NestJS typically returns { access_token: "..." }
        // Axios interceptor might return data directly or wrapped.
        const data = response as any;
        const token = data.access_token || data.token || data.data?.access_token || data.data?.token;
        
        if (token) {
            this.token = token;
            localStorage.setItem('token', this.token);
            // Optionally fetch user profile here if not included in login response
            // await this.fetchUserProfile(); 
            return true;
        }
        
        console.error('Token not found in login response:', response);
        return false;
      } catch (error) {
        console.error('Login failed', error);
        throw error; // Re-throw to let component handle specific error messages
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
