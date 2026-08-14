<script setup>
import { ref, reactive, watch, computed } from "vue";
import dayjs from "dayjs";
import { Schedules } from "@/api/schedules";
import { scheduleStatusOptions } from "@/utils/constants";
import { ElNotification, ElMessage, ElMessageBox } from "element-plus";

const formRef = ref(null);
const statusOptions = scheduleStatusOptions;
const enableVenue = ref(false);

const props = defineProps({
  schedule: {
    type: Object,
    default: () => ({
      schedule_date: "",
      status: "DRAFT",
      order_start_at: null,
      order_end_at: null,
      items: [],
      order_count: 0,
    }),
  },
});

const emit = defineEmits(["close", "update"]);
const loading = ref(false);

// 分開的日期時間欄位
const orderStartDate = ref("");
const orderStartTime = ref("");
const orderEndDate = ref("");
const orderEndTime = ref("");

const setOrderStartNow = () => {
  const now = dayjs();
  const rounded =
    now.minute() < 30
      ? now.minute(30).second(0)
      : now.add(1, "hour").minute(0).second(0);
  orderStartDate.value = rounded.format("YYYY-MM-DD");
  orderStartTime.value = rounded.format("HH:mm");
};

const form = reactive({
  id: props.schedule.id || null,
  schedule_date: props.schedule.schedule_date,
  status: props.schedule.status,
  order_start_at: props.schedule.order_start_at,
  order_end_at: props.schedule.order_end_at,
  items: props.schedule.items.map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    sales_limit: item.sales_limit,
  })),
  venue_name: props.schedule.venue_name || "",
  venue_address: props.schedule.venue_address || "",
  venue_start: props.schedule.venue_start || "",
  venue_end: props.schedule.venue_end || "",
});

const selectedProducts = ref([]);
const selectedProductId = ref("");
const selectProductRef = ref(null);

// 檢查是否有訂單，有訂單則不可編輯
const hasOrders = computed(() => {
  return (props.schedule?.order_count || 0) > 0;
});

// 初始化分開的日期和時間
const initializeDateTimeFields = () => {
  if (form.order_start_at) {
    const startDateTime = dayjs(form.order_start_at);
    orderStartDate.value = startDateTime.format("YYYY-MM-DD");
    orderStartTime.value = startDateTime.format("HH:mm");
  } else if (form.status === "OPEN") {
    // OPEN 才預設時間，ANNOUNCED 留空讓使用者自行填寫
    orderStartDate.value = dayjs().format("YYYY-MM-DD");
    orderStartTime.value = "09:00";
  } else {
    orderStartDate.value = "";
    orderStartTime.value = "";
  }
  if (form.order_end_at) {
    const endDateTime = dayjs(form.order_end_at);
    orderEndDate.value = endDateTime.format("YYYY-MM-DD");
    orderEndTime.value = endDateTime.format("HH:mm");
  } else {
    // 預設為開單日期和 00:00
    orderEndDate.value = form.schedule_date || "";
    orderEndTime.value = "00:00";
  }
};

const resetFormFromSchedule = (schedule) => {
  form.id = schedule?.id || null;
  form.schedule_date = schedule?.schedule_date || "";
  form.status = schedule?.status || "DRAFT";
  form.order_start_at = schedule?.order_start_at || null;
  form.order_end_at = schedule?.order_end_at || null;
  form.items = Array.isArray(schedule?.items)
    ? schedule.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        sales_limit: item.sales_limit,
      }))
    : [];
  form.venue_name = schedule?.venue_name || "";
  form.venue_address = schedule?.venue_address || "";
  form.venue_start = schedule?.venue_start || "";
  form.venue_end = schedule?.venue_end || "";
  enableVenue.value = !!schedule?.venue_name;
};

watch(
  () => props.schedule,
  (val) => {
    console.log("schedule change:", val);
    resetFormFromSchedule(val);
    initializeDateTimeFields();
  },
  { immediate: true, deep: true },
);

watch(selectedProductId, (val) => {
  if (!val) return;
  addProduct();
});

const clearVenueFields = () => {
  form.venue_name = "";
  form.venue_address = "";
  form.venue_start = "";
  form.venue_end = "";
};

const handleVenueToggle = (val) => {
  if (val) return;
  const hasFilled = form.venue_name || form.venue_address || form.venue_start || form.venue_end;
  if (!hasFilled) {
    clearVenueFields();
    return;
  }
  ElMessageBox.confirm("關閉後將清除已填寫的場地資訊，確定要關閉嗎？", "確認關閉", {
    confirmButtonText: "確定清除",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    clearVenueFields();
  }).catch(() => {
    enableVenue.value = true;
  });
};

// 監聽截止日期變化，若時間未填則預設為 00:00
watch(orderEndDate, (newDate) => {
  if (newDate && !orderEndTime.value) {
    orderEndTime.value = "00:00";
  }
});

const needsStartTime = computed(
  () => form.status === "OPEN" || form.status === "ANNOUNCED",
);
const needsEndTime = computed(() => form.status === "OPEN");
const canHaveEndTime = computed(() => form.status === "OPEN" || form.status === "ANNOUNCED");
const needsOrderTime = needsEndTime; // 向後相容（saveEditor / beforeSave 用）

const timelineActive = computed(() => {
  const map = { ANNOUNCED: 0, OPEN: 1, CLOSED: 3 };
  return map[form.status] ?? -1;
});

const excludeProductIds = computed(() => {
  return form.items.map((item) => item.product_id);
});

const addProduct = () => {
  if (!selectProductRef.value) return;
  const product = selectProductRef.value.getProductById(
    selectedProductId.value,
  );
  if (!product) return;

  // 檢查產品是否已存在
  const isDuplicate = form.items.some((item) => item.product_id === product.id);
  if (isDuplicate) {
    ElMessage.warning("此產品已在列表中");
    selectedProductId.value = "";
    return;
  }

  form.items.push({
    product_id: product.id,
    product_name: product.name,
    sales_limit: null,
  });
  selectedProductId.value = "";
};

const removeProduct = (id) => {
  form.items = form.items.filter((item) => item.product_id !== id);
};

const incrementLimit = (item) => {
  if (item.sales_limit === null) return;
  item.sales_limit++;
};

const decrementLimit = (item) => {
  if (item.sales_limit === null || item.sales_limit <= 0) return;
  item.sales_limit--;
};

const closeEditor = () => {
  resetFormFromSchedule(props.schedule);
  initializeDateTimeFields();
  selectedProductId.value = "";
  emit("close");
};

const beforeSave = (formRef) => {
  if (needsEndTime.value) {
    if (!orderStartDate.value || !orderStartTime.value) {
      ElMessage.error("請填寫開單開始時間");
      return;
    }
  }
  if (needsEndTime.value) {
    if (!orderEndDate.value || !orderEndTime.value) {
      ElMessage.error("收單中狀態需填寫開單截止時間");
      return;
    }
  }
  const isEmptyProducts = form.items.length === 0;
  formRef.validate((valid) => {
    if (valid && !isEmptyProducts) {
      saveEditor();
    } else {
      ElMessage.error("請填寫完整的排程資訊，並至少新增一個產品");
    }
  });
};

const saveEditor = async () => {
  if (needsStartTime.value && orderStartDate.value && orderStartTime.value) {
    form.order_start_at = `${orderStartDate.value} ${orderStartTime.value}:00`;
  }
  if (canHaveEndTime.value && orderEndDate.value) {
    const endTime = orderEndTime.value || "00:00";
    form.order_end_at = `${orderEndDate.value} ${endTime}:00`;
  }

  loading.value = true;
  try {
    if (form.id) {
      await Schedules.Update(form.id, form);
    } else {
      await Schedules.Create(form);
    }
    ElNotification({
      title: "成功",
      message: `排程已${form.id ? "更新" : "建立"}成功`,
      type: "success",
    });
    if (!form.id) {
      closeEditor();
    }
    emit("update");
  } catch (error) {
    console.log("catch:", error);
  } finally {
    loading.value = false;
  }
};

const deleteSchedule = async () => {
  if (!form.id) {
    ElMessage.error("無法刪除尚未建立的排程");
    return;
  }
  ElMessageBox.confirm("確定要刪除這個排程嗎？", "警告", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      loading.value = true;
      try {
        await Schedules.Delete(form.id);
        ElNotification({
          title: "成功",
          message: "排程已刪除",
          type: "success",
        });
        closeEditor();
        emit("update");
      } catch (error) {
        console.log("catch:", error);
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {
      // 取消刪除
    });
};
</script>

<template>
  <div class="schedule-editor">
    <div class="editor-header">
      <div class="editor-title">
        編輯 {{ dayjs(form.schedule_date).format("MM-DD") }} 的排程
      </div>
      <div>
        <el-button
          class="editor-back"
          icon="back"
          circle
          @click="closeEditor"
        />
        <el-button v-if="form.id" type="danger" plain @click="deleteSchedule"
          >刪除</el-button
        >
        <el-button
          class="editor-save"
          type="primary"
          :loading="loading"
          @click="beforeSave(formRef)"
          >送出</el-button
        >
      </div>
    </div>
    <div class="editor-body" v-loading="loading">
      <!-- 警告提示 -->
      <el-alert
        v-if="hasOrders"
        title="此排程已有訂單，請確認調整內容是否會影響現有訂單。"
        type="warning"
        :closable="false"
        show-icon
      />

      <div class="editor-section">
        <div class="section-title">排程資訊</div>
        <el-form
          :model="form"
          ref="formRef"
          class="schedule-form"
          label-position="top"
        >
          <div class="field-row">
            <el-form-item label="取貨日期" class="field" prop="schedule_date">
              <div class="field-value">
                {{ form.schedule_date }}
              </div>
            </el-form-item>
            <el-form-item label="開單狀態" class="field" prop="status">
              <el-select v-model="form.status" placeholder="選擇狀態">
                <el-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <!-- 狀態說明 -->
          <div
            v-if="form.status"
            class="status-hint"
            :class="`status-hint--${form.status.toLowerCase()}`"
          >
            <template v-if="form.status === 'ANNOUNCED'">
              <i class="el-icon-info"></i>
              <span
                ><b>預告模式</b
                >：行程對客人可見，但尚未開放下單。填寫「開單開始時間」後，客人可將提醒加入行事曆，到時間自動通知。</span
              >
            </template>
            <template v-else-if="form.status === 'OPEN'">
              <span
                ><b>接單中</b>：客人可立即下單。需設定開單區間（開始 →
                截止），超過截止時間後請手動切換為「已結單」。</span
              >
            </template>
            <template v-else-if="form.status === 'CLOSED'">
              <span
                ><b>已結單</b
                >：停止接受新訂單，行程仍對客人可見但按鈕會顯示「已結單」。</span
              >
            </template>
          </div>

          <el-form-item
            v-if="needsStartTime"
            label="接單開始時間"
            class="field"
          >
            <div class="field-content">
              <div class="datetime-inputs">
                <el-date-picker
                  v-model="orderStartDate"
                  type="date"
                  placeholder="選擇日期"
                  value-format="YYYY-MM-DD"
                />
                <el-time-select
                  v-model="orderStartTime"
                  placeholder="選擇時間"
                  start="00:00"
                  step="00:30"
                  end="23:30"
                />
              </div>
              <p class="field-hint">
                請確認該日期的營業時間是否有開放・
                <el-button link @click="setOrderStartNow">設為現在</el-button>
              </p>
            </div>
          </el-form-item>
          <el-form-item v-if="canHaveEndTime" label="接單截止時間" class="field">
            <div class="datetime-inputs">
              <el-date-picker
                v-model="orderEndDate"
                type="date"
                placeholder="選擇日期"
                value-format="YYYY-MM-DD"
              />
              <el-time-select
                v-model="orderEndTime"
                placeholder="選擇時間"
                start="00:00"
                step="00:30"
                end="23:30"
              />
            </div>
          </el-form-item>
        </el-form>

        <!-- 時間軸 -->
        <el-steps v-if="form.status !== 'DRAFT'" :active="timelineActive" simple class="schedule-timeline">
          <el-step>
            <template #title>
              <div class="tl-step">
                <span class="tl-label">接單</span>
                <span v-if="orderStartDate" class="tl-time">
                  <span class="tl-date">{{ orderStartDate }}</span>
                  <span class="tl-clock">{{ orderStartTime }}</span>
                </span>
              </div>
            </template>
          </el-step>
          <el-step>
            <template #title>
              <div class="tl-step">
                <span class="tl-label">結單</span>
                <span v-if="orderEndDate" class="tl-time">
                  <span class="tl-date">{{ orderEndDate }}</span>
                  <span class="tl-clock">{{ orderEndTime }}</span>
                </span>
              </div>
            </template>
          </el-step>
          <el-step>
            <template #title>
              <div class="tl-step">
                <span class="tl-label">取貨日</span>
                <span v-if="form.schedule_date" class="tl-time">{{
                  form.schedule_date
                }}</span>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>

      <!-- 巡迴場地 -->
      <div class="editor-section">
        <div class="venue-header">
          <div>
            <div class="section-title">巡迴場地</div>
            <div class="section-note">走出工作室、到外地販售時填寫</div>
          </div>
          <el-switch v-model="enableVenue" @change="handleVenueToggle" />
        </div>

        <template v-if="enableVenue">
          <div class="field-row venue-row">
            <el-form-item label="場次名稱" class="field">
              <el-input v-model="form.venue_name" placeholder="例：嘉義場、員林場" />
            </el-form-item>
            <el-form-item label="販售地址" class="field">
              <el-input v-model="form.venue_address" placeholder="例：嘉義市某街某號" />
            </el-form-item>
          </div>
          <el-form-item label="販售時間區間" class="field">
            <div class="datetime-inputs">
              <el-time-select
                v-model="form.venue_start"
                placeholder="開始時間"
                start="06:00"
                step="00:30"
                end="22:00"
              />
              <span class="time-sep">—</span>
              <el-time-select
                v-model="form.venue_end"
                placeholder="結束時間"
                start="06:00"
                step="00:30"
                end="22:00"
                :min-time="form.venue_start"
              />
            </div>
          </el-form-item>

          <div class="venue-preview" v-if="form.venue_name">
            <i class="bx bx-map-pin"></i>
            <span>
              <b>{{ form.venue_name }}</b>
              <template v-if="form.venue_address"> · {{ form.venue_address }}</template>
              <template v-if="form.venue_start && form.venue_end"> · {{ form.venue_start }}–{{ form.venue_end }}</template>
            </span>
          </div>
        </template>
      </div>

      <div class="editor-section">
        <div class="section-title">今日出爐產品</div>
        <div class="section-note">不設上限則任意數量皆可下單</div>
        <div class="section-content">
          <div class="field-row add-row">
            <SelectProduct
              ref="selectProductRef"
              v-model="selectedProductId"
              class="product-select"
              :exclude-ids="excludeProductIds"
            />
          </div>

          <div v-if="form.items.length === 0" class="empty-products">
            尚未新增產品
          </div>
          <div v-else class="product-list">
            <div
              v-for="item in form.items"
              :key="item.product_id"
              class="product-wrapper"
            >
              <div class="product-item">
                <div class="product-info">
                  <div class="product-name">{{ item.product_name }}</div>
                </div>
                <div class="product-limit">
                  <!-- 不限量 -->
                  <template v-if="item.sales_limit === null">
                    <span class="limit-badge">不限量</span>
                    <el-button size="small" plain @click="item.sales_limit = 10"
                      >設上限</el-button
                    >
                  </template>
                  <!-- 限量 -->
                  <template v-else>
                    <div class="quantity-control">
                      <el-button
                        icon="Minus"
                        circle
                        size="small"
                        :disabled="item.sales_limit <= 0"
                        @click="decrementLimit(item)"
                      />
                      <el-input
                        v-model.number="item.sales_limit"
                        class="quantity-input"
                        inputmode="numeric"
                      />
                      <el-button
                        icon="Plus"
                        circle
                        type="primary"
                        plain
                        size="small"
                        @click="incrementLimit(item)"
                      />
                    </div>
                    <el-button
                      size="small"
                      plain
                      @click="item.sales_limit = null"
                      >不限量</el-button
                    >
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.schedule-editor {
  flex: 1;
  min-width: 420px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  animation: slideInRight 0.3s ease;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.editor-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.editor-back {
  border: 1px solid #e2e8f0;
}

.editor-body {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-section {
  background: var(--bg-page);
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid #e8dfd6;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.status-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 4px;

  b {
    font-weight: 700;
  }

  &--announced {
    background: #eef2ff;
    color: #3050a0;
    border-left: 3px solid #6080d0;
  }

  &--open {
    background: #e8f9ef;
    color: #1a6b40;
    border-left: 3px solid #2eaa62;
  }

  &--closed {
    background: #f1f5f9;
    color: #475569;
    border-left: 3px solid #94a3b8;
  }
}

.section-note {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 12px;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.field-label {
  color: #64748b;
  white-space: nowrap;
}

.field-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.field-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.4;
}

.datetime-inputs {
  display: flex;
  gap: 8px;
}

.add-row {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.product-select {
  width: 100%;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-wrapper {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}

.product-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
}

.product-id {
  font-size: 12px;
  color: #94a3b8;
}

.product-limit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.limit-badge {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 3px 10px;
  white-space: nowrap;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;

  .quantity-input {
    width: 60px;
    font-size: 16px;
  }
}

.empty-products {
  color: #94a3b8;
  font-size: 13px;
  padding: 8px 0;
}

.venue-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  .section-title { margin-bottom: 2px; }
  .section-note { margin-bottom: 0; }
}

.venue-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.time-sep {
  flex-shrink: 0;
  color: #94a3b8;
  line-height: 32px;
}

.venue-preview {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 13px;
  color: #0369a1;
  i { flex-shrink: 0; font-size: 15px; margin-top: 1px; }
  b { font-weight: 700; }
}

.schedule-timeline {
  margin-top: 14px;
  :deep(.el-step.is-simple) {
    background: transparent;
  }

  :deep(.el-step__icon) {
    display: none;
  }

  .tl-step {
    display: flex;
    flex-direction: column;
  }

  .tl-label {
    font-size: 14px;
  }

  .tl-time {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 4px;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 400;
    line-height: 1.3;
  }

  @media (max-width: 768px) {
    .tl-time {
      font-size: 10px;
    }
    .tl-label {
      font-size: 12px;
    }
  }
}
:deep(.el-steps--simple) {
  background: transparent;
  padding: 5px 5%;
}
@media (max-width: 768px) {
  :deep(.el-steps--simple) {
    padding: 5px 2%;
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 1024px) {
  .schedule-editor {
    min-width: 100%;
    min-height: 300px;
  }

  .datetime-inputs {
    flex-wrap: wrap;
  }

  .product-item {
    display: flex;

    gap: 4px;
    position: relative;
    .product-info {
      width: 100%;
    }
    .product-limit {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
  }
}
</style>
