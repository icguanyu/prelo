<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "請選擇付款方式",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const authStore = useAuthStore();

const paymentMethodMap = {
  cash: "現金",
  linepay: "Line Pay",
  bank: "匯款",
  card: "信用卡",
};

// 獲取用戶設定的付款方式
const availablePaymentMethods = computed(() => {
  const userPayments = authStore.user?.paymentMethods || [];
  if (!Array.isArray(userPayments) || userPayments.length === 0) {
    // 回退到預設選項
    return [
      { label: "現金", value: "cash" },
      { label: "Line Pay", value: "linepay" },
    ];
  }

  return userPayments.map((value) => ({
    label: paymentMethodMap[value] || value,
    value,
  }));
});

// 預設選擇第一個可用的付款方式
onMounted(() => {
  if (!props.modelValue && availablePaymentMethods.value.length > 0) {
    emit("update:modelValue", availablePaymentMethods.value[0].value);
  }
});
</script>

<template>
  <el-select
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :placeholder="placeholder"
    :disabled="disabled || availablePaymentMethods.length === 0"
    clearable
  >
    <el-option
      v-for="method in availablePaymentMethods"
      :key="method.value"
      :label="method.label"
      :value="method.value"
    />
  </el-select>
</template>

<style scoped lang="scss"></style>
