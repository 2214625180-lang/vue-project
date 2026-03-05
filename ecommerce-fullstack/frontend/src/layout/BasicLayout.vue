<template>
  <el-container class="min-h-screen">
    <el-header class="bg-white border-b shadow-sm flex items-center justify-between px-6">
      <div class="flex items-center">
        <h1 class="text-xl font-bold text-blue-600 mr-8">E-Commerce</h1>
        <nav class="hidden md:flex space-x-6">
          <router-link to="/" class="text-gray-600 hover:text-blue-600 font-medium">Home</router-link>
          <router-link to="/shop/cart" class="text-gray-600 hover:text-blue-600 font-medium">Cart</router-link>
          <router-link to="/user/my-orders" class="text-gray-600 hover:text-blue-600 font-medium">My Orders</router-link>
        </nav>
      </div>
      
      <div class="flex items-center space-x-4">
        <template v-if="authStore.isAuthenticated">
          <span class="text-sm text-gray-500">Welcome</span>
          <el-button type="primary" link @click="handleLogout">Logout</el-button>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button type="primary">Login</el-button>
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
