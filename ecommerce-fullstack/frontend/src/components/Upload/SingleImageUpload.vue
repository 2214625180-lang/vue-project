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
    const res = await axios.post('/api/upload/image', formData, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    // 🚨 加上这行：让我们看看后端到底返回了什么形状的数据！
    console.log('完整的后端返回数据:', res.data); 
    // 🚨 核心修复：后端你写的是 return { fileUrl }。
    // 因为你有 TransformInterceptor，所以外面通常包了一层 data。
    // 这里我们把可能的路径都写上，确保万无一失：
    const uploadedUrl = res.data?.data?.fileUrl || res.data?.fileUrl; 
    
    console.log('提取到的图片地址:', uploadedUrl); // 看看这次还是不是 undefined

    if (uploadedUrl) {
      imageUrl.value = uploadedUrl;
      emit('update:modelValue', uploadedUrl);
      ElMessage.success('Upload success');
    } else {
      ElMessage.error('上传成功，但前端未能正确读取图片地址');
    }
  } catch (error) {
    console.error('上传完整报错:', error);
    ElMessage.error('Upload failed');
  }
};
</script>