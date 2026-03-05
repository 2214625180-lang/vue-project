import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../store/auth';
import { ElMessage } from 'element-plus';
import type { ApiResponse } from '../api/types';
import router from '../router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Create Axios instance
const service: AxiosInstance = axios.create({
  baseURL: '/api', // Use relative path to leverage Vite proxy
  timeout: 10000,
});

// Request Interceptor
service.interceptors.request.use(
  (config) => {
    NProgress.start();
    // Pinia store can be used directly inside interceptors
    const authStore = useAuthStore();
    const adminToken = localStorage.getItem('admin_token');

    // Priority 1: Admin Token for Admin Routes (or fallback if user token missing)
    if (config.url?.includes('/admin') && adminToken) {
      config.headers['Authorization'] = `Bearer ${adminToken}`;
    }
    // Priority 2: User Token
    else if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    // Priority 3: Fallback to Admin Token (e.g. for shared endpoints like /upload called from Admin)
    else if (adminToken) {
       config.headers['Authorization'] = `Bearer ${adminToken}`;
    }

    return config;
  },
  (error) => {
    NProgress.done();
    return Promise.reject(error);
  }
);

// Response Interceptor
service.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    NProgress.done();
    // Some APIs might return data directly or wrapped in { data: ... }
    // Adjust based on your backend response structure
    const res = response.data;
    
    // If backend returns a standard structure with code/message
    // Assuming 200/201 are success HTTP status codes, and backend might have its own 'code'
    return res;
  },
  (error) => {
    NProgress.done();
    // Access store here
    const authStore = useAuthStore();
    
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Check if we are in Admin context
        if (window.location.pathname.startsWith('/admin')) {
           localStorage.removeItem('admin_token');
           ElMessage.error('Admin session expired, please login again');
           // Use window.location.href to force full reload if needed, or router push
           window.location.href = '/admin/login';
        } 
        // Unauthorized: Clear token and redirect only if we were previously logged in or attempting access
        else if (authStore.token) {
             authStore.logout();
             ElMessage.error('Session expired, please login again');
             // Use window.location or router instance if available globally
             // Since we can't easily import router instance due to circular dep potential, we rely on window or router if imported
             // Assuming router is imported above correctly
             router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }
      } else {
        ElMessage.error(data.message || error.message || 'Network Error');
      }
    } else {
      ElMessage.error(error.message || 'Network Error');
    }
    return Promise.reject(error);
  }
);

export default service;
