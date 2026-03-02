<template>
  <div class="payment-container container mx-auto p-4 text-center py-20">
    <el-icon class="text-green-500 text-6xl mb-4"><CircleCheckFilled /></el-icon>
    <h1 class="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
    <p class="text-gray-500 mb-8">Order No: {{ orderNo }}</p>
    
    <div class="p-8 bg-gray-50 border rounded-lg max-w-md mx-auto mb-8">
      <h2 class="text-xl font-semibold mb-4">Payment Gateway Placeholder</h2>
      <p class="text-gray-600 mb-4">Total Amount: <span class="text-red-600 font-bold">$XXX.XX</span></p>
      <el-button type="primary" size="large" class="w-full">Pay Now (Simulated)</el-button>
    </div>

    <router-link to="/shop">
      <el-button>Continue Shopping</el-button>
    </router-link>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { CircleCheckFilled } from '@element-plus/icons-vue';

const route = useRoute();
const orderNo = computed(() => route.query.orderNo);
</script>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; }
.text-center { text-align: center; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }
.text-green-500 { color: #22c55e; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.text-red-600 { color: #dc2626; }
.bg-gray-50 { background-color: #f9fafb; }
.border { border: 1px solid #e5e7eb; }
.rounded-lg { border-radius: 0.5rem; }
.max-w-md { max-width: 28rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.p-8 { padding: 2rem; }
.w-full { width: 100%; }
</style>
