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
        const data = response as any;
        const token = data.access_token || data.token || data.data?.access_token || data.data?.token;
        
        if (token) {
            this.token = token;
            localStorage.setItem('token', this.token);
            return true;
        }
        
        console.error('Token not found in login response:', response);
        return false;
      } catch (error) {
        console.error('登录失败', error);
        throw error; // Re-throw to let component handle specific error messages
      }
    },
    async register(payload: RegisterPayload) {
      try {
        const response = await authApi.register(payload);
        console.log('✅ Registration Response:', response);
        return true;
      } catch (error) {
        console.error('注册失败', error);
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
