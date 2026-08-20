<script setup>
import { ProductCategory } from "@/api/products";
const props = defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: "請選擇種類",
  },
});
const isLoading = ref(false);
const emits = defineEmits(["update:modelValue", "manage"]);
const categories = ref([]);

const initProductCategories = async () => {
  isLoading.value = true;
  try {
    const res = await ProductCategory.List();
    categories.value = res.data.data;
  } catch (err) {
    console.error("fetch categories error", err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  initProductCategories();
});

defineExpose({ refresh: initProductCategories });
</script>

<template>
  <el-select
    :modelValue="modelValue"
    @clear="$emit('update:modelValue', null)"
    @update:modelValue="$emit('update:modelValue', $event)"
    :placeholder="placeholder"
    :loading="isLoading"
  >
    <el-option
      v-for="category in categories"
      :key="category.id"
      :label="category.name"
      :value="category.id"
    />
    <template #empty>
      <div class="select-empty">
        <p>尚無種類</p>
        <el-button size="small" type="primary" text @click.stop="$emit('manage')">
          立即建立種類
        </el-button>
      </div>
    </template>
  </el-select>
</template>

<style scoped lang="scss">
.select-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  p {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
