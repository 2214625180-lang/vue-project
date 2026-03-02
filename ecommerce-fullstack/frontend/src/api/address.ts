import request from '../utils/request';

export interface UserAddress {
  id: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface CreateAddressPayload {
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  isDefault?: boolean;
}

export const addressApi = {
  getList: () => request.get<UserAddress[]>('/user/addresses'),
  create: (data: CreateAddressPayload) => request.post('/user/addresses', data),
  update: (id: string, data: Partial<CreateAddressPayload>) => request.put(`/user/addresses/${id}`, data),
  delete: (id: string) => request.delete(`/user/addresses/${id}`),
};
