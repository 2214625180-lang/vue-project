import request from '../utils/request';

export interface CreateOrderPayload {
  addressId: string;
  skuIds: string[];
}

export const orderApi = {
  checkout: (data: CreateOrderPayload) => request.post<{ orderNo: string }>('/order/checkout', data),
};
