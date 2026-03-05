<template>
  <div class="product-detail container mx-auto p-4" v-if="product">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Left: Image Gallery -->
      <div class="image-gallery">
        <div class="main-image h-96 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          <img 
            v-if="selectedSku?.coverImage || product.skus[0]?.coverImage" 
            :src="selectedSku?.coverImage || product.skus[0]?.coverImage" 
            class="h-full w-full object-contain"
          />
          <span v-else>暂无图片</span>
        </div>
      </div>

      <!-- Right: Product Info -->
      <div class="product-info">
        <div class="mb-4">
          <span class="text-sm text-blue-600 font-semibold uppercase tracking-wide">
            {{ product.category?.name || '未分类' }}
          </span>
          <h1 class="text-3xl font-bold mt-2">{{ product.name }}</h1>
          <p class="text-gray-500 mt-2">{{ product.description }}</p>
        </div>

        <div class="price-section text-2xl font-bold text-red-600 mb-6">
          ¥{{ currentPrice }}
        </div>

        <!-- SKU Selector -->
        <div class="sku-selector mb-6 p-4 border rounded bg-gray-50">
          <h3 class="font-semibold mb-3">选择规格 (颜色):</h3>
          <div class="flex flex-wrap gap-3">
            <button 
              v-for="color in availableColors" 
              :key="color"
              class="px-4 py-2 border rounded-md transition-all duration-200"
              :class="selectedColor === color 
                ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' 
                : 'border-gray-200 hover:border-blue-400 text-gray-700'"
              @click="handleColorSelect(color)"
            >
              {{ color }}
            </button>
          </div>
        </div>

        <div class="actions flex gap-4">
          <button 
            class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            :disabled="!selectedSku || selectedSku.stock <= 0"
            @click="addToCart"
          >
            <el-icon><ShoppingCart /></el-icon>
            加入购物车
          </button>
          <button 
            class="py-3 px-6 rounded-lg font-semibold transition border flex items-center justify-center gap-2"
            :class="isFavorited ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200'"
            @click="toggleFavorite"
          >
            <el-icon v-if="isFavorited"><StarFilled /></el-icon>
            <el-icon v-else><Star /></el-icon>
            {{ isFavorited ? '已收藏' : '收藏' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="text-center py-20">
    加载中...
  </div>
  <div v-else class="text-center py-20 text-red-500">
    商品不存在。
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Star, StarFilled, ShoppingCart } from '@element-plus/icons-vue';
import { shopApi, type ShopProductDetail } from '../../api/shop';
import { cartApi } from '../../api/cart';
import type { ProductSku } from '../../api/product';

const route = useRoute();
const product = ref<ShopProductDetail | null>(null);
const loading = ref(false);
const selectedSku = ref<ProductSku | null>(null);
const selectedColor = ref('');
const isFavorited = ref(false);

// Fallback colors if no specific attributes are found
const availableColors = ['默认色', '典雅黑', '月光白', '极光蓝'];

const currentPrice = computed(() => {
  if (selectedSku.value) return Number(selectedSku.value.price).toFixed(2);
  if (product.value && product.value.skus.length > 0) {
    // Default to min price or first sku price
    return Number(product.value.skus[0]?.price ?? 0).toFixed(2);
  }
  return '0.00';
});

const handleColorSelect = (color: string) => {
  selectedColor.value = color;
  // In a real app, we would filter SKUs by attributes.
  // Here we just mock the selection by ensuring selectedSku is set if it wasn't already.
  // If we had real attribute data, we'd do:
  // selectedSku.value = product.value.skus.find(s => s.specs.color === color) || product.value.skus[0];
  
  if (!selectedSku.value && product.value?.skus?.length) {
      selectedSku.value = product.value.skus[0] as ProductSku;
  }
};

const addToCart = async () => {
  if (!selectedColor.value) {
    ElMessage.warning('请先选择商品规格');
    return;
  }
  
  if (!selectedSku.value || !selectedSku.value.id) {
     ElMessage.error('商品SKU无效');
     return;
  }

  try {
    await cartApi.addToCart(selectedSku.value.id, 1);
    ElMessage.success('已加入购物车');
  } catch (error) {
    console.error(error);
    ElMessage.error('加入购物车失败');
  }
};

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value;
  if (isFavorited.value) {
    ElMessage.success('已加入收藏');
  } else {
    ElMessage.success('已取消收藏');
  }
};

const fetchDetail = async () => {
  const id = route.params.spuId as string;
  if (!id) return;

  loading.value = true;
  try {
    const res = await shopApi.getProductDetail(id);
    const data = (res as any).data || res;
    product.value = data;
    // Default select first SKU if available
    if (data?.skus && data.skus.length > 0) {
      selectedSku.value = data.skus[0] as ProductSku;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
/* Basic layout styles mimicking Tailwind */
.container { max-width: 1200px; margin: 0 auto; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.gap-8 { gap: 2rem; }
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.h-96 { height: 24rem; }
.bg-gray-100 { background-color: #f3f4f6; }
.object-contain { object-fit: contain; }
.text-blue-600 { color: #2563eb; }
.text-red-600 { color: #dc2626; }
.flex { display: flex; }
.flex-1 { flex: 1 1 0%; }
.gap-4 { gap: 1rem; }
.rounded-lg { border-radius: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.font-bold { font-weight: 700; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
</style>
