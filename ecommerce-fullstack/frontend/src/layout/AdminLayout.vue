<template>
  <el-container class="h-screen w-full">
    <el-aside width="240px" class="bg-gray-800 text-white flex flex-col">
      <div class="h-16 flex items-center justify-center font-bold text-xl border-b border-gray-700">
        管理员后台
      </div>
      <el-menu
        router
        :default-active="$route.path"
        background-color="#1f2937"
        text-color="#fff"
        active-text-color="#409eff"
        class="border-r-0 flex-1"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>总结表格</span>
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="bg-white border-b flex items-center justify-between px-6">
        <div class="font-medium text-gray-500">
          欢迎回来，{{ authStore.user?.username || '管理员' }}
        </div>
        <el-dropdown>
          <span class="el-dropdown-link cursor-pointer flex items-center gap-2">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span>{{ authStore.user?.username || '管理员' }}</span>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      
      <el-main class="bg-gray-50 p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { DataLine, Goods, List, ArrowDown } from '@element-plus/icons-vue';
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
.el-menu {
  border-right: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
