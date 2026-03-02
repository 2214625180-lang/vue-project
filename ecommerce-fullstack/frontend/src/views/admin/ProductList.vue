<template>
  <div class="product-list">
    <el-card>
      <!-- Search Area -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="Keyword">
          <el-input v-model="searchForm.keyword" placeholder="Name or SPU No" clearable />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="searchForm.status" placeholder="Select Status" clearable style="width: 150px">
            <el-option label="On Shelf" value="ON_SHELF" />
            <el-option label="Off Shelf" value="OFF_SHELF" />
          </el-select>
        </el-form-item>
        <!-- Category selection would ideally be dynamic, simplified for now -->
        <el-form-item label="Category ID">
          <el-input v-model="searchForm.categoryId" placeholder="Category UUID" clearable />
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
        <el-table-column prop="spuNo" label="SPU No" width="180" />
        <el-table-column prop="name" label="Product Name" min-width="200" />
        <el-table-column prop="category.name" label="Category" width="150">
          <template #default="{ row }">
            {{ row.category?.name || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ON_SHELF' ? 'success' : 'info'">
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
          <template #default>
            <el-button link type="primary" size="small">Edit</el-button>
            <el-button link type="danger" size="small">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
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
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { productApi, type ProductSpu, type ProductQueryParams } from '../../api/product';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const tableData = ref<ProductSpu[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchForm = reactive<ProductQueryParams>({
  keyword: '',
  status: undefined,
  categoryId: undefined,
});

const fetchProducts = async () => {
  loading.value = true;
  try {
    const params: ProductQueryParams = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchForm.keyword,
      status: searchForm.status,
      categoryId: searchForm.categoryId,
    };
    
    // Clean up undefined params
    Object.keys(params).forEach(key => {
      if ((params as any)[key] === '' || (params as any)[key] === undefined) {
        delete (params as any)[key];
      }
    });

    const res = await productApi.getProductsList(params);
    tableData.value = res.items;
    total.value = res.total;
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to fetch products');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchProducts();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.status = undefined;
  searchForm.categoryId = '';
  handleSearch();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchProducts();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchProducts();
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.product-list {
  padding: 20px;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
