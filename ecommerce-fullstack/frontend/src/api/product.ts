import request from '../utils/request';

export interface ProductSku {
  id?: string;
  skuNo: string;
  price: number;
  stock: number;
  specs: Record<string, any>;
  coverImage?: string;
}

// 用于更新的SKU类型，支持带ID的SKU
export interface UpdateProductSku extends ProductSku {
  id?: string; // 有ID表示更新现有SKU，无ID表示新建SKU
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
  category?: { name: string };
  status: ProductStatus;
  skus: ProductSku[];
  createdAt?: string;
}

export interface CreateProductPayload {
  name: string;
  spuNo: string;
  description?: string;
  categoryId: string;
  status?: ProductStatus;
  skus: ProductSku[];
}

// 更新商品时的payload，支持带ID的SKU
export interface UpdateProductPayload {
  name?: string;
  spuNo?: string;
  description?: string;
  categoryId?: string;
  status?: ProductStatus;
  skus?: UpdateProductSku[]; // 使用支持ID的SKU类型
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  keyword?: string;
  categoryId?: string;
  status?: ProductStatus;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export const productApi = {
  create: (data: CreateProductPayload) => request.post('/admin/products', data),
  update: (id: string, data: UpdateProductPayload) => request.patch(`/admin/products/${id}`, data),
  delete: (id: string) => request.delete(`/admin/products/${id}`),
  getDetail: (spuId: string) => request.get<ProductSpu>(`/products/${spuId}`),
  getProductsList: (params: ProductQueryParams) => request.get<PaginatedResponse<ProductSpu>>('/admin/products', { params }),
  getCategories: () => request.get<Category[]>('/admin/products/categories'),
};
