import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { ElMessage } from 'element-plus';

const service = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
});

service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      ElMessage.error('Session expired, please login again');
      // Use window.location to avoid circular dependency with router
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    return Promise.reject(error);
  }
);

export default service;
