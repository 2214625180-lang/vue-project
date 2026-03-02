<template>
  <div class="shop-home container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Latest Products</h1>
    
    <div v-if="loading" class="text-center py-10">Loading...</div>
    
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6">
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
          <span v-else class="text-gray-400">No Image</span>
        </div>
        
        <div class="p-4">
          <h3 class="text-lg font-semibold truncate">{{ product.name }}</h3>
          <p class="text-sm text-gray-500 mb-2">{{ product.spuNo }}</p>
          <div class="text-xl font-bold text-red-600">
            ${{ product.price.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Simple Pagination for Demo -->
    <div class="mt-8 flex justify-center gap-2">
      <button 
        :disabled="page === 1" 
        @click="changePage(page - 1)"
        class="px-4 py-2 border rounded disabled:opacity-50"
      >
        Prev
      </button>
      <span class="px-4 py-2">Page {{ page }}</span>
      <button 
        :disabled="products.length < limit" 
        @click="changePage(page + 1)"
        class="px-4 py-2 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { shopApi, type ShopProductItem } from '../../api/shop';

const router = useRouter();
const products = ref<ShopProductItem[]>([]);
const loading = ref(false);
const page = ref(1);
const limit = 12;

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await shopApi.getProducts(page.value, limit);
    products.value = res.items;
  } catch (error) {
    console.error(error);
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
