<template>
  <div class="payment-container container mx-auto p-4 py-20">
    <div v-if="loading" class="text-center">加载订单信息...</div>
    
    <div v-else class="max-w-md mx-auto bg-white border rounded-lg shadow-sm p-8 text-center">
      <h1 class="text-2xl font-bold mb-6">收银台</h1>
      
      <div class="mb-6">
        <p class="text-gray-500">订单编号</p>
        <p class="text-lg font-mono mb-2">{{ orderNo }}</p>
        <el-tag :type="status === 'CANCELLED' ? 'info' : status === 'PAID' ? 'success' : 'warning'">
          {{ status }}
        </el-tag>
      </div>

      <div class="mb-8">
        <p class="text-gray-500">待支付金额</p>
        <p class="text-3xl font-bold text-red-600">${{ Number(orderAmount).toFixed(2) }}</p>
      </div>

      <el-button
        v-if="status !== 'CANCELLED'"
        type="primary" 
        size="large" 
        class="w-full mb-4" 
        @click="handlePay"
        :loading="paying"
        :disabled="status === 'PAID'"
      >
        {{ status === 'PAID' ? '已支付' : '模拟支付' }}
      </el-button>
      <p v-else class="text-sm text-gray-500 mb-4">订单已关闭（超时）</p>
      
      <p v-if="paying" class="text-sm text-blue-600 animate-pulse">
        等待支付确认...
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { paymentApi } from '../../api/payment';
import { ElMessage } from 'element-plus';

interface OrderStatusResponse {
  status: string;
  orderNo: string;
  totalAmount: string;
}

const route = useRoute();
const router = useRouter();
const orderNo = route.query.orderNo as string;
const orderAmount = ref(0);
const status = ref('PENDING');
const loading = ref(true);
const paying = ref(false);
let pollTimer: number | null = null;

const fetchOrderInfo = async () => {
  if (!orderNo) return;
  try {
    const res = await paymentApi.getOrderStatus(orderNo);
    const data = res as unknown as OrderStatusResponse;
    orderAmount.value = Number(data.totalAmount);
    status.value = data.status;
    
    if (data.status === 'PAID') {
      handleSuccess();
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('加载订单信息失败');
  } finally {
    loading.value = false;
  }
};

const handlePay = async () => {
  if (status.value !== 'PENDING') {
    return;
  }
  paying.value = true;
  try {
    await paymentApi.mockPay(orderNo);
    ElMessage.info('支付已发起。等待回调...');
    startPolling();
  } catch (error) {
    console.error(error);
    paying.value = false;
  }
};

const startPolling = () => {
  if (pollTimer) return;
  
  pollTimer = window.setInterval(async () => {
    try {
      const res = await paymentApi.getOrderStatus(orderNo);
      const data = res as unknown as OrderStatusResponse;
      if (data.status === 'PAID') {
        status.value = 'PAID';
        handleSuccess();
      } else if (data.status === 'CANCELLED') {
        status.value = 'CANCELLED';
        paying.value = false;
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
        ElMessage.warning('订单已关闭（超时）');
      }
    } catch (error) {
      console.error(error);
    }
  }, 3000); // Poll every 3 seconds
};

const handleSuccess = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  paying.value = false;
  ElMessage.success('支付成功！');
  
  setTimeout(() => {
    router.push(`/shop/order-success?orderNo=${orderNo}`);
  }, 1000);
};

onMounted(() => {
  if (!orderNo) {
    ElMessage.error('无效的订单编号');
    router.push('/shop');
    return;
  }
  fetchOrderInfo();
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});
</script>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; }
.text-center { text-align: center; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.max-w-md { max-width: 28rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.bg-white { background-color: white; }
.border { border: 1px solid #e5e7eb; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.p-8 { padding: 2rem; }
.font-bold { font-weight: 700; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }
.text-gray-500 { color: #6b7280; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-red-600 { color: #dc2626; }
.w-full { width: 100%; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-blue-600 { color: #2563eb; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>
