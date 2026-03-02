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
    // Direct Axios call to ensure multipart/form-data handling
    const res = await axios.post('http://localhost:3000/api/upload/image', formData, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    // Handle NestJS unified response { code: 200, data: { url: '...' } }
    const uploadedUrl = res.data.data.url; 
    
    // In dev mode, prepend localhost if it's a relative path
    const fullUrl = uploadedUrl.startsWith('http') 
      ? uploadedUrl 
      : `http://localhost:3000${uploadedUrl}`;

    imageUrl.value = fullUrl;
    emit('update:modelValue', fullUrl);
    ElMessage.success('Upload success');
  } catch (error) {
    console.error(error);
    ElMessage.error('Upload failed');
  }
};
</script>

<style scoped>
.avatar-uploader .avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 148px;
  height: 148px;
  text-align: center;
}
</style>
