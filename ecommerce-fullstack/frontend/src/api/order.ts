import request from '../utils/request';

export interface CreateOrderPayload {
  addressId: string;
  skuIds: string[];
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  orderId: string;
  skuId: string;
  spuName: string;
  skuSpecs: any;
  price: number;
  quantity: number;
  coverImage?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
}

export interface GetMyOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | '';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const orderApi = {
  checkout: (data: CreateOrderPayload) => request.post<{ orderNo: string }>('/order/checkout', data),
  getMyOrders: (params: GetMyOrdersParams) => request.get<PaginatedResponse<Order>>('/order/my-orders', { params }),
};
