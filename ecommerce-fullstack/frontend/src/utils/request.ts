import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../store/auth';
import { ElMessage } from 'element-plus';
import type { ApiResponse } from '../api/types';

const service: AxiosInstance = axios.create({
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
  (response: AxiosResponse<ApiResponse<any>>) => {
    const res = response.data;
    if (res.code === 200) {
      return res.data;
    } else {
      ElMessage.error(res.message || 'Error');
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  (error) => {
    const authStore = useAuthStore();
    if (error.response && error.response.status === 401) {
      authStore.logout();
      ElMessage.error('Session expired, please login again');
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    } else {
      ElMessage.error(error.message || 'Network Error');
    }
    return Promise.reject(error);
  }
);

export default service;
