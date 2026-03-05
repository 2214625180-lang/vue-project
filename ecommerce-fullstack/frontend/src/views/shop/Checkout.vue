<template>
  <div class="checkout-container container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">结账</h1>

    <div v-if="loading" class="text-center py-10">准备结账...</div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Address & Items -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Address Selection -->
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">Shipping Address</span>
              <router-link to="/profile" class="text-blue-600 text-sm">Manage Addresses</router-link>
            </div>
          </template>
          
          <div v-if="addresses.length === 0" class="text-gray-500 py-4">
            No addresses found. <router-link to="/profile" class="text-blue-600">Add one now</router-link>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="addr in addresses" 
              :key="addr.id"
              @click="selectedAddressId = addr.id"
              :class="[
                'border rounded p-4 cursor-pointer transition-all relative',
                selectedAddressId === addr.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="font-bold">{{ addr.receiverName }} <span class="text-gray-500 font-normal ml-2">{{ addr.phone }}</span></div>
              <div class="text-sm text-gray-600 mt-1">
                {{ addr.province }} {{ addr.city }} {{ addr.district }} <br>
                {{ addr.detailAddress }}
              </div>
              <el-icon v-if="selectedAddressId === addr.id" class="absolute top-2 right-2 text-blue-600"><Check /></el-icon>
            </div>
          </div>
        </el-card>

        <!-- Order Items -->
        <el-card>
          <template #header>
            <span class="font-bold">Order Items</span>
          </template>
          <div class="space-y-4">
            <div v-for="item in checkoutItems" :key="item.id" class="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
              <img :src="item.coverImage || 'placeholder.jpg'" class="w-20 h-20 object-cover rounded bg-gray-100" />
              <div class="flex-1">
                <div class="font-semibold">{{ item.spuName }}</div>
                <div class="text-sm text-gray-500">
                  <span v-for="(val, key) in item.specs" :key="key" class="mr-2">{{ key }}: {{ val }}</span>
                </div>
                <div class="flex justify-between mt-2">
                  <span class="text-red-600 font-bold">${{ Number(item.price).toFixed(2) }}</span>
                  <span class="text-gray-600">x {{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Right Column: Summary -->
      <div class="lg:col-span-1">
        <el-card class="sticky top-4">
          <template #header>
            <span class="font-bold">Order Summary</span>
          </template>
          <div class="space-y-2 text-gray-700">
            <div class="flex justify-between">
              <span>Subtotal ({{ totalQuantity }} items)</span>
              <span>${{ totalPrice.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div class="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span class="text-red-600">${{ totalPrice.toFixed(2) }}</span>
            </div>
          </div>
          
          <el-button 
            type="primary" 
            class="w-full mt-6" 
            size="large"
            :loading="submitting"
            :disabled="!selectedAddressId || checkoutItems.length === 0"
            @click="handleCheckout"
          >
            Place Order
          </el-button>
          
          <div v-if="!selectedAddressId" class="text-red-500 text-sm mt-2 text-center">
            Please select a shipping address
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { addressApi, type UserAddress } from '../../api/address';
import { cartApi, type CartItem } from '../../api/cart';
import { orderApi } from '../../api/order';
import { ElMessage, ElIcon } from 'element-plus';
import { Check } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute(); // In real app, we might pass selected skuIds via query or store

const loading = ref(true);
const submitting = ref(false);
const addresses = ref<UserAddress[]>([]);
const selectedAddressId = ref('');
const checkoutItems = ref<CartItem[]>([]);

// For demo, we fetch ALL cart items. 
// In production, we should only fetch items selected in the previous step.
// We could use a store or route query params (e.g. ?skuIds=1,2,3)
const fetchData = async () => {
  loading.value = true;
  try {
    const [addrRes, cartRes] = await Promise.all([
      addressApi.getList(),
      cartApi.getCart()
    ]);
    
    addresses.value = addrRes.data || [];
    
    // Auto-select default address
    const defaultAddr = addrRes.data.find(a => a.isDefault);
    if (defaultAddr) {
      selectedAddressId.value = defaultAddr.id;
    } else if (addresses.value.length > 0) {
      selectedAddressId.value = addresses.value[0]?.id ?? '';
    }

    checkoutItems.value = cartRes.data || []; // Ideally filter by route.query.skuIds if implemented
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to load checkout data');
  } finally {
    loading.value = false;
  }
};

const totalQuantity = computed(() => checkoutItems.value.reduce((sum, item) => sum + item.quantity, 0));
const totalPrice = computed(() => checkoutItems.value.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0));

const handleCheckout = async () => {
  if (!selectedAddressId.value) return;
  
  submitting.value = true;
  try {
    const res = await orderApi.checkout({
      addressId: selectedAddressId.value,
      skuIds: checkoutItems.value.map(item => item.id),
    });
    
    ElMessage.success('Order placed successfully!');
    // Redirect to payment placeholder
    router.push(`/shop/payment?orderNo=${res.data.orderNo}`);
  } catch (error: any) {
    console.error(error);
    // Error is handled by global interceptor usually, but we can be specific here
    // e.g. Inventory Shortage
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* Tailwind-like utilities */
.container { max-width: 1200px; margin: 0 auto; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.gap-6 { gap: 1.5rem; }
.gap-4 { gap: 1rem; }
.p-4 { padding: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-6 { margin-top: 1.5rem; }
.ml-2 { margin-left: 0.5rem; }
.mr-2 { margin-right: 0.5rem; }
.pb-4 { padding-bottom: 1rem; }
.pt-2 { padding-top: 0.5rem; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.flex-1 { flex: 1 1 0%; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-red-600 { color: #dc2626; }
.text-red-500 { color: #ef4444; }
.text-blue-600 { color: #2563eb; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.text-gray-700 { color: #374151; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-gray-100 { background-color: #f3f4f6; }
.border { border-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-t { border-top-width: 1px; }
.border-blue-600 { border-color: #2563eb; }
.border-gray-200 { border-color: #e5e7eb; }
.rounded { border-radius: 0.25rem; }
.w-20 { width: 5rem; }
.h-20 { height: 5rem; }
.w-full { width: 100%; }
.object-cover { object-fit: cover; }
.cursor-pointer { cursor: pointer; }
.relative { position: relative; }
.absolute { position: absolute; }
.top-2 { top: 0.5rem; }
.right-2 { right: 0.5rem; }
.top-4 { top: 1rem; }
.sticky { position: sticky; }
.text-center { text-align: center; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.space-y-6 > :not([hidden]) ~ :not([hidden]) { --tw-space-y-reverse: 0; margin-top: calc(1.5rem * calc(1 - var(--tw-space-y-reverse))); margin-bottom: calc(1.5rem * var(--tw-space-y-reverse)); }
.space-y-4 > :not([hidden]) ~ :not([hidden]) { --tw-space-y-reverse: 0; margin-top: calc(1rem * calc(1 - var(--tw-space-y-reverse))); margin-bottom: calc(1rem * var(--tw-space-y-reverse)); }
.space-y-2 > :not([hidden]) ~ :not([hidden]) { --tw-space-y-reverse: 0; margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse))); margin-bottom: calc(0.5rem * var(--tw-space-y-reverse)); }
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:col-span-2 { grid-column: span 2 / span 2; }
  .lg\:col-span-1 { grid-column: span 1 / span 1; }
}
</style>
