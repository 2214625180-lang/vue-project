<template>
  <div class="cart-container container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Shopping Cart</h1>

    <div v-if="loading" class="text-center py-10">Loading cart...</div>

    <div v-else-if="cartItems.length === 0" class="text-center py-10 text-gray-500">
      Your cart is empty. <router-link to="/shop" class="text-blue-600">Go Shopping</router-link>
    </div>

    <div v-else>
      <el-table
        :data="cartItems"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        border
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="Product" min-width="300">
          <template #default="{ row }">
            <div class="flex items-center gap-4">
              <img 
                :src="row.coverImage || 'placeholder.jpg'" 
                class="w-16 h-16 object-cover rounded bg-gray-100" 
              />
              <div>
                <div class="font-semibold">{{ row.spuName }}</div>
                <div class="text-xs text-gray-500">
                  <span v-for="(val, key) in row.specs" :key="key" class="mr-2">
                    {{ key }}: {{ val }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Price" width="120">
          <template #default="{ row }">
            ${{ Number(row.price).toFixed(2) }}
          </template>
        </el-table-column>

        <el-table-column label="Quantity" width="180">
          <template #default="{ row }">
            <el-input-number 
              v-model="row.quantity" 
              :min="1" 
              :max="row.stock" 
              size="small"
              @change="(val: number) => handleQuantityChange(row.id, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Subtotal" width="120">
          <template #default="{ row }">
            <span class="font-bold text-red-600">
              ${{ (Number(row.price) * row.quantity).toFixed(2) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="Action" width="100">
          <template #default="{ row }">
            <el-button 
              type="danger" 
              link 
              size="small" 
              @click="removeItem(row.id)"
            >
              Remove
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Bottom Bar -->
      <div class="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
        <div class="text-gray-600">
          Selected: <span class="font-bold text-black">{{ selectedCount }}</span> items
        </div>
        <div class="flex items-center gap-6">
          <div class="text-xl">
            Total: <span class="font-bold text-red-600">${{ totalPrice.toFixed(2) }}</span>
          </div>
          <el-button 
            type="primary" 
            size="large" 
            :disabled="selectedCount === 0"
            @click="checkout"
          >
            Checkout
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { cartApi, type CartItem } from '../../api/cart';
import { ElMessage, ElMessageBox } from 'element-plus';
import { debounce } from 'lodash-es';

const loading = ref(false);
const cartItems = ref<CartItem[]>([]);
const selectedItems = ref<CartItem[]>([]);

const fetchCart = async () => {
  loading.value = true;
  try {
    const res = await cartApi.getCart();
    cartItems.value = res;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleSelectionChange = (val: CartItem[]) => {
  selectedItems.value = val;
};

// Debounced update to avoid spamming API
const updateQuantityApi = debounce(async (skuId: string, quantity: number) => {
  try {
    await cartApi.updateQuantity(skuId, quantity);
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to update quantity');
    fetchCart(); // Revert on error
  }
}, 500);

const handleQuantityChange = (skuId: string, quantity: number) => {
  if (!quantity) return;
  updateQuantityApi(skuId, quantity);
};

const removeItem = async (skuId: string) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to remove this item?', 'Warning', {
      type: 'warning',
    });
    await cartApi.removeFromCart([skuId]);
    ElMessage.success('Item removed');
    // Optimistic update or refetch
    cartItems.value = cartItems.value.filter(item => item.id !== skuId);
    // Also remove from selected if present
    selectedItems.value = selectedItems.value.filter(item => item.id !== skuId);
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
    }
  }
};

const checkout = () => {
  if (selectedItems.value.length === 0) return;
  ElMessage.info('Proceeding to checkout with ' + selectedItems.value.length + ' items');
  // Logic to navigate to checkout page with selected SKU IDs
};

const selectedCount = computed(() => selectedItems.value.length);

const totalPrice = computed(() => {
  return selectedItems.value.reduce((sum, item) => {
    return sum + (Number(item.price) * item.quantity);
  }, 0);
});

onMounted(() => {
  fetchCart();
});
</script>

<style scoped>
/* Tailwind-like utilities */
.container { max-width: 1200px; margin: 0 auto; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.w-16 { width: 4rem; }
.h-16 { height: 4rem; }
.object-cover { object-fit: cover; }
.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-50 { background-color: #f9fafb; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.text-red-600 { color: #dc2626; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.p-4 { padding: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-6 { margin-top: 1.5rem; }
.border { border: 1px solid #e5e7eb; }
.mr-2 { margin-right: 0.5rem; }
.text-center { text-align: center; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
</style>
