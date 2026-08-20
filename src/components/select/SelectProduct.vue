<script setup>
import { ref, computed, onMounted } from "vue";
import { Products } from "@/api/products";

const props = defineProps({
  modelValue: [String, Number],
  placeholder: {
    type: String,
    default: "請選擇產品",
  },
  excludeIds: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const isLoading = ref(false);
const products = ref([]);

const availableProducts = computed(() => {
  const excludeSet = new Set(props.excludeIds);
  return products.value.filter((product) => !excludeSet.has(product.id));
});

// 根據種類分組產品
const groupedProducts = computed(() => {
  const excludeSet = new Set(props.excludeIds);
  const filteredProducts = products.value.filter(
    (product) => !excludeSet.has(product.id),
  );

  // 按種類分組
  const groups = {};
  filteredProducts.forEach((product) => {
    const categoryId = product.category_id;
    const categoryName =
      product.category?.name || product.category_name || "未分類";

    if (!groups[categoryId]) {
      groups[categoryId] = {
        label: categoryName,
        categoryId: categoryId,
        options: [],
      };
    }
    groups[categoryId].options.push({
      value: product.id,
      label: product.name,
    });
  });

  return Object.values(groups);
});

const initData = async () => {
  isLoading.value = true;
  try {
    const productsRes = await Products.List({});
    products.value = productsRes.data.data.filter((p) => p.is_active) || [];
  } catch (err) {
    console.error("fetch data error", err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  initData();
});

// 提供方法讓父組件可以取得完整的產品物件
const getProductById = (id) => {
  return products.value.find((product) => product.id === id);
};

defineExpose({
  getProductById,
});
</script>

<template>
  <el-select
    :modelValue="modelValue"
    @clear="$emit('update:modelValue', null)"
    @update:modelValue="$emit('update:modelValue', $event)"
    :placeholder="placeholder"
    :loading="isLoading"
    :disabled="disabled || availableProducts.length === 0"
  >
    <el-option-group
      v-for="group in groupedProducts"
      :key="group.categoryId"
      :label="group.label"
    >
      <el-option
        v-for="product in group.options"
        :key="product.value"
        :label="product.label"
        :value="product.value"
      />
    </el-option-group>
  </el-select>
</template>
