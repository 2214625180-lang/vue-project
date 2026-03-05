<template>
  <div class="success-container container mx-auto p-4 text-center py-20">
    <el-icon class="text-green-500 text-8xl mb-6"><CircleCheckFilled /></el-icon>
    <h1 class="text-4xl font-bold mb-4">支付成功！</h1>
    <p class="text-gray-500 mb-8 text-lg">订单编号：{{ orderNo }}</p>
    
    <div class="flex justify-center gap-4">
      <router-link to="/shop">
        <el-button type="primary" size="large">继续购物</el-button>
      </router-link>
      <router-link to="/profile">
        <el-button size="large">查看订单详情</el-button>
      </router-link>
    </div>
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
.text-8xl { font-size: 6rem; line-height: 1; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.font-bold { font-weight: 700; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-green-500 { color: #22c55e; }
.text-gray-500 { color: #6b7280; }
.flex { display: flex; }
.justify-center { justify-content: center; }
.gap-4 { gap: 1rem; }
</style>
