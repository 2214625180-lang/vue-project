<template>
  <div class="user-profile">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>User Profile</span>
        </div>
      </template>
      <div v-if="user">
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>Role:</strong> {{ user.role }}</p>
        <p><strong>User ID:</strong> {{ user.userId }}</p>
      </div>
      <div v-else>
        Loading...
      </div>
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
