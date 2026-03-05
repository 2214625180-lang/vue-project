<template>
  <div class="address-list container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">我的收货地址</h1>
      <el-button type="primary" @click="handleAdd">新增地址</el-button>
    </div>

    <div v-if="loading" class="text-center py-10">加载中...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <el-card 
        v-for="address in addresses" 
        :key="address.id" 
        class="relative hover:shadow-lg transition-shadow"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold text-lg">{{ address.receiverName }}</span>
            <el-tag v-if="address.isDefault" type="success" size="small">默认</el-tag>
          </div>
        </template>
        <div class="text-gray-600 space-y-2">
          <p>{{ address.phone }}</p>
          <p>
            {{ address.province }} {{ address.city }} {{ address.district }}
          </p>
          <p class="text-sm text-gray-500">{{ address.detailAddress }}</p>
        </div>
        <div class="mt-4 flex justify-end gap-2 border-t pt-4">
          <el-button link type="primary" @click="handleEdit(address)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(address.id)">删除</el-button>
        </div>
      </el-card>
    </div>

    <!-- Address Form Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '修改地址' : '新增地址'"
      width="500px"
      @closed="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="收件人姓名" prop="receiverName">
          <el-input v-model="form.receiverName" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="所在地区" required>
          <div class="flex gap-2 w-full">
            <el-input v-model="form.province" placeholder="省份" />
            <el-input v-model="form.city" placeholder="城市" />
            <el-input v-model="form.district" placeholder="区县" />
          </div>
          <!-- In real app, use el-cascader with region data -->
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input type="textarea" v-model="form.detailAddress" />
        </el-form-item>
        <el-form-item label="设为默认地址">
          <el-switch v-model="form.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { addressApi, type UserAddress, type CreateAddressPayload } from '../../api/address';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';

const addresses = ref<UserAddress[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentId = ref('');
const formRef = ref<FormInstance>();

const form = reactive<CreateAddressPayload>({
  receiverName: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: false,
});

const rules = reactive<FormRules>({
  receiverName: [{ required: true, message: 'Required', trigger: 'blur' }],
  phone: [{ required: true, message: 'Required', trigger: 'blur' }],
  detailAddress: [{ required: true, message: 'Required', trigger: 'blur' }],
});

const fetchAddresses = async () => {
  loading.value = true;
  try {
    const res = await addressApi.getList();
    addresses.value = res.data || [];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isEdit.value = false;
  dialogVisible.value = true;
};

const handleEdit = (address: UserAddress) => {
  isEdit.value = true;
  currentId.value = address.id;
  Object.assign(form, {
    receiverName: address.receiverName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detailAddress: address.detailAddress,
    isDefault: address.isDefault,
  });
  dialogVisible.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('Delete this address?', 'Warning', { type: 'warning' });
    await addressApi.delete(id);
    ElMessage.success('Deleted');
    fetchAddresses();
  } catch (error) {
    if (error !== 'cancel') console.error(error);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await addressApi.update(currentId.value, form);
          ElMessage.success('Updated');
        } else {
          await addressApi.create(form);
          ElMessage.success('Created');
        }
        dialogVisible.value = false;
        fetchAddresses();
      } catch (error) {
        console.error(error);
        ElMessage.error('Operation failed');
      }
    }
  });
};

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields();
  // Manually reset fields not covered by prop or if resetFields is flaky with reactive
  form.province = '';
  form.city = '';
  form.district = '';
  form.isDefault = false;
};

onMounted(() => {
  fetchAddresses();
});
</script>

<style scoped>
/* Tailwind-like utilities */
.container { max-width: 1200px; margin: 0 auto; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.items-center { align-items: center; }
.grid { display: grid; }
.gap-6 { gap: 1.5rem; }
.gap-2 { gap: 0.5rem; }
.p-4 { padding: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-4 { margin-top: 1rem; }
.pt-4 { padding-top: 1rem; }
.w-full { width: 100%; }
.text-center { text-align: center; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.font-bold { font-weight: 700; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-gray-600 { color: #4b5563; }
.text-gray-500 { color: #6b7280; }
.space-y-2 > :not([hidden]) ~ :not([hidden]) { --tw-space-y-reverse: 0; margin-top: calc(0.5rem * calc(1 - var(--tw-space-y-reverse))); margin-bottom: calc(0.5rem * var(--tw-space-y-reverse)); }
.border-t { border-top-width: 1px; }
.hover\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
.transition-shadow { transition-property: box-shadow; transition-duration: 300ms; }
</style>
