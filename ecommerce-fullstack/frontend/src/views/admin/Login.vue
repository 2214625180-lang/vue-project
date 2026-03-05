<template>
  <div class="admin-login min-h-screen flex items-center justify-center bg-gray-100">
    <el-card class="w-full max-w-md shadow-lg rounded-lg">
      <template #header>
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-800">管理员登录</h2>
          <p class="text-gray-500 text-sm mt-2">请登录以管理您的店铺</p>
        </div>
      </template>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="loginForm.email" 
            placeholder="admin@example.com"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="********"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="w-full bg-blue-600 hover:bg-blue-700 border-none" 
            :loading="loading"
            native-type="submit"
            @click="handleLogin"
          >
            Sign In
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { authApi } from '../../api/auth';

const router = useRouter();
const loginFormRef = ref<FormInstance>();
const loading = ref(false);

const loginForm = reactive({
  email: '',
  password: '',
});

const rules = reactive<FormRules>({
  email: [
    { required: true, message: 'Please input email address', trigger: 'blur' },
    { type: 'email', message: 'Please input correct email address', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: 'Please input password', trigger: 'blur' },
    { min: 6, message: 'Password length should be at least 6 characters', trigger: 'blur' }
  ],
});

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const res = await authApi.login(loginForm);
        console.log('Admin Login Response:', res);
        
        // Handle token extraction robustly
        const data = (res as any);
        const token = data.access_token || data.token || data.data?.access_token || data.data?.token;
        
        if (token) {
          localStorage.setItem('admin_token', token);
          ElMessage.success('Login successful');
          router.push('/admin');
        } else {
          throw new Error('Token not found in response');
        }
      } catch (error: any) {
        console.error('Login Error:', error);
        ElMessage.error(error.response?.data?.message || 'Login failed');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.admin-login {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}
</style>
