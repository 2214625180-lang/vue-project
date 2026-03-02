<template>
  <div class="sku-matrix-generator">
    <!-- 1. Spec Definition Section -->
    <el-card class="box-card mb-4">
      <template #header>
        <div class="card-header">
          <span>Product Specifications</span>
          <el-button type="primary" size="small" @click="addSpec">Add Spec</el-button>
        </div>
      </template>
      
      <div v-for="(spec, index) in specList" :key="index" class="spec-row">
        <div class="spec-name-input">
          <el-input 
            v-model="spec.name" 
            placeholder="Spec Name (e.g. Color)" 
            style="width: 200px"
          >
            <template #suffix>
              <el-icon class="el-input__icon" style="cursor: pointer" @click="removeSpec(index)">
                <Delete />
              </el-icon>
            </template>
          </el-input>
        </div>
        
        <div class="spec-values-container">
          <el-tag
            v-for="(tag, tagIndex) in spec.values"
            :key="tagIndex"
            closable
            :disable-transitions="false"
            @close="removeSpecValue(index, tagIndex)"
            class="mx-1"
          >
            {{ tag }}
          </el-tag>
          
          <el-input
            v-if="inputVisible[index]"
            ref="inputRefs"
            v-model="inputValue[index]"
            class="input-new-tag"
            size="small"
            @keyup.enter="handleInputConfirm(index)"
            @blur="handleInputConfirm(index)"
          />
          <el-button v-else class="button-new-tag" size="small" @click="showInput(index)">
            + New Value
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 2. SKU Matrix Table -->
    <el-card class="box-card" v-if="skuTableData.length > 0">
      <template #header>
        <div class="card-header">
          <span>SKU List</span>
        </div>
      </template>
      
      <el-table :data="skuTableData" style="width: 100%" border>
        <!-- Dynamic Columns for Specs -->
        <el-table-column
          v-for="spec in activeSpecs"
          :key="spec.name"
          :prop="'specs.' + spec.name"
          :label="spec.name"
          align="center"
        >
          <template #default="scope">
            {{ scope.row.specs[spec.name] }}
          </template>
        </el-table-column>

        <!-- Fixed Columns -->
        <el-table-column label="SKU Code" width="180">
          <template #default="scope">
            <el-input v-model="scope.row.skuNo" placeholder="Code" />
          </template>
        </el-table-column>
        
        <el-table-column label="Price" width="150">
          <template #default="scope">
            <el-input-number 
              v-model="scope.row.price" 
              :precision="2" 
              :step="0.1" 
              :min="0" 
              style="width: 100%" 
            />
          </template>
        </el-table-column>
        
        <el-table-column label="Stock" width="150">
          <template #default="scope">
            <el-input-number 
              v-model="scope.row.stock" 
              :min="0" 
              :step="1" 
              step-strictly 
              style="width: 100%" 
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import { generateSkuCartesian, type SpecItem } from '../../utils/sku';
import type { ElInput } from 'element-plus';

// --- Interfaces ---
export interface SkuRow {
  skuNo: string;
  price: number;
  stock: number;
  specs: Record<string, string>;
  // Helper key to track row identity across regneration
  _key: string; 
}

// --- State: Spec Definitions ---
const specList = reactive<SpecItem[]>([
  { name: 'Color', values: ['Red', 'Blue'] },
  { name: 'Size', values: ['S', 'M'] }
]);

// UI State for dynamic tags
const inputVisible = ref<boolean[]>([]);
const inputValue = ref<string[]>([]);
const inputRefs = ref<InstanceType<typeof ElInput>[]>([]);

// --- State: SKU Table ---
const skuTableData = ref<SkuRow[]>([]);

// --- Computed ---
const activeSpecs = computed(() => specList.filter(s => s.name && s.values.length > 0));

// --- Logic: Spec Management ---
const addSpec = () => {
  specList.push({ name: '', values: [] });
  inputVisible.value.push(false);
  inputValue.value.push('');
};

const removeSpec = (index: number) => {
  specList.splice(index, 1);
  inputVisible.value.splice(index, 1);
  inputValue.value.splice(index, 1);
};

const removeSpecValue = (specIndex: number, tagIndex: number) => {
  specList[specIndex].values.splice(tagIndex, 1);
};

const showInput = (index: number) => {
  inputVisible.value[index] = true;
  nextTick(() => {
    // Handling array of refs can be tricky in Vue 3 script setup
    // Simplification: just focus if possible, or user clicks again
  });
};

const handleInputConfirm = (index: number) => {
  const val = inputValue.value[index];
  if (val) {
    if (!specList[index].values.includes(val)) {
      specList[index].values.push(val);
    }
  }
  inputVisible.value[index] = false;
  inputValue.value[index] = '';
};

// --- Logic: SKU Matrix Generation & State Preservation ---
// Watch deep changes in specList to regenerate the table
watch(
  () => specList,
  (newSpecs) => {
    // 1. Generate new Cartesian product of specs
    const newMatrix = generateSkuCartesian(newSpecs);
    
    // 2. Map to SkuRows, preserving existing data
    // We create a map of existing rows keyed by their spec combination signature
    const existingMap = new Map<string, SkuRow>();
    skuTableData.value.forEach(row => {
      existingMap.set(row._key, row);
    });

    const newTableData: SkuRow[] = newMatrix.map(specs => {
      // Create a unique key for this spec combination (e.g. "Color:Red|Size:S")
      // Sort keys to ensure consistent order
      const key = Object.entries(specs)
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, v]) => `${k}:${v}`)
        .join('|');

      const existingRow = existingMap.get(key);

      if (existingRow) {
        // PRESERVE existing input
        return existingRow;
      } else {
        // Create NEW row
        return {
          skuNo: '',
          price: 0,
          stock: 0,
          specs: specs,
          _key: key
        };
      }
    });

    skuTableData.value = newTableData;
  },
  { deep: true, immediate: true }
);

// Expose data for parent component
defineExpose({
  skuTableData,
  specList
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
.spec-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}
.spec-name-input {
  margin-right: 16px;
}
.spec-values-container {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.mx-1 {
  margin-left: 4px;
  margin-right: 4px;
  margin-bottom: 4px;
}
.input-new-tag {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}
.button-new-tag {
  margin-left: 10px;
  height: 24px;
  line-height: 22px;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
