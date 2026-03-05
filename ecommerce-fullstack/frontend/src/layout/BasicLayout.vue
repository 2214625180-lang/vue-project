<template>
  <el-container class="min-h-screen">
    <el-header class="bg-white border-b shadow-sm flex items-center justify-between px-6">
      <div class="flex items-center">
        <h1 class="text-xl font-bold text-blue-600 mr-8">新星商城</h1>
        <nav class="hidden md:flex space-x-6">
          <router-link to="/" class="text-gray-600 hover:text-blue-600 font-medium">首页</router-link>
          <router-link to="/shop/cart" class="text-gray-600 hover:text-blue-600 font-medium">购物车</router-link>
          <router-link to="/user/my-orders" class="text-gray-600 hover:text-blue-600 font-medium">我的订单</router-link>
          <router-link to="/profile" class="text-gray-600 hover:text-blue-600 font-medium">个人中心</router-link>
        </nav>
      </div>
      
      <div class="flex items-center space-x-4">
        <template v-if="authStore.isAuthenticated">
          <span class="text-sm text-gray-500">欢迎，{{ authStore.user?.username || '用户' }}</span>
          <el-button type="primary" link @click="handleLogout">退出登录</el-button>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button type="primary">登录</el-button>
          </router-link>
        </template>
      </div>
    </el-header>
    
    <el-main class="bg-gray-50 p-6">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.el-header {
  height: 64px;
}
</style>
