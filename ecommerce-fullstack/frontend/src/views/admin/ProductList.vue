<template>
  <div class="product-list">
    <el-card>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">商品管理</h2>
        <el-button type="primary" @click="handleAddProduct">添加新商品</el-button>
      </div>

      <!-- Search Area -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="搜索关键词">
          <el-input v-model="searchForm.keyword" placeholder="商品名称或SPU编号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 150px">
            <el-option label="上架" value="ON_SHELF" />
            <el-option label="下架" value="OFF_SHELF" />
          </el-select>
        </el-form-item>
        <!-- Category selection would ideally be dynamic, simplified for now -->
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="选择分类" clearable style="width: 150px">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
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
        <el-table-column prop="id" label="商品ID" width="100">
          <template #default="{ row }">
            <span :title="row.id">{{ row.id.substring(0, 8) }}...</span>
          </template>
        </el-table-column>
        <el-table-column prop="spuNo" label="SPU编号" width="150" />
        <el-table-column prop="name" label="商品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="商品描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category.name" label="分类名称" width="150">
          <template #default="{ row }">
            {{ row.category?.name || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="商品状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ON_SHELF' ? 'success' : 'info'">
              {{ row.status === 'ON_SHELF' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '添加新商品'" width="50%">
      <el-form :model="productForm" ref="productFormRef" :rules="rules" label-width="120px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" />
        </el-form-item>
        <el-form-item label="SPU编号" prop="spuNo">
          <el-input v-model="productForm.spuNo" />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-select v-model="productForm.categoryId" placeholder="请选择商品分类" style="width: 100%">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="productForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="商品价格" prop="price">
          <el-input-number v-model="productForm.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number v-model="productForm.stock" :min="0" />
        </el-form-item>
        <el-form-item label="商品图片" prop="mainImage">
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
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProduct(productFormRef)" :loading="submitting">
            添加商品
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { productApi, type ProductSpu, type ProductQueryParams, type CreateProductPayload, ProductStatus, type Category } from '../../api/product';
import { uploadApi } from '../../api/upload';
import { ElMessage, ElMessageBox, type UploadRequestOptions, type FormInstance, type FormRules } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const loading = ref(false);
const tableData = ref<ProductSpu[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const categories = ref<Category[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const currentProductId = ref('');
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
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  spuNo: [{ required: true, message: '请输入SPU编号', trigger: 'blur' }],
  // categoryId is now optional
  price: [{ required: true, message: '请输入商品价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
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
    ElMessage.error('获取商品列表失败');
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

const fetchCategories = async () => {
  try {
    const res = await productApi.getCategories();
    categories.value = (res as any).data || res;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};

const handleAddProduct = () => {
  isEdit.value = false;
  currentProductId.value = '';
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

const handleEdit = (row: ProductSpu) => {
    isEdit.value = true;
    currentProductId.value = row.id || '';
    dialogVisible.value = true;
    
    // Populate form
    Object.assign(productForm, {
      name: row.name,
      spuNo: row.spuNo,
      description: row.description || '',
      categoryId: row.categoryId,
      // Safely access first SKU if available for price/stock
      price: row.skus && row.skus.length > 0 && row.skus[0] ? Number(row.skus[0].price) : 0,
      stock: row.skus && row.skus.length > 0 && row.skus[0] ? Number(row.skus[0].stock) : 0,
      // Handle image from sku or potentially add mainImage to ProductSpu if backend supports
      mainImage: row.skus && row.skus.length > 0 && row.skus[0] ? row.skus[0].coverImage : '',
    });
  };
  
  const handleDelete = async (id: string) => {
    try {
      await ElMessageBox.confirm('确定要删除该商品吗?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      
      await productApi.delete(id);
      ElMessage.success('删除成功');
      fetchProducts();
    } catch (error) {
      if (error !== 'cancel') {
        console.error(error);
        ElMessage.error('删除失败');
      }
    }
  };

const customUpload = async (options: UploadRequestOptions) => {
  try {
    const res = await uploadApi.uploadImage(options.file);
    // Handle both direct data return and nested data structure
    productForm.mainImage = (res as any).data?.url || (res as any).url;
    console.log('Upload response URL:', productForm.mainImage);
    ElMessage.success('图片上传成功');
  } catch (error) {
    console.error('Upload failed:', error);
    ElMessage.error('图片上传失败');
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
          status: ProductStatus.ON_SHELF,
          skus: [
            {
              skuNo: `${productForm.spuNo}-001`,
              price: Number(productForm.price),
              stock: Number(productForm.stock),
              specs: { color: 'Default' },
              coverImage: productForm.mainImage,
            }
          ]
        };
        
        if (isEdit.value && currentProductId.value) {
          await productApi.update(currentProductId.value, payload);
          ElMessage.success('商品更新成功');
        } else {
          await productApi.create(payload);
          ElMessage.success('商品创建成功');
        }
        
        dialogVisible.value = false;
        fetchProducts();
      } catch (error: any) {
        console.error('保存商品失败:', error.response?.data || error);
        ElMessage.error('保存商品失败');
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
  fetchCategories();
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
