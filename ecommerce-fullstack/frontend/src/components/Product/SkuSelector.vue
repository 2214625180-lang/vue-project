<template>
  <div class="sku-selector">
    <div class="mb-4">
      <div class="text-2xl font-bold text-red-600">
        {{ priceDisplay }}
      </div>
      <div class="text-sm text-gray-500" v-if="stockDisplay !== null">
        Stock: {{ stockDisplay }}
      </div>
    </div>

    <div v-for="spec in specTree" :key="spec.key" class="mb-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">{{ spec.key }}</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="value in spec.values"
          :key="value"
          @click="toggleSpec(spec.key, value)"
          :disabled="isOptionDisabled(spec.key, value)"
          :class="[
            'px-4 py-2 border rounded-md text-sm transition-colors',
            selectedSpecs[spec.key] === value
              ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium'
              : 'border-gray-200 hover:border-gray-300 text-gray-700',
            isOptionDisabled(spec.key, value)
              ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
              : 'cursor-pointer'
          ]"
        >
          {{ value }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

// --- Interfaces ---
export interface Sku {
  id: string;
  price: number;
  stock: number;
  specs: Record<string, string>;
  [key: string]: any;
}

interface SpecNode {
  key: string;
  values: string[];
}

// --- Props & Emits ---
const props = defineProps<{
  skus: Sku[];
}>();

const emit = defineEmits<{
  (e: 'sku-selected', sku: Sku): void;
  (e: 'sku-cleared'): void;
}>();

// --- State ---
const selectedSpecs = ref<Record<string, string>>({});

// --- Computed: Spec Tree ---
const specTree = computed<SpecNode[]>(() => {
  const specsMap = new Map<string, Set<string>>();

  props.skus.forEach((sku) => {
    if (sku.stock > 0) { // Only consider available SKUs for spec generation? Usually all specs should be shown.
      // Let's include all specs but disable invalid ones later.
      Object.entries(sku.specs).forEach(([key, value]) => {
        if (!specsMap.has(key)) {
          specsMap.set(key, new Set());
        }
        specsMap.get(key)!.add(value);
      });
    }
  });

  // If no stock at all, we might want to show specs from 0-stock SKUs too, 
  // but logically usually we iterate all SKUs.
  // Ideally backend provides spec list, but here we derive from SKUs.
  if (specsMap.size === 0 && props.skus.length > 0) {
      props.skus.forEach((sku) => {
        Object.entries(sku.specs).forEach(([key, value]) => {
            if (!specsMap.has(key)) {
            specsMap.set(key, new Set());
            }
            specsMap.get(key)!.add(value);
        });
      });
  }

  return Array.from(specsMap.entries()).map(([key, values]) => ({
    key,
    values: Array.from(values),
  }));
});

// --- Logic: Availability Check ---
/**
 * Determines if a specific spec option should be disabled based on current selections.
 * 
 * Algorithm:
 * 1. Create a hypothetical selection by merging current `selectedSpecs` with the target `(specKey, specValue)`.
 *    - Crucially, omit the target `specKey` from `selectedSpecs` first (to simulate switching value for this key).
 * 2. Check if there exists ANY SKU that:
 *    - Matches ALL entries in this hypothetical selection.
 *    - Has `stock > 0`.
 */
const isOptionDisabled = (specKey: string, specValue: string): boolean => {
  // 1. Construct the path to check
  // We want to check if selecting (specKey: specValue) is valid given OTHER currently selected specs.
  // So we take current selections, REMOVE the current specKey (because we are testing a value for it),
  // and ADD the new value.
  const pathToCheck = { ...selectedSpecs.value, [specKey]: specValue };

  // 2. Find if any SKU matches this path
  const hasMatchingSku = props.skus.some((sku) => {
    // a. Check if SKU matches all selected specs in pathToCheck
    const matchesPath = Object.entries(pathToCheck).every(([k, v]) => {
      return sku.specs[k] === v;
    });

    // b. Check stock
    return matchesPath && sku.stock > 0;
  });

  return !hasMatchingSku;
};

// --- Logic: Selection Handling ---
const toggleSpec = (specKey: string, specValue: string) => {
  if (isOptionDisabled(specKey, specValue)) return;

  if (selectedSpecs.value[specKey] === specValue) {
    // Deselect
    delete selectedSpecs.value[specKey];
  } else {
    // Select
    selectedSpecs.value[specKey] = specValue;
  }
  
  // Trigger update
  selectedSpecs.value = { ...selectedSpecs.value };
};

// --- Computed: Price & Stock Display ---
const matchedSku = computed(() => {
  // Check if all dimensions are selected
  if (specTree.value.length === 0) return null;
  const allSelected = specTree.value.every(spec => selectedSpecs.value[spec.key]);
  
  if (!allSelected) return null;

  return props.skus.find(sku => {
    const matchesSpecs = Object.entries(selectedSpecs.value).every(([k, v]) => sku.specs[k] === v);
    return matchesSpecs;
  });
});

const priceDisplay = computed(() => {
  if (matchedSku.value) {
    return `$${Number(matchedSku.value.price).toFixed(2)}`;
  }
  
  // Range
  const prices = props.skus
    .filter(sku => sku.stock > 0)
    .map(sku => Number(sku.price));
  
  if (prices.length === 0) return 'Out of Stock';
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  if (min === max) return `$${min.toFixed(2)}`;
  return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
});

const stockDisplay = computed(() => {
  if (matchedSku.value) return matchedSku.value.stock;
  return null;
});

// --- Watchers ---
watch(matchedSku, (newSku) => {
  if (newSku) {
    emit('sku-selected', newSku);
  } else {
    emit('sku-cleared');
  }
});

// Auto-select first available option for each spec if only one exists? 
// Or default select? 
// For now, keep it manual as per requirement "Simulate adding this specValue".

</script>

<style scoped>
/* Scoped styles if needed, but Tailwind handles most */
</style>
