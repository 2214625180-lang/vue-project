import request from '../utils/request';

export const paymentApi = {
  mockPay: (orderNo: string) => request.post('/payment/mock-pay', { orderNo }),
  getOrderStatus: (orderNo: string) => request.get<{ status: string; orderNo: string; totalAmount: string }>(`/order/${orderNo}`),
};
