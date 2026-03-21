<template>
  <div class="shop-home relative">
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-6">最新商品</h1>

      <div class="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          class="category-chip"
          :class="{ 'category-chip--active': activeCategoryId === '' }"
          @click="selectCategory()"
        >
          全部推荐
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="category-chip"
          :class="{ 'category-chip--active': activeCategoryId === category.id }"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </div>

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

    <button class="ai-chat-fab" type="button" @click="chatDrawerVisible = true">
      <span class="ai-chat-fab__icon">AI</span>
      <span class="ai-chat-fab__content">
        <strong>智能导购</strong>
        <small>帮你快速找商品</small>
      </span>
    </button>

    <el-drawer
      v-model="chatDrawerVisible"
      direction="rtl"
      size="min(92vw, 460px)"
      :with-header="false"
      :destroy-on-close="false"
      class="ai-chat-drawer"
    >
      <div class="ai-chat-drawer__body">
        <AIChat :preset-prompt="chatPresetPrompt" />
      </div>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { shopApi, type ShopProductItem } from '../../api/shop';
import { cartApi } from '../../api/cart';
import { useAuthStore } from '../../store/auth';
import { ElMessage } from 'element-plus';
import AIChat from '../../components/AIChat.vue';
import type { Category } from '../../api/product';
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const products = ref<ShopProductItem[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const page = ref(1);
const limit = 12;
const chatDrawerVisible = ref(false);
const activeCategoryId = ref('');

const currentCategoryName = computed(() => {
  if (!activeCategoryId.value) {
    return '';
  }

  return categories.value.find((category) => category.id === activeCategoryId.value)?.name ?? '';
});

const chatPresetPrompt = computed(() => {
  if (currentCategoryName.value) {
    return `我正在浏览「${currentCategoryName.value}」分类，请优先推荐这个分类下适合入门、热门和高性价比的商品方向，并补充选购建议。`;
  }

  return '我正在浏览商城首页推荐商品，请结合热门电商消费场景，推荐几个值得关注的商品类别，并告诉我每类商品怎么挑选更合适。';
});

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await shopApi.getProducts(page.value, limit, activeCategoryId.value || undefined);
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

const fetchCategories = async () => {
  try {
    const res = await shopApi.getCategories();
    const data = res as any;
    const items = data.data || data;
    categories.value = Array.isArray(items) ? items : [];
  } catch (error) {
    console.error('获取商品分类失败:', error);
    categories.value = [];
  }
};

const changePage = (newPage: number) => {
  if (newPage < 1) return;
  page.value = newPage;
  fetchProducts();
};

const selectCategory = (categoryId = '') => {
  activeCategoryId.value = categoryId;
  page.value = 1;
  fetchProducts();
};

watch(activeCategoryId, (categoryId) => {
  const nextQuery = { ...route.query };

  if (categoryId) {
    nextQuery.categoryId = categoryId;
  } else {
    delete nextQuery.categoryId;
  }

  void router.replace({
    query: nextQuery,
  });
});

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
  const queryCategoryId = Array.isArray(route.query.categoryId)
    ? route.query.categoryId[0]
    : route.query.categoryId;

  if (queryCategoryId) {
    activeCategoryId.value = queryCategoryId;
  }

  void fetchCategories();
  fetchProducts();
});
</script>

<style scoped>
/* Tailwind utility classes assumed via PostCSS or similar setup. 
   If not available, standard CSS fallback: */
.shop-home {
  min-height: 100vh;
}

.category-chip {
  border: 1px solid #dbe3f0;
  background: rgba(255, 255, 255, 0.88);
  color: #334155;
  border-radius: 999px;
  padding: 0.65rem 1rem;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-chip:hover {
  border-color: #93c5fd;
  color: #1d4ed8;
  transform: translateY(-1px);
}

.category-chip--active {
  border-color: #2563eb;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #1d4ed8;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.12);
}

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

.ai-chat-fab {
  position: fixed;
  right: 24px;
  bottom: 28px;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  border-radius: 999px;
  padding: 14px 18px 14px 14px;
  background: linear-gradient(135deg, #0f172a, #2563eb);
  color: #fff;
  box-shadow: 0 18px 45px rgba(37, 99, 235, 0.28);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ai-chat-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 50px rgba(37, 99, 235, 0.34);
}

.ai-chat-fab__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.ai-chat-fab__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
}

.ai-chat-fab__content strong {
  font-size: 0.95rem;
}

.ai-chat-fab__content small {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.74rem;
}

.ai-chat-drawer__body {
  height: 100%;
  padding: 12px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.ai-chat-drawer__body :deep(.chat-shell) {
  min-height: 100%;
}

.ai-chat-drawer :deep(.el-drawer) {
  background: transparent;
}

.ai-chat-drawer :deep(.el-drawer__body) {
  padding: 0;
}

@media (max-width: 640px) {
  .ai-chat-fab {
    right: 16px;
    bottom: 20px;
    padding-right: 16px;
  }

  .ai-chat-fab__content small {
    display: none;
  }
}
</style>
