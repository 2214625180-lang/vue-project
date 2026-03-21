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
import { uploadApi } from '../../api/upload';

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
  
  try {
    const res = await uploadApi.uploadImage(file as File);
    const uploadedUrl = res.fileUrl;
    console.log('✅ 上传返回图片地址:', uploadedUrl);

    if (uploadedUrl) {
      imageUrl.value = uploadedUrl;
      emit('update:modelValue', uploadedUrl);
      options.onSuccess?.(res);
      ElMessage.success('Upload success');
    } else {
      ElMessage.error('图片地址提取失败');
      options.onError?.(new Error('图片地址提取失败') as any);
    }
    
  } catch (error) {
    console.error('上传报错:', error);
    options.onError?.(error as any);
    ElMessage.error('Upload failed');
  }
};
</script>
