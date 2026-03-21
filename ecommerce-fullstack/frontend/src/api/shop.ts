import request from '../utils/request';
import type { Category, PaginatedResponse, ProductSku, ProductSpu } from './product';

export interface ShopProductItem {
  id: string;
  spuNo: string;
  name: string;
  price: number;
  coverImage: string;
  categoryId?: string;
  category?: { name: string };
  defaultSkuId?: string | null;
}

export interface ShopProductDetail extends ProductSpu {
  category: { name: string };
  skus: ProductSku[];
}

export const shopApi = {
  getProducts: (page = 1, limit = 12, categoryId?: string) => 
    request.get<PaginatedResponse<ShopProductItem>>('/shop/products', { params: { page, limit, categoryId } }),
  getCategories: () =>
    request.get<Category[]>('/shop/products/categories'),
  getProductDetail: (spuId: string) => 
    request.get<ShopProductDetail>(`/shop/products/${spuId}`),
};
