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
          <span v-else>No Image</span>
        </div>
      </div>

      <!-- Right: Product Info -->
      <div class="product-info">
        <div class="mb-4">
          <span class="text-sm text-blue-600 font-semibold uppercase tracking-wide">
            {{ product.category?.name }}
          </span>
          <h1 class="text-3xl font-bold mt-2">{{ product.name }}</h1>
          <p class="text-gray-500 mt-2">{{ product.description }}</p>
        </div>

        <div class="price-section text-2xl font-bold text-red-600 mb-6">
          ${{ currentPrice }}
        </div>

        <!-- SKU Selector Placeholder -->
        <div class="sku-selector mb-6 p-4 border rounded bg-gray-50">
          <h3 class="font-semibold mb-2">Select Options:</h3>
          <!-- 
            TODO: Implement Dynamic SKU Selection Logic
            1. Extract unique attributes (Color, Size) from all SKUs.
            2. Render clickable tags for each attribute value.
            3. On click, filter available SKUs.
            4. Disable combinations that result in 0 stock.
            5. Update `selectedSku` based on full selection.
          -->
          <p class="text-sm text-gray-500 italic">
            (Dynamic SKU Matrix Selection UI will be implemented here. Currently displaying default/first SKU.)
          </p>
        </div>

        <div class="actions flex gap-4">
          <button 
            class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
            :disabled="!selectedSku || selectedSku.stock <= 0"
          >
            Add to Cart
          </button>
          <button class="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition">
            Wishlist
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="text-center py-20">
    Loading Product...
  </div>
  <div v-else class="text-center py-20 text-red-500">
    Product not found.
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { shopApi, type ShopProductDetail } from '../../api/shop';
import type { ProductSku } from '../../api/product';

const route = useRoute();
const product = ref<ShopProductDetail | null>(null);
const loading = ref(false);
const selectedSku = ref<ProductSku | null>(null);

const currentPrice = computed(() => {
  if (selectedSku.value) return Number(selectedSku.value.price).toFixed(2);
  if (product.value && product.value.skus.length > 0) {
    // Default to min price or first sku price
    return Number(product.value.skus[0].price).toFixed(2);
  }
  return '0.00';
});

const fetchDetail = async () => {
  const id = route.params.spuId as string;
  if (!id) return;

  loading.value = true;
  try {
    const res = await shopApi.getProductDetail(id);
    product.value = res;
    // Default select first SKU if available
    if (res.skus.length > 0) {
      selectedSku.value = res.skus[0];
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
