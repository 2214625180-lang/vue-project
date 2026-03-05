<template>
  <div class="user-profile">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户个人信息</span>
        </div>
      </template>
      <div v-if="user">
        <p><strong>邮箱:</strong> {{ user.email }}</p>
        <p><strong>角色:</strong> {{ user.role }}</p>
        <p><strong>用户ID:</strong> {{ user.userId }}</p>
      </div>
      <div v-else>
        <p>加载个人信息中...</p>
      </div>
      <el-button type="primary" class="mt-4" @click="$router.push('/address')">管理收货地址</el-button>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import request from '../utils/request';

const user = ref<any>(null);

onMounted(async () => {
  try {
    const response = await request.get('/user/profile');
    user.value = response.data;
  } catch (error) {
    console.error('Failed to fetch profile', error);
  }
});
</script>

<style scoped>
.user-profile {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}
</style>
