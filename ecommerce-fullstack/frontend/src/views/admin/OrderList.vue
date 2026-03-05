<template>
  <div class="order-list p-4">
    <el-card>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Order Management</h2>
      </div>

      <!-- Search Area -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="Order No">
          <el-input v-model="searchForm.orderNo" placeholder="Order No" clearable />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="searchForm.status" placeholder="Select Status" clearable style="width: 150px">
            <el-option label="Pending" value="PENDING" />
            <el-option label="Paid" value="PAID" />
            <el-option label="Shipped" value="SHIPPED" />
            <el-option label="Completed" value="COMPLETED" />
            <el-option label="Cancelled" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">Search</el-button>
          <el-button @click="handleReset">Reset</el-button>
        </el-form-item>
      </el-form>

      <!-- Data Table -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px"
        border
      >
        <el-table-column prop="orderNo" label="Order No" min-width="180" />
        <el-table-column prop="user.email" label="User" min-width="180">
          <template #default="{ row }">
            {{ row.user?.email || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="Total Amount" width="120">
          <template #default="{ row }">
            ${{ Number(row.totalAmount).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Created At" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PAID'"
              type="success" 
              size="small" 
              @click="handleShip(row)"
            >
              Ship Order
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Ship Dialog -->
    <el-dialog v-model="shipDialogVisible" title="Ship Order" width="30%">
      <el-form :model="shipForm" ref="shipFormRef" :rules="shipRules" label-width="140px">
        <el-form-item label="Tracking Number" prop="trackingNumber">
          <el-input v-model="shipForm.trackingNumber" />
        </el-form-item>
        <el-form-item label="Courier Company" prop="courierCompany">
          <el-input v-model="shipForm.courierCompany" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="confirmShip" :loading="shipping">
            Confirm Ship
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { adminOrderApi, type AdminOrderQueryParams } from '../../api/admin-order';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';

const loading = ref(false);
const tableData = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchForm = reactive({
  orderNo: '',
  status: '',
});

const shipDialogVisible = ref(false);
const shipping = ref(false);
const currentOrderId = ref('');
const shipFormRef = ref<FormInstance>();
const shipForm = reactive({
  trackingNumber: '',
  courierCompany: '',
});

const shipRules = reactive<FormRules>({
  trackingNumber: [{ required: true, message: 'Please input tracking number', trigger: 'blur' }],
  courierCompany: [{ required: true, message: 'Please input courier company', trigger: 'blur' }],
});

const fetchOrders = async () => {
  loading.value = true;
  try {
    const params: AdminOrderQueryParams = {
      page: currentPage.value,
      limit: pageSize.value,
      orderNo: searchForm.orderNo,
      status: searchForm.status || undefined,
    };
    
    // Clean undefined
    if (!params.status) delete params.status;
    if (!params.orderNo) delete params.orderNo;

    const res = await adminOrderApi.getOrders(params);
    // Handle wrapped response
    const data = (res as any).data || res;
    tableData.value = data.items || [];
    total.value = data.total || 0;
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to fetch orders');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchOrders();
};

const handleReset = () => {
  searchForm.orderNo = '';
  searchForm.status = '';
  handleSearch();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchOrders();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchOrders();
};

const getStatusType = (status: string) => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'PAID': return 'primary';
    case 'SHIPPED': return 'success';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'info';
    default: return 'info';
  }
};

const handleShip = (row: any) => {
  currentOrderId.value = row.id;
  shipForm.trackingNumber = `TRK${Date.now()}`; // Auto-fill for convenience
  shipForm.courierCompany = 'DHL'; // Default
  shipDialogVisible.value = true;
};

const confirmShip = async () => {
  if (!shipFormRef.value) return;
  await shipFormRef.value.validate(async (valid) => {
    if (valid) {
      shipping.value = true;
      try {
        await adminOrderApi.shipOrder(currentOrderId.value, {
          trackingNumber: shipForm.trackingNumber,
          courierCompany: shipForm.courierCompany,
        });
        ElMessage.success('Order shipped successfully');
        shipDialogVisible.value = false;
        fetchOrders();
      } catch (error: any) {
        console.error(error);
        ElMessage.error(error.response?.data?.message || 'Failed to ship order');
      } finally {
        shipping.value = false;
      }
    }
  });
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.order-list {
  /* padding: 20px; */
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
