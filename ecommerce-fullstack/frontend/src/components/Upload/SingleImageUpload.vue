<template>
  <el-upload
    class="avatar-uploader"
    action="#"
    :show-file-list="false"
    :http-request="customUpload"
    :before-upload="beforeAvatarUpload"
    list-type="picture-card"
  >
    <img v-if="imageUrl" :src="imageUrl" class="avatar" />
    <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
  </el-upload>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { ElMessage, type UploadRequestOptions } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);

const imageUrl = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  imageUrl.value = val;
});

const beforeAvatarUpload = (rawFile: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('Avatar picture must be JPG/PNG/WEBP format!');
    return false;
  } else if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('Avatar picture size can not exceed 5MB!');
    return false;
  }
  return true;
};

const customUpload = async (options: UploadRequestOptions) => {
  const { file } = options;
  const formData = new FormData();
  formData.append('file', file);

  const authStore = useAuthStore();
  
  try {
    // 🚨 修改 1：去掉了 http://localhost:3000，直接使用相对路径 /api/...
    // Nginx 会自动把这个请求转发给后端的 NestJS
    const res = await axios.post('/api/upload/image', formData, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    // 🚨 修改 2：匹配后端返回的字段名（后端叫 fileUrl，不是 url）
    // 注意：如果有全局拦截器包裹了响应体，通常在 res.data.data 里；如果没有，就在 res.data 里。
    const uploadedUrl = res.data?.data?.fileUrl || res.data?.fileUrl; 
    
    // 🚨 修改 3：直接使用后端返回的相对路径（比如 /api/uploads/xxx.jpg），不再拼接 localhost
    if (uploadedUrl) {
      imageUrl.value = uploadedUrl;
      emit('update:modelValue', uploadedUrl);
      ElMessage.success('Upload success');
    } else {
      throw new Error('未获取到图片地址');
    }
    
  } catch (error) {
    console.error('上传完整报错:', error);
    ElMessage.error('Upload failed');
  }
};
</script>