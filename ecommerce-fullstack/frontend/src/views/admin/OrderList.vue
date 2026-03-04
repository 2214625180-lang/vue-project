<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Order Management</h2>
    </div>

    <!-- Search -->
    <el-form :inline="true" class="mb-4">
      <el-form-item label="Order No">
        <el-input v-model="searchForm.orderNo" placeholder="Order No" clearable />
      </el-form-item>
      <el-form-item label="Status">
        <el-select v-model="searchForm.status" placeholder="Status" clearable>
          <el-option label="PENDING" value="PENDING" />
          <el-option label="PAID" value="PAID" />
          <el-option label="SHIPPED" value="SHIPPED" />
          <el-option label="COMPLETED" value="COMPLETED" />
          <el-option label="CANCELLED" value="CANCELLED" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">Search</el-button>
        <el-button @click="resetSearch">Reset</el-button>
      </el-form-item>
    </el-form>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="tableData"
      border
      style="width: 100%"
    >
      <el-table-column type="expand">
        <template #default="props">
          <div class="p-4 bg-gray-50">
            <h4 class="font-bold mb-2">Order Items</h4>
            <el-table :data="props.row.items" border size="small">
              <el-table-column prop="spuName" label="Product Name" />
              <el-table-column label="Specs">
                <template #default="scope">
                  {{ parseSpecs(scope.row.skuSpecs) }}
                </template>
              </el-table-column>
              <el-table-column prop="price" label="Price" width="100" />
              <el-table-column prop="quantity" label="Qty" width="80" />
            </el-table>
            <div class="mt-4">
              <h4 class="font-bold mb-2">Shipping Info</h4>
              <p>Receiver: {{ props.row.addressSnapshot.receiverName }}</p>
              <p>Phone: {{ props.row.addressSnapshot.phone }}</p>
              <p>Address: {{ props.row.addressSnapshot.province }} {{ props.row.addressSnapshot.city }} {{ props.row.addressSnapshot.district }} {{ props.row.addressSnapshot.detailAddress }}</p>
              <p v-if="props.row.trackingNumber">Tracking: {{ props.row.courierCompany }} - {{ props.row.trackingNumber }}</p>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="orderNo" label="Order No" width="180" />
      <el-table-column prop="user.email" label="User" width="180" />
      <el-table-column prop="totalAmount" label="Total" width="120" />
      <el-table-column prop="status" label="Status" width="120">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="Created At" width="180">
        <template #default="scope">
          {{ formatDate(scope.row.createdAt) }}
        </template>
      </el-table-column>
      
      <el-table-column label="Actions" fixed="right" width="120">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === 'PAID'"
            type="primary"
            size="small"
            @click="openShipDialog(scope.row)"
          >
            Ship
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="flex justify-end mt-4">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchOrders"
      />
    </div>

    <!-- Ship Dialog -->
    <el-dialog v-model="shipDialogVisible" title="Ship Order" width="500px">
      <el-form :model="shipForm" label-width="120px">
        <el-form-item label="Courier">
          <el-input v-model="shipForm.courierCompany" placeholder="e.g. SF Express" />
        </el-form-item>
        <el-form-item label="Tracking No">
          <el-input v-model="shipForm.trackingNumber" placeholder="Tracking Number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleShip" :loading="shipping">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { adminOrderApi, type AdminOrder, type AdminOrderQueryParams } from '../../api/admin-order';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const tableData = ref<AdminOrder[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchForm = reactive<AdminOrderQueryParams>({
  orderNo: '',
  status: undefined,
});

const shipDialogVisible = ref(false);
const shipping = ref(false);
const currentOrderId = ref('');
const shipForm = reactive({
  courierCompany: '',
  trackingNumber: '',
});

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await adminOrderApi.getOrders({
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm,
    });
    // @ts-ignore
    tableData.value = res.items;
    // @ts-ignore
    total.value = res.total;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchOrders();
};

const resetSearch = () => {
  searchForm.orderNo = '';
  searchForm.status = undefined;
  handleSearch();
};

const openShipDialog = (row: AdminOrder) => {
  currentOrderId.value = row.id;
  shipForm.courierCompany = '';
  shipForm.trackingNumber = '';
  shipDialogVisible.value = true;
};

const handleShip = async () => {
  if (!shipForm.courierCompany || !shipForm.trackingNumber) {
    ElMessage.warning('Please fill in all fields');
    return;
  }
  
  shipping.value = true;
  try {
    await adminOrderApi.shipOrder(currentOrderId.value, shipForm);
    ElMessage.success('Order shipped successfully');
    shipDialogVisible.value = false;
    fetchOrders();
  } catch (error) {
    console.error(error);
  } finally {
    shipping.value = false;
  }
};

const getStatusType = (status: string) => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'PAID': return 'success';
    case 'SHIPPED': return 'primary';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'info';
    default: return 'info';
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString();
};

const parseSpecs = (specs: any) => {
  if (typeof specs === 'string') return specs;
  return JSON.stringify(specs);
};

onMounted(() => {
  fetchOrders();
});
</script>
