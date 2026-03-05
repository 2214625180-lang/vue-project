<template>
  <div class="order-list p-4">
    <el-card>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">订单管理</h2>
      </div>

      <!-- Search Area -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="订单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 150px">
            <el-option label="待支付" value="PENDING" />
            <el-option label="已支付" value="PAID" />
            <el-option label="已发货" value="SHIPPED" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Data Table -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px"
        border
      >
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="user.email" label="用户邮箱" min-width="180">
          <template #default="{ row }">
            {{ row.user?.email || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">
            ${{ Number(row.totalAmount).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status === 'PENDING' ? '待支付' :
                 row.status === 'PAID' ? '已支付' :
                 row.status === 'SHIPPED' ? '已发货' :
                 row.status === 'COMPLETED' ? '已完成' :
                 row.status === 'CANCELLED' ? '已取消' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="订单创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PAID'"
              type="success" 
              size="small" 
              @click="handleShip(row)"
            >
              发货
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
    <el-dialog v-model="shipDialogVisible" title="发货订单" width="30%">
      <el-form :model="shipForm" ref="shipFormRef" :rules="shipRules" label-width="140px">
        <el-form-item label="物流单号" prop="trackingNumber">
          <el-input v-model="shipForm.trackingNumber" />
        </el-form-item>
        <el-form-item label="快递公司" prop="courierCompany">
          <el-input v-model="shipForm.courierCompany" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmShip" :loading="shipping">
            确认发货
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
  trackingNumber: [{ required: true, message: '请输入物流单号', trigger: 'blur' }],
  courierCompany: [{ required: true, message: '请输入快递公司', trigger: 'blur' }],
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
    ElMessage.error('获取订单列表失败');
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
        ElMessage.error(error.response?.data?.message || '发货失败');
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
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
