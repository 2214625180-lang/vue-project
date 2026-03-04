<template>
  <div class="max-w-4xl mx-auto p-4">
    <h2 class="text-2xl font-bold mb-6">My Orders</h2>

    <el-tabs v-model="activeStatus" @tab-change="handleTabChange" class="mb-6">
      <el-tab-pane label="All" name=""></el-tab-pane>
      <el-tab-pane label="Pending" name="PENDING"></el-tab-pane>
      <el-tab-pane label="Paid" name="PAID"></el-tab-pane>
      <el-tab-pane label="Shipped" name="SHIPPED"></el-tab-pane>
      <el-tab-pane label="Completed" name="COMPLETED"></el-tab-pane>
    </el-tabs>

    <div v-loading="loading">
      <div v-if="orderList.length === 0" class="text-center py-10 text-gray-500">
        No orders found.
      </div>

      <div v-else class="space-y-6">
        <el-card v-for="order in orderList" :key="order.id" shadow="hover" class="order-card">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-500">
                <span class="mr-4">Order No: {{ order.orderNo }}</span>
                <span>{{ formatDate(order.createdAt) }}</span>
              </div>
              <el-tag :type="getStatusType(order.status)">{{ order.status }}</el-tag>
            </div>
          </template>

          <div class="space-y-4">
            <div v-for="item in order.items" :key="item.id" class="flex items-start gap-4 py-2 border-b last:border-0 border-gray-100">
              <div class="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img v-if="item.coverImage" :src="item.coverImage" alt="Product" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                  No Image
                </div>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-gray-800">{{ item.spuName }}</h4>
                <div class="text-sm text-gray-500 mt-1">
                  <span v-for="(val, key) in parseSpecs(item.skuSpecs)" :key="key" class="mr-2">
                    {{ key }}: {{ val }}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <div class="font-medium">¥{{ item.price }}</div>
                <div class="text-sm text-gray-500">x {{ item.quantity }}</div>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-between items-center">
              <div class="font-bold text-lg">
                Total: <span class="text-red-600">¥{{ order.totalAmount }}</span>
              </div>
              <div class="space-x-3">
                <el-button 
                  v-if="order.status === 'PENDING'" 
                  type="primary" 
                  size="small" 
                  @click="goToPayment(order.orderNo)"
                >
                  Pay Now
                </el-button>
                <el-button 
                  v-if="order.status === 'SHIPPED'" 
                  type="success" 
                  size="small" 
                  plain
                  @click="handleConfirmReceipt(order)"
                >
                  Confirm Receipt
                </el-button>
                <span v-if="order.status === 'CANCELLED'" class="text-sm text-gray-500">
                  Order Closed (Timeout)
                </span>
              </div>
            </div>
          </template>
        </el-card>
      </div>

      <div class="flex justify-center mt-8">
        <el-pagination
          v-if="total > 0"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchOrders"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { orderApi, type Order, type OrderStatus, type PaginatedResponse } from '../../api/order';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const orderList = ref<Order[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const activeStatus = ref<OrderStatus | ''>('');

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await orderApi.getMyOrders({
      page: currentPage.value,
      limit: pageSize.value,
      status: activeStatus.value || undefined,
    });
    const data = res as unknown as PaginatedResponse<Order>;
    orderList.value = data.items;
    total.value = data.total;
  } catch (error) {
    console.error('Failed to fetch orders', error);
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  currentPage.value = 1;
  fetchOrders();
};

const goToPayment = (orderNo: string) => {
  router.push({ name: 'payment', query: { orderNo } });
};

const handleConfirmReceipt = async (order: Order) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you have received the goods?',
      'Confirm Receipt',
      {
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        type: 'warning',
      }
    );
    
    await orderApi.confirmReceipt(order.id);
    ElMessage.success('Order completed successfully');
    fetchOrders();
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error);
    }
  }
};

const getStatusType = (status: string) => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'PAID': return 'success';
    case 'SHIPPED': return 'primary';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'info';
    default: return 'info';
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString();
};

const parseSpecs = (specs: unknown): Record<string, string> => {
  if (typeof specs === 'string') {
    try {
      return JSON.parse(specs) as Record<string, string>;
    } catch (e) {
      return {};
    }
  }
  if (specs && typeof specs === 'object') {
    return specs as Record<string, string>;
  }
  return {};
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.order-card :deep(.el-card__header) {
  padding: 12px 20px;
  background-color: #f9fafb;
}
.order-card :deep(.el-card__footer) {
  padding: 12px 20px;
  background-color: #f9fafb;
}
</style>
