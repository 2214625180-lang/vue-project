<template>
  <div class="product-list">
    <el-card>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Product Management</h2>
        <el-button type="primary" @click="handleAddProduct">Add New Product</el-button>
      </div>

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
        <el-table-column prop="id" label="ID" width="100">
          <template #default="{ row }">
            <span :title="row.id">{{ row.id.substring(0, 8) }}...</span>
          </template>
        </el-table-column>
        <el-table-column label="Image" width="100">
          <template #default="{ row }">
             <el-image 
               v-if="row.skus && row.skus.length > 0 && row.skus[0].coverImage"
               :src="row.skus[0].coverImage" 
               :preview-src-list="[row.skus[0].coverImage]"
               fit="cover" 
               class="w-12 h-12 rounded"
             />
             <span v-else class="text-gray-400 text-xs">No Image</span>
          </template>
        </el-table-column>
        <el-table-column prop="spuNo" label="SPU No" width="150" />
        <el-table-column prop="name" label="Product Name" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="Description" min-width="200" show-overflow-tooltip />
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

    <!-- Add Product Dialog -->
    <el-dialog v-model="dialogVisible" title="Add New Product" width="50%">
      <el-form :model="productForm" ref="productFormRef" :rules="rules" label-width="120px">
        <el-form-item label="Product Name" prop="name">
          <el-input v-model="productForm.name" />
        </el-form-item>
        <el-form-item label="SPU No" prop="spuNo">
          <el-input v-model="productForm.spuNo" />
        </el-form-item>
        <el-form-item label="Category ID" prop="categoryId">
          <el-input v-model="productForm.categoryId" placeholder="Use an existing UUID from DB" />
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="productForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="Price" prop="price">
          <el-input-number v-model="productForm.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="Stock" prop="stock">
          <el-input-number v-model="productForm.stock" :min="0" />
        </el-form-item>
        <el-form-item label="Main Image" prop="mainImage">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :http-request="customUpload"
          >
            <img v-if="productForm.mainImage" :src="productForm.mainImage" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="submitProduct(productFormRef)" :loading="submitting">
            Save
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { productApi, type ProductSpu, type ProductQueryParams, type CreateProductPayload, ProductStatus } from '../../api/product';
import { uploadApi } from '../../api/upload';
import { ElMessage, type UploadRequestOptions, type FormInstance, type FormRules } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const loading = ref(false);
const tableData = ref<ProductSpu[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const dialogVisible = ref(false);
const productFormRef = ref<FormInstance>();
const submitting = ref(false);

const productForm = reactive({
  name: '',
  spuNo: '',
  description: '',
  categoryId: '',
  price: 0,
  stock: 100,
  mainImage: '',
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: 'Please input product name', trigger: 'blur' }],
  spuNo: [{ required: true, message: 'Please input SPU No', trigger: 'blur' }],
  categoryId: [{ required: true, message: 'Please input Category ID', trigger: 'blur' }],
  price: [{ required: true, message: 'Please input price', trigger: 'blur' }],
});

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
    // Handle wrapped response from TransformInterceptor
    const data = (res as any).data || res;
    tableData.value = data.items || [];
    total.value = data.total || 0;
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

const handleAddProduct = () => {
  dialogVisible.value = true;
  // Reset form
  Object.assign(productForm, {
    name: '',
    spuNo: `SPU${Date.now()}`, // Auto-gen for demo
    description: '',
    categoryId: '',
    price: 0,
    stock: 100,
    mainImage: '',
  });
};

const customUpload = async (options: UploadRequestOptions) => {
  try {
    const res = await uploadApi.uploadImage(options.file);
    // Handle both direct data return and nested data structure
    productForm.mainImage = (res as any).data?.url || (res as any).url;
    console.log('Upload response URL:', productForm.mainImage);
    ElMessage.success('Image uploaded');
  } catch (error) {
    console.error('Upload failed:', error);
    ElMessage.error('Upload failed');
  }
};

const submitProduct = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        const payload: CreateProductPayload = {
          name: productForm.name,
          spuNo: productForm.spuNo,
          description: productForm.description,
          categoryId: productForm.categoryId,
          status: ProductStatus.ON_SHELF, // Default on shelf
          skus: [
            {
              skuNo: `${productForm.spuNo}-001`,
              price: Number(productForm.price),
              stock: Number(productForm.stock),
              specs: { color: 'Default' }, // Mock specs
              coverImage: productForm.mainImage,
            }
          ]
        };
        
        await productApi.create(payload);
        ElMessage.success('Product created successfully');
        dialogVisible.value = false;
        fetchProducts();
      } catch (error: any) {
        console.error('Save Product Error:', error.response?.data || error);
        ElMessage.error('Failed to create product');
      } finally {
        submitting.value = false;
      }
    }
  });
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
  width: 178px;
  height: 178px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}
</style>
