import request from '../utils/request';
import { OrderStatus } from './order';

export interface AdminOrderQueryParams {
  page?: number;
  limit?: number;
  orderNo?: string;
  status?: OrderStatus;
}

export interface AdminOrder {
  id: string;
  orderNo: string;
  totalAmount: number;
  status: OrderStatus;
  trackingNumber?: string;
  courierCompany?: string;
  addressSnapshot: any;
  createdAt: string;
  items: any[];
  user: {
    email: string;
    id: string;
  };
}

export interface ShipOrderPayload {
  trackingNumber: string;
  courierCompany: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const adminOrderApi = {
  getOrders: (params: AdminOrderQueryParams) => request.get<PaginatedResponse<AdminOrder>>('/admin/orders', { params }),
  shipOrder: (id: string, data: ShipOrderPayload) => request.post(`/admin/orders/${id}/ship`, data),
};
