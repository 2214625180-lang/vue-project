<template>
  <div class="login-container">
    <el-card class="box-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="80px">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="loginForm.email"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input type="password" v-model="loginForm.password"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogin">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" :rules="rules" ref="registerFormRef" label-width="80px">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="registerForm.email"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input type="password" v-model="registerForm.password"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRegister">注册</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '../store/auth';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const activeTab = ref('login');

const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();

const loginForm = reactive({
  email: '',
  password: '',
});

const registerForm = reactive({
  email: '',
  password: '',
});

const rules = reactive<FormRules>({
  email: [
    { required: true, message: 'Please input email', trigger: 'blur' },
    { type: 'email', message: 'Please input valid email', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Please input password', trigger: 'blur' },
    { min: 6, message: 'Length should be at least 6', trigger: 'blur' },
  ],
});

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const success = await authStore.login({
          email: loginForm.email,
          password: loginForm.password
        });
        if (success) {
          ElMessage.success('Login successful');
          const redirect = router.currentRoute.value.query.redirect as string;
          router.push(redirect || '/');
        } else {
          // Fallback if login returns false but didn't throw (e.g. handled in store)
          // Usually store throws or interceptor handles error message
        }
      } catch (e: any) {
        // Error message already shown by interceptor usually, but safe to log or handle specific UI state
      }
    }
  });
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const success = await authStore.register({
          email: registerForm.email,
          password: registerForm.password
        });
        if (success) {
          ElMessage.success('Registration successful, please login');
          activeTab.value = 'login';
        }
      } catch (e: any) {
         // Error handled by interceptor
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.box-card {
  width: 400px;
}
</style>
