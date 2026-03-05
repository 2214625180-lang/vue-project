<template>
  <div class="max-w-4xl mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">我的订单</h2>
      <div class="flex items-center gap-4">
        <el-upload
          class="upload-demo"
          :http-request="customUpload"
          :show-file-list="false"
        >
          <el-button type="primary">上传订单截图</el-button>
        </el-upload>
        <el-image 
          v-if="uploadedImageUrl" 
          :src="uploadedImageUrl" 
          :preview-src-list="[uploadedImageUrl]"
          class="w-10 h-10 rounded border"
        />
      </div>
    </div>

    <el-tabs v-model="activeStatus" @tab-change="handleTabChange" class="mb-6">
      <el-tab-pane label="全部订单" name=""></el-tab-pane>
      <el-tab-pane label="待付款" name="PENDING"></el-tab-pane>
      <el-tab-pane label="已付款" name="PAID"></el-tab-pane>
      <el-tab-pane label="已发货" name="SHIPPED"></el-tab-pane>
      <el-tab-pane label="已完成" name="COMPLETED"></el-tab-pane>
    </el-tabs>

    <div v-loading.fullscreen.lock="isPaying">
      <div v-loading="loading">
        <div v-if="!orderList || orderList.length === 0" class="text-center py-10 text-gray-500">
          暂无订单
        </div>

      <div v-else class="space-y-6">
        <el-card v-for="order in orderList" :key="order.id" shadow="hover" class="order-card">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-500">
                <span class="mr-4">订单号: {{ order.orderNo }}</span>
                <span>{{ formatDate(order.createdAt) }}</span>
              </div>
              <el-tag :type="getStatusType(order.status)">
  {{ 
    order.status === 'PENDING' ? '待付款' :
    order.status === 'PAID' ? '已付款' :
    order.status === 'SHIPPED' ? '已发货' :
    order.status === 'COMPLETED' ? '已完成' :
    order.status === 'CANCELLED' ? '已取消' : order.status
  }}
</el-tag>
            </div>
          </template>

          <div class="space-y-4">
            <div v-for="item in order.items" :key="item.id" class="flex items-start gap-4 py-2 border-b last:border-0 border-gray-100">
              <div class="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <el-image 
                  v-if="getItemImage(item)" 
                  :src="getItemImage(item)" 
                  fit="cover"
                  class="w-full h-full"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                  无图片
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
              <div class="flex flex-col items-end justify-center ml-auto">
                <span class="text-lg font-bold text-red-500 mb-1">¥{{ item.price }}</span>
                <span class="text-sm text-gray-400">x {{ item.quantity }}</span>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-between items-center">
              <div class="font-bold text-lg">
                订单金额: <span class="text-red-600">¥{{ order.totalAmount }}</span>
              </div>
              <div class="space-x-3">
                <el-button 
                  v-if="order.status === 'PENDING'" 
                  type="primary" 
                  size="small" 
                  @click="handlePayNow(order.id)"
                >
                  去支付
                </el-button>
                <el-button 
                  v-if="order.status === 'SHIPPED'" 
                  type="success" 
                  size="small" 
                  plain
                  @click="handleConfirmReceipt(order)"
                >
                  确认收货
                </el-button>
                <span v-if="order.status === 'CANCELLED'" class="text-sm text-gray-500">
                  订单已关闭（超时未支付）
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { orderApi, type Order, type OrderStatus, type PaginatedResponse } from '../../api/order';
import { paymentApi } from '../../api/payment'; // Assuming this exists or we add it
import { uploadApi } from '../../api/upload'; // Import upload API
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const isPaying = ref(false); // For fullscreen loader
const orderList = ref<Order[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const activeStatus = ref<OrderStatus | ''>('');
const uploadedImageUrl = ref('');

const customUpload = async (options: UploadRequestOptions) => {
  try {
    const res = await uploadApi.uploadImage(options.file);
    uploadedImageUrl.value = (res as any).url;
    ElMessage.success('Image uploaded successfully');
  } catch (error) {
    console.error('Upload failed', error);
    ElMessage.error('Upload failed');
  }
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await orderApi.getMyOrders({
      page: currentPage.value,
      limit: pageSize.value,
      status: activeStatus.value || undefined,
    });
    // Assuming API returns { items: [], total: 0 } structure directly or inside data
    const data = (res as any).data || res; 
    console.log('Orders response:', data); // Debug log
    orderList.value = data.items || [];
    total.value = data.total || 0;
  } catch (error) {
    console.error('Failed to fetch orders', error);
    orderList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  currentPage.value = 1;
  fetchOrders();
};

// Renamed from goToPayment to handlePayNow to implement the mock payment logic directly
    const handlePayNow = async (orderId: string) => {
      try {
        await ElMessageBox.confirm('是否确认支付该订单？', '订单支付', {
          confirmButtonText: '确认支付',
          cancelButtonText: '取消',
          type: 'info',
        });
    
        isPaying.value = true;
        await paymentApi.mockPay(orderId);
        
        ElMessage.success('支付成功！');
        fetchOrders(); // Refresh status
      } catch (error) {
        if (error !== 'cancel') {
          console.error(error);
          ElMessage.error('支付失败');
        }
      } finally {
        isPaying.value = false;
      }
    };
    
    const handleConfirmReceipt = async (order: Order) => {
      try {
        await ElMessageBox.confirm(
          '是否确认已收到商品？',
          '确认收货',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
        
        await orderApi.confirmReceipt(order.id);
        ElMessage.success('订单已完成');
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

const getItemImage = (orderItem: any) => {
  if (!orderItem) return '';
  return orderItem.image || // Check the new flattened image field
         orderItem.product?.mainImage || 
         orderItem.sku?.product?.mainImage || 
         orderItem.sku?.spu?.mainImage || 
         orderItem.sku?.image || 
         orderItem.mainImage || 
         orderItem.coverImage ||
         '';
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
