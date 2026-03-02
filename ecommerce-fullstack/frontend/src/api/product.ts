import request from '../utils/request';

export interface ProductSku {
  id?: string;
  skuNo: string;
  price: number;
  stock: number;
  specs: Record<string, any>;
  coverImage?: string;
}

export enum ProductStatus {
  ON_SHELF = 'ON_SHELF',
  OFF_SHELF = 'OFF_SHELF',
}

export interface ProductSpu {
  id?: string;
  name: string;
  spuNo: string;
  description?: string;
  categoryId: string;
  status: ProductStatus;
  skus: ProductSku[];
}

export interface CreateProductPayload {
  name: string;
  spuNo: string;
  description?: string;
  categoryId: string;
  status?: ProductStatus;
  skus: ProductSku[];
}

export const productApi = {
  create: (data: CreateProductPayload) => request.post('/admin/products', data),
  getDetail: (spuId: string) => request.get<ProductSpu>(`/products/${spuId}`),
};
