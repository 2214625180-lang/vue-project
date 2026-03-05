import request from '../utils/request';

export const paymentApi = {
  // Updated to use the new simple mock endpoint which accepts orderId
  mockPay: (orderId: string) => request.post('/payment/mock', { orderId }),
  // Kept for backward compatibility if needed, but we prefer ID now
  mockPayByNo: (orderNo: string) => request.post('/payment/mock-pay', { orderNo }),
  
  getOrderStatus: (orderNo: string) => request.get<{ status: string; orderNo: string; totalAmount: string }>(`/order/${orderNo}`),
};
