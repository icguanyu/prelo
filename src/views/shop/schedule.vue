<script setup>
import dayjs from "dayjs";
import "dayjs/locale/zh-tw";
import { Schedules } from "@/api/schedules";
import { scheduleStatusOptions } from "@/utils/constants";

// 排程狀態
const baseDate = ref(dayjs()); // 當前展示的基準月份
const selectedDate = ref(null); // 選中的日期用於右側詳情面板
const scheduleList = ref([]);
const scheduleMap = ref({});
const schedule = reactive({
  schedule_date: "",
  status: "DRAFT",
  order_start_at: null,
  order_end_at: null,
  items: [],
  orders: [],
});
const isEditorOpen = ref(false);
const isMonthLoading = ref(false);
const isDayLoading = ref(false);
const calendarMode = ref(localStorage.getItem("schedule-calendar-mode") || "sidebar");
const todayStr = dayjs().format("YYYY-MM-DD");

const currentMonthDays = computed(() =>
  scheduleList.value.filter((d) => d.isCurrentMonth),
);

const scheduleStatusLabelMap = scheduleStatusOptions.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});

const getScheduleDateKeys = (scheduleDate) => {
  if (!scheduleDate) return [];
  const localDate = dayjs(scheduleDate).format("YYYY-MM-DD");
  return localDate ? [localDate] : [];
};

// 生成排程列表（日曆邏輯）
const generateScheduleList = () => {
  const list = [];
  const monthStart = baseDate.value.startOf("month");
  const monthEnd = baseDate.value.endOf("month");

  // 找到該月第一天是周幾（0 = 周日）
  const firstDayOfWeek = monthStart.day();
  // 計算日曆開始日期（可能是上月的日期）
  const calendarStart = monthStart.subtract(firstDayOfWeek, "day");

  // 計算日曆結束日期（可能是下月的日期）
  const lastDayOfWeek = monthEnd.day();
  const daysToAdd = 6 - lastDayOfWeek; // 到週六還需要多少天
  const calendarEnd = monthEnd.add(daysToAdd, "day");

  let currentDate = calendarStart;
  while (currentDate.isBefore(calendarEnd) || currentDate.isSame(calendarEnd)) {
    const date = currentDate.format("YYYY-MM-DD");
    const currentMonth = currentDate.format("YYYY-MM");
    const baseMonth = baseDate.value.format("YYYY-MM");
    const isCurrentMonth = currentMonth === baseMonth;

    const scheduleData = scheduleMap.value[date] || null;
    const orderCount = scheduleData?.order_count ?? 0;
    const itemCount = scheduleData?.item_count ?? 0;
    const status = scheduleData?.status || "DRAFT";
    const statusLabel = scheduleStatusLabelMap[status] || status;
    const hasSchedule = Boolean(scheduleData);
    const hasOrders = orderCount > 0;

    list.push({
      date,
      dateObj: currentDate.clone(),
      orderCount,
      itemCount,
      status,
      statusLabel,
      hasSchedule,
      hasOrders,
      isCurrentMonth, // 是否為當月日期
      venueName: scheduleData?.venue_name || "",
    });

    currentDate = currentDate.add(1, "day");
  }
  return list;
};

const seedScheduleList = () => {
  scheduleList.value = generateScheduleList();
  initScheduleList();
};

// 初始化排程列表
const initScheduleList = () => {
  scheduleList.value = generateScheduleList();

  // 若已有選取且仍在當月就保留
  const currentSelection = selectedDate.value;
  const currentSelectionSchedule = currentSelection
    ? scheduleList.value.find((s) => s.date === currentSelection)
    : null;
  if (currentSelectionSchedule?.isCurrentMonth) {
    selectedDate.value = currentSelection;
    return;
  }

  // 預設開啟今天（若在當月）
  const today = dayjs().format("YYYY-MM-DD");
  const todaySchedule = scheduleList.value.find(
    (s) => s.date === today && s.isCurrentMonth,
  );
  if (todaySchedule) {
    selectedDate.value = today;
    return;
  }

  // 否則顯示當月第一個有排程的日期，沒有就顯示當月第一天
  const firstScheduleDay = scheduleList.value.find(
    (s) => s.hasSchedule && s.isCurrentMonth,
  );
  const firstDayOfMonth = scheduleList.value.find((s) => s.isCurrentMonth);
  selectedDate.value = firstScheduleDay?.date || firstDayOfMonth?.date || null;
};

// 更新排程列表
const updateScheduleList = () => {
  initScheduleList();
};

// 上一個月
const goPreviousMonth = () => {
  baseDate.value = baseDate.value.subtract(1, "month");
  initScheduleDataByMonth();
};

// 下一個月
const goNextMonth = () => {
  baseDate.value = baseDate.value.add(1, "month");
  initScheduleDataByMonth();
};

// 回到今天
const goToday = () => {
  baseDate.value = dayjs();
  selectedDate.value = null;
  initScheduleDataByMonth();
};

// 上一天
const goPreviousDay = () => {
  if (!selectedDate.value) {
    selectedDate.value = dayjs().format("YYYY-MM-DD");
    return;
  }

  const currentDate = dayjs(selectedDate.value);
  const previousDate = currentDate.subtract(1, "day");

  // 檢查是否需要切換月份
  if (previousDate.format("YYYY-MM") !== baseDate.value.format("YYYY-MM")) {
    baseDate.value = previousDate;
    initScheduleDataByMonth();
  }

  selectedDate.value = previousDate.format("YYYY-MM-DD");
};

// 下一天
const goNextDay = () => {
  if (!selectedDate.value) {
    selectedDate.value = dayjs().format("YYYY-MM-DD");
    return;
  }

  const currentDate = dayjs(selectedDate.value);
  const nextDate = currentDate.add(1, "day");

  // 檢查是否需要切換月份
  if (nextDate.format("YYYY-MM") !== baseDate.value.format("YYYY-MM")) {
    baseDate.value = nextDate;
    initScheduleDataByMonth();
  }

  selectedDate.value = nextDate.format("YYYY-MM-DD");
};

// 獲取當前月份顯示文字
const getCurrentMonthLabel = computed(() => {
  return baseDate.value.format("YYYY 年 M 月");
});

const selectedDateStats = computed(() => {
  if (!selectedDate.value) return null;
  const list = Array.isArray(schedule.orders) ? schedule.orders : [];
  if (list.length === 0) return null;

  const stats = {
    total: list.length,
    ordered: list.filter((o) => o.status === "PLACED").length || 0,
    completed: list.filter((o) => o.status === "COMPLETED").length || 0,
    cancelled: list.filter((o) => o.status === "CANCELLED").length || 0,
    total_amount: getOrderAmount(schedule.orders) || 0,
  };

  return stats;
});

const getOrderAmount = (orders) => {
  if (!orders || orders.length === 0) return 0;
  return orders.reduce((total, order) => {
    const amount = order.total_amount || 0;
    return total + amount;
  }, 0);
};

const openEditor = (schedule) => {
  isEditorOpen.value = true;
};

const closeEditor = () => {
  isEditorOpen.value = false;
};

const initScheduleDataByMonth = async () => {
  const month = baseDate.value.format("YYYY-MM");
  isMonthLoading.value = true;
  scheduleMap.value = {};
  seedScheduleList();
  try {
    const res = await Schedules.GetByMonth(month);
    const list = Array.isArray(res?.data.data) ? res.data.data : [];
    console.log("Schedules.GetByMonth:", month, list);
    scheduleMap.value = list.reduce((map, item) => {
      const keys = getScheduleDateKeys(item.schedule_date);
      keys.forEach((key) => {
        map[key] = item;
      });
      return map;
    }, {});
    updateScheduleList();
  } catch (error) {
  } finally {
    isMonthLoading.value = false;
  }
};

let latestDateRequest = null;

const initScheduleDataByDate = async (date) => {
  if (!date) return;
  latestDateRequest = date;
  isDayLoading.value = true;
  try {
    const res = await Schedules.GetByDate(date);
    if (date !== latestDateRequest) return;
    console.log("Schedules.GetByDate:", date, res);
    if (res.data === null) {
      Object.assign(schedule, {
        id: null,
        schedule_date: date,
        status: "DRAFT",
        order_start_at: null,
        order_end_at: null,
        items: [],
        orders: [],
        order_count: 0,
        item_count: 0,
      });
      return;
    }
    Object.assign(schedule, res.data);
  } catch (error) {
  } finally {
    if (date === latestDateRequest) isDayLoading.value = false;
  }
};

watch(
  () => selectedDate.value,
  (val) => {
    initScheduleDataByDate(val);
  },
);

onMounted(() => {
  seedScheduleList();
  initScheduleDataByMonth();
});

watch(calendarMode, (val) => {
  localStorage.setItem("schedule-calendar-mode", val);
});
</script>

<template>
  <div class="schedule-container">
    <!-- 頂部標題與導航 -->
    <div class="schedule-header">
      <div class="header-top">
        <div>
          <h2>接單排程</h2>
        </div>
        <div class="header-actions">
          <div class="view-toggle">
            <button
              class="view-btn"
              :class="{ active: calendarMode === 'sidebar' }"
              title="月曆側欄"
              @click="calendarMode = 'sidebar'"
            >
              <el-icon><Grid /></el-icon>
            </button>
            <button
              class="view-btn"
              :class="{ active: calendarMode === 'strip' }"
              title="月份橫條"
              @click="calendarMode = 'strip'"
            >
              <el-icon><Menu /></el-icon>
            </button>
          </div>
          <el-button type="primary" icon="Back" @click="goToday">
            今日
          </el-button>
        </div>
      </div>
    </div>

    <!-- 月份橫條（strip 模式，手機隱藏） -->
    <div v-show="calendarMode === 'strip'" class="month-strip-bar">
      <div class="month-strip-header">
        <el-button
          class="strip-nav-btn"
          icon="ArrowLeft"
          circle
          size="small"
          @click="goPreviousMonth"
        />
        <span class="month-strip-label">{{ getCurrentMonthLabel }}</span>
        <el-button
          class="strip-nav-btn"
          icon="ArrowRight"
          circle
          size="small"
          @click="goNextMonth"
        />
      </div>
      <div class="month-strip-scroll">
        <button
          v-for="day in currentMonthDays"
          :key="day.date"
          class="strip-cell"
          :class="{
            active: day.date === selectedDate,
            today: day.date === todayStr,
            'has-schedule': day.hasSchedule,
          }"
          @click="selectedDate = day.date"
        >
          <span class="strip-name">{{
            dayjs(day.date).locale("zh-tw").format("dd")
          }}</span>
          <span class="strip-num">{{ dayjs(day.date).format("D") }}</span>
          <span v-if="day.hasSchedule" class="strip-dot" />
        </button>
      </div>
    </div>

    <!-- 排程列表 + 訂單詳情 -->
    <div class="schedule-main">
      <ScheduleEditor
        v-if="isEditorOpen"
        :schedule="schedule"
        @close="closeEditor"
        @update="
          () => {
            initScheduleDataByMonth(selectedDate);
            initScheduleDataByDate(selectedDate);
          }
        "
      />

      <!-- 左側：訂單詳情面板 -->
      <div v-else-if="selectedDate" class="schedule-left">
        <div class="detail-header">
          <div class="detail-header-left">
            <el-button
              class="day-nav-btn"
              icon="ArrowLeft"
              circle
              size="small"
              @click="goPreviousDay"
            />
            <div>
              <h3>
                {{
                  dayjs(selectedDate)
                    .locale("zh-tw")
                    .format("YYYY 年 M 月 DD 日 (dd)")
                }}
              </h3>
            </div>

            <el-button
              class="day-nav-btn"
              icon="ArrowRight"
              circle
              size="small"
              @click="goNextDay"
            />
          </div>
          <div class="detail-actions">
            <el-button icon="Edit" @click="openEditor(schedule)">
              編輯
            </el-button>
          </div>
        </div>

        <!-- 統計列 -->
        <div v-if="selectedDateStats" class="stats-row">
          <div class="stat-pill">
            <span class="pill-num">{{ selectedDateStats.total }}</span>
            <span class="pill-label">訂單</span>
          </div>
          <div class="pill-divider"></div>
          <div class="stat-pill">
            <span class="pill-num blue">{{ selectedDateStats.ordered }}</span>
            <span class="pill-label">已下單</span>
          </div>
          <div class="pill-divider"></div>
          <div class="stat-pill">
            <span class="pill-num green">{{
              selectedDateStats.completed
            }}</span>
            <span class="pill-label">已完成</span>
          </div>
          <div class="pill-divider"></div>
          <div class="stat-pill">
            <span class="pill-num red">{{ selectedDateStats.cancelled }}</span>
            <span class="pill-label">已取消</span>
          </div>
          <div class="pill-divider"></div>
          <div class="stat-pill">
            <span class="pill-num amber">{{
              $formatPrice(selectedDateStats.total_amount)
            }}</span>
            <span class="pill-label">總金額</span>
          </div>
        </div>

        <div v-if="isDayLoading" class="detail-loading">資料載入中...</div>
        <div v-else class="detail-content">
          <!-- 今日出爐商品 -->
          <div class="products-section">
            <div class="section-title">
              <span>今日出爐</span>
              <span class="count">{{ schedule.items.length }} 項商品</span>
            </div>
            <div class="items-list">
              <div
                v-for="product in schedule.items"
                :key="product.id"
                class="item-card"
              >
                <el-badge
                  :hidden="(product.ordered_quantity ?? 0) === 0"
                  :value="`${product.ordered_quantity ?? 0}`"
                  class="item-demand-badge"
                >
                  <div class="item-thumb">
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      :alt="product.product_name"
                    />
                  </div>
                </el-badge>
                <div class="item-info">
                  <div class="item-name">{{ product.product_name }}</div>
                  <div class="item-price">
                    {{ $formatPrice(product.unit_price) }}
                  </div>
                </div>
              </div>
              <div class="order-note">※數字表示已下單數量</div>
            </div>
          </div>
          <div v-if="schedule.items.length === 0" class="empty-orders">
            <el-icon><ShoppingCart /></el-icon>
            <p>尚未開單</p>
          </div>

        </div>
      </div>

      <div v-show="calendarMode === 'sidebar'" class="schedule-right">
        <!-- 月份導航 -->
        <div class="month-navigation">
          <el-button
            class="month-nav-btn"
            icon="ArrowLeft"
            circle
            size="small"
            @click="goPreviousMonth"
          />
          <span class="month-label">{{ getCurrentMonthLabel }}</span>
          <el-button
            class="month-nav-btn"
            icon="ArrowRight"
            circle
            size="small"
            @click="goNextMonth"
          />
        </div>
        <ScheduleCalendar
          :schedule-list="scheduleList"
          :selected-date="selectedDate"
          :is-loading="isMonthLoading"
          @select="selectedDate = $event"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/scss/scrollbar.scss" as *;
.schedule-container {
  padding: 16px;
  background: var(--bg-page);
  min-height: 100vh;
}

.schedule-header {
  margin-bottom: 12px;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
    gap: 12px;

    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .el-button {
      height: 40px;
      padding: 0 12px;
      font-size: 14px;
      font-weight: 600;
    }
  }
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8dfd6;

  .month-label {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
  }
}

.month-nav-btn {
  flex-shrink: 0;
  border: 1px solid #e8dfd6;
  width: 34px;
  height: 34px;
}

// ─── 標題區右側操作群 ─────────────────────────────────────────────────────────
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.view-toggle {
  display: flex;
  border: 1px solid #e8dfd6;
  border-radius: 8px;
  overflow: hidden;
}

.view-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: white;
  cursor: pointer;
  color: #94a3b8;
  transition: background 0.15s, color 0.15s;
  font-size: 14px;

  &:hover {
    background: #fff0ec;
    color: #475569;
  }

  &.active {
    background: var(--color-primary);
    color: #fff;
  }
}

// ─── 月份橫條 ─────────────────────────────────────────────────────────────────
.month-strip-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8dfd6;
  padding: 8px 12px;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    display: none !important;
  }
}

.month-strip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.month-strip-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  min-width: 92px;
  text-align: center;
}

.strip-nav-btn {
  border: 1px solid #e8dfd6;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
}

.month-strip-scroll {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: #d8d3ce transparent;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d8d3ce;
    border-radius: 2px;

    &:hover {
      background: #c5bfb9;
    }
  }
}

.strip-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 5px 7px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
  min-width: 36px;
  flex-shrink: 0;

  &:hover {
    background: #fff0ec;
  }

  &.today .strip-num {
    color: var(--color-primary);
    font-weight: 700;
  }

  &.active {
    background: var(--color-primary);

    .strip-name,
    .strip-num {
      color: #fff;
    }

    .strip-dot {
      background: rgba(255, 255, 255, 0.7);
    }
  }
}

.strip-name {
  font-size: 10px;
  color: #94a3b8;
  line-height: 1;
}

.strip-num {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1;
}

.strip-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

// 左右分割主容器
.schedule-main {
  display: flex;
  gap: 12px;
  min-height: calc(100vh - 200px);
}

.schedule-left {
  flex: 1;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  animation: slideInRight 0.3s ease;
}

.schedule-right {
  flex: 0 0 auto;

  display: flex;
  flex-direction: column;
  gap: 10px;
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

.detail-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 8px;

  .detail-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .day-nav-btn {
    flex-shrink: 0;
    border: 1px solid #e8dfd6;
    width: 34px;
    height: 34px;
  }

  h3 {
    margin: 0;
  }
}

.detail-actions {
  display: flex;
  align-items: flex-start;
}

.detail-more {
  border: 1px solid #e8dfd6;
  width: 36px;
  height: 36px;
}

.stats-row {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-page);
  border-top: 1px solid #e8dfd6;
  border-bottom: 1px solid #e8dfd6;
}

.stat-pill {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;

  .pill-num {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;

    &.blue {
      color: var(--color-primary);
    }
    &.green {
      color: #10b981;
    }
    &.red {
      color: #8c8c8c;
    }
    &.amber {
      color: #d97706;
      font-size: 20px;
    }
  }

  .pill-label {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
  }
}

.pill-divider {
  width: 1px;
  height: 40px;
  background: #e8dfd6;
  flex-shrink: 0;
  margin: 0 4px;
}

.detail-content {
  flex: 1;
  padding: 12px 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

.detail-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 16px;
  color: #94a3b8;
  font-size: 13px;
  min-height: 200px;
}

// 商品區塊
.products-section {
  margin-bottom: 10px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e8dfd6;
  font-size: 15px;
  .count {
    color: #94a3b8;
    font-weight: 400;
  }
}

.items-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  .order-note {
    font-size: 14px;
    color: #64748b;
    margin-top: 4px;
  }
}

.item-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background: white;
  border: 1px solid #e8dfd6;
  border-radius: 6px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }
}

.item-thumb {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 4px;
  background: #f1f5f9;
  border: 1px solid #e8dfd6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.item-demand-badge {
  flex-shrink: 0;

  :deep(.el-badge__content) {
    border: none;
    font-weight: 600;
    padding: 0 6px;
    min-width: auto;
    height: 18px;
    line-height: 18px;
  }
}

.item-name {
  font-weight: 600;
  color: #1e293b;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-weight: 700;
  color: #1c2345;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.item-ordered-quantity {
  display: none;
}

// 訂單區塊
.orders-section {
  margin-top: 12px;
}

.empty-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 16px;
  color: #94a3b8;

  .el-icon {
    font-size: 28px;
    margin-bottom: 6px;
  }

  p {
    margin: 0;
    font-size: 13px;
  }
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
  @include scrollbar(rgb(160, 160, 160), rgb(255, 0, 0), rgb(245, 245, 245));
}

.order-row {
  display: grid;
  min-width: 480px;
  grid-template-columns: 130px 70px 50px 45px 70px 70px;
  gap: 6px;
  align-items: center;
  padding: 8px;
  background: var(--bg-page);
  border-radius: 6px;
  border-left: 4px solid var(--color-primary);
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .order-id {
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
  }

  .order-customer {
    .name {
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .order-time {
    color: #475569;
    font-weight: 600;
    font-size: 13px;
  }

  .order-items {
    color: #64748b;
    font-weight: 500;
  }

  .order-amount {
    font-weight: 700;
    color: #1e293b;
    font-size: 15px;
  }

  .order-status {
    color: white;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 4px;
    text-align: center;
    font-size: 12px;
  }
}

// 響應式
@media (max-width: 1200px) {
  .schedule-main {
    min-height: auto;
  }

  .schedule-left {
    min-width: 350px;
  }
}

@media (max-width: 1024px) {
  .schedule-main {
    flex-direction: column;
    min-height: auto;
    gap: 10px;
  }

  .schedule-left {
    min-width: 100%;
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .schedule-container {
    padding: 10px 4%;
  }

  .schedule-main {
    flex-direction: column;
    gap: 8px;
  }

  .schedule-left {
    min-height: 250px;
  }

  .detail-header {
    padding: 8px 10px;
    gap: 6px;
  }

  .detail-content {
    padding: 8px 10px;
  }

  .products-section {
    margin-bottom: 8px;
  }

  .items-list {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .item-card {
    padding: 3px 6px;
    gap: 10px;

    .item-thumb {
      width: 50px;
      height: 50px;
    }

    .item-name {
      font-size: 14px;
    }

    .item-price {
      font-size: 14px;
      min-width: 60px;
    }
  }

  .stats-row {
    padding: 8px 10px;
  }

  .stat-pill .pill-num {
    font-size: 16px;
    &.amber {
      font-size: 12px;
    }
  }
}
</style>
