import request from '../utils/request';
import type { PaginatedResponse, ProductSku, ProductSpu } from './product';

export interface ShopProductItem {
  id: string;
  spuNo: string;
  name: string;
  price: number;
  coverImage: string;
}

export interface ShopProductDetail extends ProductSpu {
  category: { name: string };
  skus: ProductSku[];
}

export const shopApi = {
  getProducts: (page = 1, limit = 12) => 
    request.get<PaginatedResponse<ShopProductItem>>('/shop/products', { params: { page, limit } }),
  getProductDetail: (spuId: string) => 
    request.get<ShopProductDetail>(`/shop/products/${spuId}`),
};
