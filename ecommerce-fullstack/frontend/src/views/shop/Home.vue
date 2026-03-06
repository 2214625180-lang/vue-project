<template>
  <div class="shop-home container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">最新商品</h1>
    
    <el-skeleton :loading="loading" animated :count="6">
      <template #template>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="border rounded-lg overflow-hidden h-[320px]">
            <el-skeleton-item variant="image" style="width: 100%; height: 12rem" />
            <div class="p-4">
              <el-skeleton-item variant="text" style="width: 50%" />
              <el-skeleton-item variant="text" style="width: 30%; margin-top: 10px" />
              <div class="flex justify-between items-center mt-2">
                <el-skeleton-item variant="text" style="width: 20%" />
                <el-skeleton-item variant="button" style="width: 30%" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #default>
        <div v-if="products && products.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div 
            v-for="product in products" 
            :key="product.id" 
            class="product-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            @click="goToDetail(product.id)"
          >
            <div class="h-48 bg-gray-100 flex items-center justify-center">
              <img 
                v-if="product.coverImage" 
                :src="product.coverImage" 
                alt="Product Image" 
                class="h-full w-full object-cover"
              />
              <span v-else class="text-gray-400">无图片</span>
            </div>
            
            <div class="p-4">
              <h3 class="text-lg font-semibold truncate">{{ product.name }}</h3>
              <div class="flex justify-between items-center mt-2">
                <div class="text-xl font-bold text-red-600">
                  ${{ product.price.toFixed(2) }}
                </div>
                <el-button type="primary" size="small" @click.stop="handleAddToCart(product)">加入购物车</el-button>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!loading" class="text-center py-10 text-gray-500">暂无商品</div>
      </template>
    </el-skeleton>
    
    <!-- Simple Pagination for Demo -->
    
    <!-- Simple Pagination for Demo -->
    <div class="mt-8 flex justify-center gap-2">
      <button 
        :disabled="page === 1" 
        @click="changePage(page - 1)"
        class="px-4 py-2 border rounded disabled:opacity-50"
      >
        上一页
      </button>
      <span class="px-4 py-2">第 {{ page }} 页</span>
      <button 
        :disabled="!products || products.length < limit" 
        @click="changePage(page + 1)"
        class="px-4 py-2 border rounded disabled:opacity-50"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { shopApi, type ShopProductItem } from '../../api/shop';
import { cartApi } from '../../api/cart';
import { useAuthStore } from '../../store/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();
const products = ref<ShopProductItem[]>([]);
const loading = ref(true);
const page = ref(1);
const limit = 12;

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await shopApi.getProducts(page.value, limit);
    console.log('🚀 获取商品列表 API Response:', res);
    // Robust extraction: handle different possible wrapper structures
    const data = (res as any);
    products.value = data.items || data.data?.items || data.data || [];
    
    // Safety check: ensure it's an array
    if (!Array.isArray(products.value)) {
      console.warn('获取商品列表失败：返回数据格式错误，预期数组但 got:', products.value);
      products.value = [];
    }
  } catch (error) {
    console.error('获取商品列表失败:', error);
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const changePage = (newPage: number) => {
  if (newPage < 1) return;
  page.value = newPage;
  fetchProducts();
};

const goToDetail = (id: string) => {
  router.push(`/shop/product/${id}`);
};

const handleAddToCart = async (product: any) => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('请先登录才能添加商品到购物车');
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    return;
  }

  // Use the defaultSkuId provided by backend list API if available to avoid extra fetch
  if (product.defaultSkuId) {
     try {
       await cartApi.addToCart(product.defaultSkuId, 1);
       ElMessage.success('商品已成功添加到购物车');
       return;
     } catch (error) {
       console.error(error);
       ElMessage.error('添加商品到购物车失败');
       return;
     }
  }

  // Fallback to fetch detail if defaultSkuId is missing (compatibility)
  try {
    const detail = await shopApi.getProductDetail(product.id);
    // Safe access with optional chaining
    const firstSku = detail.data?.skus?.[0];
    
    if (firstSku) {
      if (firstSku.id) {
        await cartApi.addToCart(firstSku.id, 1);
      } else {
        ElMessage.warning('SKU ID is missing');
      }
      ElMessage.success('Added to cart successfully');
    } else {
      ElMessage.warning('Product unavailable (No SKUs)');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to add to cart');
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
/* Tailwind utility classes assumed via PostCSS or similar setup. 
   If not available, standard CSS fallback: */
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-6 { gap: 1.5rem; }
@media (min-width: 768px) {
  .md\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.border { border: 1px solid #e5e7eb; }
.rounded-lg { border-radius: 0.5rem; }
.overflow-hidden { overflow: hidden; }
.h-48 { height: 12rem; }
.w-full { width: 100%; }
.object-cover { object-fit: cover; }
.p-4 { padding: 1rem; }
.font-bold { font-weight: 700; }
.text-red-600 { color: #dc2626; }
.text-center { text-align: center; }
.hover\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
.cursor-pointer { cursor: pointer; }
</style>
