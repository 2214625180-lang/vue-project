<template>
  <div class="cart-container container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">购物车</h1>

    <div v-if="loading" class="text-center py-10">加载购物车中...</div>
    
    <div v-else-if="!cartItems || cartItems.length === 0" class="text-center py-10 text-gray-500">
      您的购物车为空。 <router-link to="/shop" class="text-blue-600">去购物</router-link>
    </div>

    <div v-else>
      <el-table
        :data="cartItems"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        border
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="商品" min-width="300">
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

        <el-table-column label="单价" width="120">
          <template #default="{ row }">
            ${{ Number(row.price).toFixed(2) }}
          </template>
        </el-table-column>

        <el-table-column label="数量" width="180">
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

        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span class="font-bold text-red-600">
              ${{ (Number(row.price) * row.quantity).toFixed(2) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button 
              type="danger" 
              link 
              size="small" 
              @click="removeItem(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Bottom Bar -->
      <div class="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
        <div class="text-gray-600">
          已选择: <span class="font-bold text-black">{{ selectedCount }}</span> 项
        </div>
        <div class="flex items-center gap-6">
          <div class="text-xl">
            总价: <span class="font-bold text-red-600">${{ totalPrice.toFixed(2) }}</span>
          </div>
          <el-button 
            type="primary" 
            size="large" 
            :disabled="selectedCount === 0"
            @click="checkout"
          >
            去结算
          </el-button>
        </div>
      </div>
    </div>
    <!-- Checkout Dialog -->
    <el-dialog v-model="checkoutVisible" title="确认订单信息" width="500px">
      <div class="mb-4">
        <h3 class="font-bold mb-2">选择收货地址</h3>
        <div v-if="addresses.length > 0" class="max-h-60 overflow-y-auto">
          <el-radio-group v-model="selectedAddressId" class="w-full flex flex-col gap-3">
            <el-radio 
              v-for="addr in addresses" 
              :key="addr.id" 
              :label="addr.id"
              class="border p-3 rounded-lg mr-0 w-full flex items-start h-auto"
            >
              <div class="flex flex-col text-left">
                <span class="font-bold">{{ addr.receiverName }} <span class="text-gray-500 font-normal ml-2">{{ addr.phone }}</span></span>
                <span class="text-sm text-gray-600 mt-1">{{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detailAddress }}</span>
              </div>
            </el-radio>
          </el-radio-group>
        </div>
        <div v-else class="text-center py-6 text-gray-500">
          暂无收货地址，请先前往 <router-link to="/address" class="text-blue-600">个人中心</router-link> 添加
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkoutVisible = false">取消</el-button>
          <el-button type="primary" @click="submitOrder" :loading="submitting" :disabled="addresses.length === 0">
            提交订单
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { cartApi, type CartItem } from '../../api/cart';
import { orderApi } from '../../api/order';
import { addressApi, type UserAddress } from '../../api/address';
import { ElMessage, ElMessageBox } from 'element-plus';
import { debounce } from 'lodash-es';

const router = useRouter();
const loading = ref(false);
const cartItems = ref<CartItem[]>([]);
const selectedItems = ref<CartItem[]>([]);
const addresses = ref<UserAddress[]>([]);
const selectedAddressId = ref('');
const checkoutVisible = ref(false);
const submitting = ref(false);

const fetchCart = async () => {
  loading.value = true;
  try {
    const res = await cartApi.getCart();
    cartItems.value = res.data || [];
  } catch (error) {
    console.error(error);
    cartItems.value = [];
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
    ElMessage.error('更新数量失败');
    fetchCart(); // Revert on error
  }
}, 500);

const handleQuantityChange = (skuId: string, quantity: number) => {
  if (!quantity) return;
  updateQuantityApi(skuId, quantity);
};

const removeItem = async (skuId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这一项吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await cartApi.removeFromCart([skuId]);
    ElMessage.success('删除成功');
    // Optimistic update or refetch
    cartItems.value = cartItems.value.filter(item => item.id !== skuId);
    // Also remove from selected if present
    selectedItems.value = selectedItems.value.filter(item => item.id !== skuId);
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
      ElMessage.error('删除失败');
    }
  }
};

const fetchAddresses = async () => {
  try {
    const res = await addressApi.getList();
    addresses.value = res.data || [];
    if (addresses.value.length > 0) {
      const defaultAddr = addresses.value.find(a => a.isDefault);
      selectedAddressId.value = defaultAddr ? defaultAddr.id : addresses.value[0]?.id ?? '';
    }
  } catch (error) {
    console.error('Failed to fetch addresses', error);
  }
};

const checkout = async () => {
  if (selectedItems.value.length === 0) return;
  checkoutVisible.value = true;
  fetchAddresses(); // Fetch addresses when dialog opens
};

const submitOrder = async () => {
  if (!selectedAddressId.value) {
    ElMessage.warning('请选择收货地址');
    return;
  }

  submitting.value = true;
  try {
    const skuIds = selectedItems.value.map(i => i.id);
    await orderApi.createOrder(skuIds); 
    
    await orderApi.createOrder(skuIds, selectedAddressId.value); 
    ElMessage.success('订单创建成功！');
    checkoutVisible.value = false;
    router.push('/user/my-orders');
  } catch (error: any) {
    console.error(error);
    ElMessage.error(error.response?.data?.message || '订单创建失败');
  } finally {
    submitting.value = false;
  }
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
