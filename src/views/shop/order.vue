<script setup>
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { orderStatusOptions } from "@/utils/constants";
import { Schedules } from "@/api/schedules";
import { Orders } from "@/api/orders";
import { Users } from "@/api/auth";
import { ElNotification } from "element-plus";

const router = useRouter();
const scrollContainerRef = ref(null);
const orderCreate = ref(null);
const shopData = ref(null);
// 訂單狀態
const activeTab = ref("all");
const searchQuery = ref("");
const selectedDate = ref(dayjs().format("YYYY-MM-DD"));
const viewMode = ref(localStorage.getItem("order-view-mode") || "detailed");
const isLoading = ref(false);
const refreshCooling = ref(false);
const showStats = ref(localStorage.getItem("order-show-stats") !== "false");

watch(viewMode, (v) => localStorage.setItem("order-view-mode", v));
watch(showStats, (v) => localStorage.setItem("order-show-stats", String(v)));

// 當日開單
const schedule = reactive({
  schedule_date: "",
  status: "DRAFT",
  order_start_at: null,
  order_end_at: null,
  items: [],
  orders: [],
});

const statusOptions = orderStatusOptions;

// 計算當前日期各狀態數量
const statusCounts = computed(() => {
  const counts = {};
  const dateOrders = schedule.orders.filter((o) =>
    o.pickup_time.startsWith(selectedDate.value),
  );
  dateOrders.forEach((order) => {
    counts[order.status] = (counts[order.status] || 0) + 1;
  });
  return counts;
});

// 更新狀態選項的計數
statusOptions.forEach((option) => {
  if (option.value !== "all") {
    Object.defineProperty(option, "count", {
      get: () => statusCounts.value[option.value] || 0,
    });
  }
});

// 日期統計
const dateStats = computed(() => {
  return {
    total: schedule.orders.length,
    placed: schedule.orders.filter((o) => o.status === "PLACED").length,
    completed: schedule.orders.filter((o) => o.status === "COMPLETED").length,
    cancelled: schedule.orders.filter((o) => o.status === "CANCELLED").length,
    revenue: schedule.orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total_amount, 0),
  };
});

// 週日期條
const datePickerRef = ref(null);
const dayNames = ["日", "一", "二", "三", "四", "五", "六"];

const weekDays = computed(() => {
  const start = dayjs(selectedDate.value).startOf("week");
  return Array.from({ length: 7 }, (_, i) => {
    const d = start.add(i, "day");
    return {
      date: d.format("YYYY-MM-DD"),
      name: dayNames[d.day()],
      num: d.format("D"),
      isToday: d.isSame(dayjs(), "day"),
    };
  });
});

const goPrevWeek = () => {
  selectedDate.value = dayjs(selectedDate.value)
    .subtract(7, "day")
    .format("YYYY-MM-DD");
};

const goNextWeek = () => {
  selectedDate.value = dayjs(selectedDate.value)
    .add(7, "day")
    .format("YYYY-MM-DD");
};

// 日期顯示標籤
const dateLabel = computed(() => {
  const today = dayjs().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

  if (selectedDate.value === today) return "今日";
  if (selectedDate.value === tomorrow) return "明日";
  if (selectedDate.value === yesterday) return "昨日";
  return dayjs(selectedDate.value).format("M/D");
});

// 篩選訂單
const filteredOrders = computed(() => {
  let result = schedule.orders;

  // 狀態篩選
  if (activeTab.value !== "all") {
    result = result.filter((o) => o.status === activeTab.value);
  }

  // 搜尋篩選
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (o) =>
        o.id.toLowerCase().includes(query) ||
        (o.order_no || "").toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_phone.includes(query),
    );
  }
  return result;
});

const getStatusLabel = (status) => {
  const map = {
    PLACED: "已下單",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  };
  return map[status] || status;
};

const updateStatus = async (order, newStatus) => {
  isLoading.value = true;
  try {
    await Orders.UpdateStatus(order.id, { status: newStatus });
    ElNotification({
      title: "成功",
      message: `顧客 ${order.customer_name} 的訂單已更新為${getStatusLabel(newStatus)}`,
      type: "success",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
  } finally {
    isLoading.value = false;
    // 重新載入當天的排程資料，以獲得最新的訂單列表
    await initScheduleDataByDate(selectedDate.value);
  }
};

// 快捷日期選擇
const setToday = () => {
  selectedDate.value = dayjs().format("YYYY-MM-DD");
};

const setTomorrow = () => {
  selectedDate.value = dayjs().add(1, "day").format("YYYY-MM-DD");
};

const setDayAfterTomorrow = () => {
  selectedDate.value = dayjs().add(2, "day").format("YYYY-MM-DD");
};

const isSelectedDate = (offset) => {
  const targetDate = dayjs().add(offset, "day").format("YYYY-MM-DD");
  return selectedDate.value === targetDate;
};

const clearSearch = () => {
  searchQuery.value = "";
};

const anchorWindowSize = 8;
const scrollState = ref({ y: 0, max: 0 });
const anchorNavRef = ref(null);

const updateScrollState = () => {
  const container = scrollContainerRef.value;
  if (!container) return;
  const y = container.scrollTop || 0;
  const scrollHeight = container.scrollHeight;
  const max = Math.max(0, scrollHeight - container.clientHeight);
  scrollState.value = { y, max };

  const anchorNav = anchorNavRef.value;
  if (!anchorNav) return;
  const anchorMax = anchorNav.scrollHeight - anchorNav.clientHeight;
  if (anchorMax <= 0) {
    anchorNav.scrollTop = 0;
    return;
  }
  const ratio = max > 0 ? y / max : 0;
  anchorNav.scrollTop = Math.round(anchorMax * ratio);
};

const handleScroll = () => {
  window.requestAnimationFrame(updateScrollState);
};

const getOrderAnchorId = (order) => `order-${order.id}`;

const getOrderNumberLabel = (order) => {
  const raw = order?.order_no ?? order?.id ?? "";
  const match = String(raw).match(/(?:^|[-_])(\d{3})$/);
  return match ? match[1] : "000";
};

const visibleAnchors = computed(() => filteredOrders.value);

const scrollToOrder = (order) => {
  const anchorId = getOrderAnchorId(order);
  const target = document.getElementById(anchorId);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

// 處理訂單建立成功
const handleOrderCreated = async (newOrder) => {
  // 重新載入當天的排程資料，以營得最新的訂單列表
  await initScheduleDataByDate(selectedDate.value);
};

const initScheduleDataByDate = async (date) => {
  if (!date) return;
  isLoading.value = true;
  try {
    const res = await Schedules.GetByDate(date);
    if (res.data === null) {
      Object.assign(schedule, {
        id: null,
        schedule_date: date,
        status: "DRAFT",
        order_start_at: null,
        order_end_at: null,
        items: [],
        orders: [],
      });
      return;
    }
    Object.assign(schedule, res.data);
  } catch (error) {
  } finally {
    isLoading.value = false;
    refreshCooling.value = true;
    setTimeout(() => (refreshCooling.value = false), 3000);
  }
};

const handleOrderDeleted = () => {};

onMounted(async () => {
  scrollContainerRef.value = document.querySelector(".container");
  if (scrollContainerRef.value) {
    scrollContainerRef.value.addEventListener("scroll", handleScroll, {
      passive: true,
    });
  }
  window.addEventListener("resize", handleScroll, { passive: true });
  initScheduleDataByDate(selectedDate.value);
  try {
    const res = await Users.Me();
    shopData.value = res.data;
  } catch {}
});

onBeforeUnmount(() => {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.removeEventListener("scroll", handleScroll);
  }
  window.removeEventListener("resize", handleScroll);
});

watch(
  filteredOrders,
  () => {
    nextTick(() => {
      updateScrollState();
    });
  },
  { immediate: true },
);

watch(selectedDate, (val) => {
  initScheduleDataByDate(val);
});
</script>

<template>
  <div class="order-manager">
    <!-- 頂部標題 -->
    <div class="order-header">
      <div class="header-top">
        <div>
          <h2>訂單管理</h2>
          <p class="subtitle">查看與管理每日訂單，追蹤訂單狀態</p>
        </div>
        <div class="header-actions">
          <div class="view-toggles">
            <button
              class="toggle-btn"
              :class="{ active: showStats }"
              @click="showStats = !showStats"
              :title="showStats ? '隱藏統計' : '顯示統計'"
            >
              <el-icon><DataLine /></el-icon>
              <span>統計</span>
            </button>
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'detailed' }"
              @click="
                viewMode = viewMode === 'detailed' ? 'simple' : 'detailed'
              "
              :title="viewMode === 'detailed' ? '卡片' : '清單'"
            >
              <el-icon><Document /></el-icon>
              <span>{{ viewMode === "detailed" ? "卡片" : "清單" }}</span>
            </button>
          </div>
          <el-button
            class="btn-refresh"
            :loading="isLoading"
            :icon="isLoading ? '' : 'Refresh'"
            @click="initScheduleDataByDate(selectedDate)"
            >刷新</el-button
          >
          <el-button @click="setToday">回今天</el-button>
          <el-button
            type="primary"
            icon="Plus"
            :disabled="!schedule.id"
            @click="orderCreate.open(schedule, shopData)"
            >{{ schedule.id ? "新增訂單" : "請先開單" }}</el-button
          >
        </div>
      </div>
    </div>

    <!-- 頂部統計卡片 -->
    <div v-show="showStats" class="stats-block">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-value">{{ dateStats.total }}</div>
          <div class="stat-label">{{ dateLabel }}訂單</div>
        </div>
        <div class="stat-card">
          <div class="stat-value placed">{{ dateStats.placed }}</div>
          <div class="stat-label">已下單</div>
        </div>
        <div class="stat-card">
          <div class="stat-value completed">{{ dateStats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value cancelled">{{ dateStats.cancelled }}</div>
          <div class="stat-label">已取消</div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-value">{{ $formatPrice(dateStats.revenue) }}</div>
          <div class="stat-label">{{ dateLabel }}總金額</div>
        </div>
      </div>
    </div>

    <!-- 日期選擇與搜尋 -->
    <div class="toolbar">
      <div class="date-nav">
        <el-button
          icon="ArrowLeft"
          circle
          size="small"
          :loading="isLoading"
          @click="goPrevWeek"
        />
        <div class="week-strip">
          <button
            v-for="day in weekDays"
            :key="day.date"
            class="day-cell"
            :class="{ active: day.date === selectedDate, today: day.isToday }"
            @click="selectedDate = day.date"
          >
            <span class="day-name">{{ day.name }}</span>
            <span class="day-num">{{ day.num }}</span>
          </button>
        </div>
        <el-button
          icon="ArrowRight"
          circle
          size="small"
          :loading="isLoading"
          @click="goNextWeek"
        />
      </div>
      <div class="toolbar-search">
        <el-date-picker
          ref="datePickerRef"
          v-model="selectedDate"
          type="date"
          value-format="YYYY-MM-DD"
          :clearable="false"
          class="hidden-picker"
        />
        <!-- <el-button
          icon="Calendar"
          circle
          size="small"
          title="跳至指定日期"
          @click="datePickerRef.focus()"
        /> -->
        <el-input
          v-model="searchQuery"
          placeholder="搜尋姓名、電話、編號"
          prefix-icon="Search"
          clearable
          @clear="clearSearch"
        />
      </div>
    </div>

    <!-- 狀態分類標籤 -->
    <div class="status-tabs">
      <div
        v-for="tab in statusOptions"
        :key="tab.value"
        class="status-tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        <span class="tab-label">{{ tab.label }}</span>
        <span
          v-if="tab.value !== 'all'"
          class="tab-count"
          :style="{ background: tab.color }"
        >
          {{ dateStats[tab.value.toLowerCase()] }}
        </span>
        <span v-else class="tab-count-all">{{ dateStats.total }}</span>
      </div>
    </div>

    <!-- 訂單列表 -->
    <div class="orders-grid" :class="{ 'list-view': viewMode === 'simple' }">
      <!-- 讀取中骨架屏 -->
      <template v-if="isLoading">
        <div v-for="i in 6" :key="`skeleton-${i}`" class="order-skeleton">
          <el-skeleton animated>
            <template #template>
              <div class="skeleton-header">
                <el-skeleton-item variant="text" style="width: 60%" />
                <el-skeleton-item variant="text" style="width: 30%" />
              </div>
              <div class="skeleton-customer">
                <el-skeleton-item variant="text" style="width: 40%" />
                <el-skeleton-item variant="text" style="width: 50%" />
              </div>
              <div class="skeleton-divider" />
              <div class="skeleton-items">
                <el-skeleton-item
                  variant="text"
                  style="width: 100%; height: 20px"
                />
                <el-skeleton-item
                  variant="text"
                  style="width: 90%; height: 20px"
                />
                <el-skeleton-item
                  variant="text"
                  style="width: 85%; height: 20px"
                />
              </div>
              <div class="skeleton-divider" />
              <div class="skeleton-footer">
                <el-skeleton-item variant="text" style="width: 40%" />
                <el-skeleton-item
                  variant="text"
                  style="width: 35%; height: 30px"
                />
              </div>
              <div class="skeleton-actions">
                <el-skeleton-item
                  variant="button"
                  style="width: 48%; height: 32px"
                />
                <el-skeleton-item
                  variant="button"
                  style="width: 48%; height: 32px"
                />
              </div>
            </template>
          </el-skeleton>
        </div>
      </template>

      <!-- 訂單卡片 -->
      <template v-else>
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card-anchor"
          :id="getOrderAnchorId(order)"
        >
          <OrderCard
            :order="order"
            :items="schedule.items"
            :view-mode="viewMode"
            @status-change="updateStatus"
            @update="initScheduleDataByDate(selectedDate)"
          />
        </div>

        <!-- 空狀態 -->
        <div v-if="filteredOrders.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p class="empty-text">
            {{
              schedule.id
                ? "當前日期沒有符合條件的訂單"
                : "尚未設定當前日期的排程，請先建立排程後再新增訂單"
            }}
          </p>
          <el-button
            v-if="!schedule.id"
            type="primary"
            icon="Calendar"
            @click="router.push({ name: 'shop-schedule' })"
          >
            前往開單
          </el-button>
        </div>
      </template>
    </div>

    <!-- <div
      v-if="filteredOrders.length"
      ref="anchorNavRef"
      class="order-anchor-nav"
    >
      <button
        v-for="order in visibleAnchors"
        :key="order.id"
        type="button"
        class="anchor-item"
        @click="scrollToOrder(order)"
      >
        {{ getOrderNumberLabel(order) }}
      </button>
    </div> -->

    <!-- 建立訂單對話框 -->
    <OrderCreate ref="orderCreate" @created="handleOrderCreated" />
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/scss/scrollbar.scss" as *;

$accent: var(--color-accent);
$accent-light: var(--color-accent-light);
$text-primary: #252525;
$text-secondary: #7a7a7a;
$border: #e8dfd6;
$bg-card: #ffffff;

.order-manager {
  padding: 16px;
  min-height: 100vh;
}

// ── 頂部標題 ────────────────────────────────────────────
.order-header {
  margin-bottom: 12px;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;

    h2 {
      font-size: 24px;
      font-weight: 700;
      color: $text-primary;
      margin: 0 0 4px 0;
      letter-spacing: -0.3px;
    }

    .subtitle {
      font-size: 13px;
      color: $text-secondary;
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;

    .el-button {
      margin: 0;
    }

    .view-toggles {
      display: flex;

      border-radius: 8px;
      overflow: hidden;
      background: $bg-card;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s;

      & + .toggle-btn {
        border-left: 1px solid $border;
      }

      &.active {
        background: $accent;
        color: #fff;
      }

      .el-icon {
        font-size: 14px;
      }
    }
  }
}

// ── 統計卡片 ────────────────────────────────────────────
.stats-block {
  background: $bg-card;
  border: 1px solid $border;
  border-radius: 8px;
  padding: 14px 20px;
  margin-bottom: 12px;
}

.stats-cards {
  display: flex;
  gap: 0;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 12px;

  & + .stat-card {
    border-left: 1px solid $border;
  }

  &.highlight .stat-value {
    color: var(--color-primary);
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1;
    margin-bottom: 4px;

    &.placed {
      color: var(--color-primary);
    }
    &.completed {
      color: #10b981;
    }
    &.cancelled {
      color: #8c8c8c;
    }
  }

  .stat-label {
    font-size: 12px;
    color: $text-secondary;
    font-weight: 500;
    white-space: nowrap;
  }
}

// ── 工具列 ──────────────────────────────────────────────
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;

  .toolbar-search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .date-nav {
    display: flex;
    align-items: center;
    gap: 6px;

    .el-button[circle] {
      flex-shrink: 0;
      border: 1px solid $border;
      width: 32px;
      height: 32px;
    }

    .week-strip {
      display: flex;
      gap: 2px;
      background: $bg-card;
      border: 1px solid $border;
      border-radius: 8px;
      padding: 3px;
    }

    .day-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 5px 9px;
      border-radius: 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s;
      min-width: 36px;

      &:hover {
        background: $accent-light;
      }

      &.today .day-num {
        color: $accent;
        font-weight: 700;
      }

      &.active {
        background: $accent;

        .day-name,
        .day-num {
          color: #fff;
        }
      }

      .day-name {
        font-size: 11px;
        color: $text-secondary;
        line-height: 1;
      }

      .day-num {
        font-size: 15px;
        font-weight: 600;
        color: $text-primary;
        line-height: 1;
      }
    }

    .hidden-picker {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
      overflow: hidden;
    }
  }
}

// ── 狀態標籤 ────────────────────────────────────────────
.status-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  width: 100%;
}

.status-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  background: $bg-card;
  border: 1px solid $border;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex: 1;

  &:hover {
    background: #fafaf9;
    border-color: #d6d3d1;
  }

  &.active {
    border-color: var(--color-accent);
    background: var(--color-accent-light);

    .tab-label {
      color: #333;
      font-weight: 600;
    }
  }

  .tab-label {
    font-size: 14px;
    color: $text-secondary;
    font-weight: 500;
  }

  .tab-count {
    padding: 1px 7px;
    border-radius: 4px;
    color: white;
    font-size: 12px;
    line-height: 16px;
    font-weight: 700;
    min-width: 22px;
    text-align: center;
  }

  .tab-count-all {
    padding: 1px 7px;
    border-radius: 4px;
    background: #fff;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 700;
    min-width: 22px;
    text-align: center;
  }
}

// ── 訂單網格 ────────────────────────────────────────────
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  grid-auto-rows: 1fr;
  gap: 10px;

  &.list-view {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
}

.order-card-anchor {
  scroll-margin-top: 80px;
}

// ── 訂單骨架屏 ──────────────────────────────────────────
.order-skeleton {
  background: $bg-card;
  border-radius: 0;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(28, 25, 23, 0.08);
  border: 1px solid $border;
  min-height: 480px;

  .skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .skeleton-customer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .skeleton-divider {
    height: 1px;
    background: $border;
    margin: 16px 0;
  }

  .skeleton-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .skeleton-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .skeleton-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
}

// ── 快速錨點導覽 ────────────────────────────────────────
.order-anchor-nav {
  position: fixed;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  max-height: 40vh;
  overflow-y: auto;
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 4px;
  border: 1px solid $border;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  @include scrollbar(
    rgba(192, 192, 192, 0.7),
    rgba(120, 120, 120, 0.9),
    rgba(133, 133, 133, 0.08)
  );
  .anchor-item {
    width: 38px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 4px;
    border: 1px solid $border;
    background: $bg-card;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .anchor-item:hover {
    border-color: $accent;
    color: $accent;
    background: $accent-light;
  }

  .anchor-ellipsis {
    font-size: 12px;
    color: #a8a29e;
    line-height: 1;
  }
}

// ── 空狀態 ──────────────────────────────────────────────
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;

  .empty-icon {
    font-size: 56px;
    color: #d6d3d1;
    margin-bottom: 14px;
  }

  .empty-text {
    font-size: 15px;
    color: #a8a29e;
    text-align: center;
    max-width: 320px;
    line-height: 1.6;
  }
}

// ── 響應式 ──────────────────────────────────────────────
@media (max-width: 768px) {
  .order-manager {
    padding: 10px 4%;
  }

  .order-header {
    margin-bottom: 16px;

    .header-top {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .header-actions {
      justify-content: stretch;
      flex-wrap: wrap;

      .el-button:first-child {
        display: none;
      }

      .btn-refresh {
        flex: none;
        width: 32px;
        height: 32px;
        min-width: unset;
      }

      .el-button {
        flex: 1;
        min-width: calc(50% - 4px);
        height: 44px;
        font-size: 15px;
      }
    }
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;

    .date-nav {
      width: 100%;

      .week-strip {
        flex: 1;
      }

      .day-cell {
        flex: 1;
      }
    }

    .toolbar-search {
      width: 100%;
    }
  }

  .orders-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .order-skeleton {
    min-height: 400px;
  }

  .order-anchor-nav {
    display: flex;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    flex-wrap: wrap;
  }

  .stat-card {
    flex: 1 0 calc(50% - 1px);
    align-items: flex-start;
    padding: 8px 12px;

    &:nth-child(2n + 1) {
      border-left: none;
    }

    & + .stat-card:nth-child(3) {
      border-top: 1px solid $border;
    }
    & + .stat-card:nth-child(n + 3) {
      border-top: 1px solid $border;
    }
  }
}
</style>
