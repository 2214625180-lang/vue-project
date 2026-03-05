import request from '../utils/request';

export interface AdminOrderQueryParams {
  page?: number;
  limit?: number;
  orderNo?: string;
  status?: string;
}

export interface ShipOrderPayload {
  trackingNumber: string;
  courierCompany: string;
}

export const adminOrderApi = {
  getOrders: (params: AdminOrderQueryParams) => 
    request.get('/admin/orders', { params }),
    
  shipOrder: (id: string, data: ShipOrderPayload) => 
    request.post(`/admin/orders/${id}/ship`, data),
};
