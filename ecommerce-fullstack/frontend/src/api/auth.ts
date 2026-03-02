import request from '../utils/request';

export interface AuthResponse {
  access_token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export const authApi = {
  login: (data: LoginPayload) => request.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterPayload) => request.post<AuthResponse>('/auth/register', data),
};
