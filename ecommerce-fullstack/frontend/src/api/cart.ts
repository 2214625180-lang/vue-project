import request from '../utils/request';

export interface CartItem {
  id: string; // skuId
  spuId: string;
  spuName: string;
  skuNo: string;
  price: number;
  stock: number;
  specs: Record<string, any>;
  coverImage?: string;
  quantity: number;
}

export const cartApi = {
  getCart: () => request.get<CartItem[]>('/cart'),
  addToCart: (skuId: string, quantity: number) => request.post('/cart', { skuId, quantity }),
  updateQuantity: (skuId: string, quantity: number) => request.put(`/cart/${skuId}`, { quantity }),
  removeFromCart: (skuIds: string[]) => request.delete('/cart', { data: { skuIds } }),
};
