<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import dayjs from "dayjs";
import { Shop } from "@/api/shop";
import StoreTopbar from "@/components/store/StoreTopbar.vue";

const router = useRouter();
const route = useRoute();

const today = dayjs();
const currentMonth = ref(today.startOf("month"));
const isLoading = ref(false);
const schedules = ref([]);
const shopName = ref("");

const fetchSchedules = async () => {
  isLoading.value = true;
  try {
    const res = await Shop.GetSchedules(route.params.slug, {
      month: currentMonth.value.format("YYYY-MM"),
    });
    schedules.value = res.data?.data ?? [];
  } catch {
    schedules.value = [];
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  const [, infoRes] = await Promise.allSettled([
    fetchSchedules(),
    Shop.GetInfo(route.params.slug),
  ]);
  if (infoRes.status === "fulfilled") {
    shopName.value = infoRes.value.data?.shopName ?? "";
  }
});
watch(currentMonth, fetchSchedules);

const prevMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, "month");
};
const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, "month");
};

const monthLabel = computed(() => currentMonth.value.format("YYYY 年 M 月"));

const scheduleMap = computed(() => {
  const map = {};
  schedules.value.forEach((s) => {
    map[s.schedule_date] = s;
  });
  return map;
});

// 產生月曆格子（含前後補空格）
const calendarCells = computed(() => {
  const start = currentMonth.value.startOf("month");
  const end = currentMonth.value.endOf("month");
  const cells = [];

  // 補前面的空格（週日=0開始）
  for (let i = 0; i < start.day(); i++) {
    cells.push(null);
  }
  for (let d = start; !d.isAfter(end); d = d.add(1, "day")) {
    cells.push(d);
  }
  return cells;
});

// API 已按月篩好，直接排序即可
const monthSchedules = computed(() =>
  [...schedules.value].sort((a, b) =>
    a.schedule_date.localeCompare(b.schedule_date),
  ),
);

const statusConfig = {
  OPEN: { label: "接單中", class: "badge--open" },
};

const getBadge = (s) => {
  if (s.status === "OPEN") return { label: "接單中", class: "badge--open" };
  if (s.status === "ANNOUNCED") {
    const dt = s.order_start_at ? dayjs(s.order_start_at) : null;
    const label = dt ? `${dt.format("MM/DD HH:mm")} 開放預訂` : "即將開放";
    return { label, class: "badge--announced" };
  }
  return { label: s.status, class: "" };
};

const isPastSchedule = (s) =>
  s.status === "CLOSED" || dayjs(s.schedule_date).isBefore(today, "day");

const getFlowSteps = (s) => [
  { label: "接單中", time: null },
  {
    label: "結單",
    time: s.order_end_at ? dayjs(s.order_end_at).format("M/D HH:mm") : null,
  },
  {
    label: s.is_venue ? "現場取貨" : "到店取貨",
    time:
      s.is_venue && s.venue_start
        ? `${dayjs(s.schedule_date).format("M/D")} ${s.venue_start}${s.venue_end ? "–" + s.venue_end : ""}`
        : s.schedule_date
          ? dayjs(s.schedule_date).format("M/D")
          : null,
  },
];
const getFlowStepIndex = (s) => {
  if (isPastSchedule(s)) return 2;
  if (s.status === "OPEN") return 0;
  if (s.status === "CLOSED") return 1;
  return -1; // ANNOUNCED → all grey
};

const expandedIds = ref(new Set());
const toggleExpand = (id) => {
  const s = new Set(expandedIds.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedIds.value = s;
};

const goOrder = (schedule) => {
  router.push({
    name: "store-order",
    params: { slug: route.params.slug, date: schedule.schedule_date },
  });
};

const formatDeadline = (iso) => dayjs(iso).format("M/D HH:mm");

const addToCalendar = (s) => {
  const shopName = route.params.slug;
  const summary = `開放預訂通知`;
  const description = `${shopName} 的接單行程即將開放，記得來下單！`;

  let dtStart, dtEnd;
  if (s.order_start_at) {
    const dt = dayjs(s.order_start_at);
    dtStart = `DTSTART:${dt.format("YYYYMMDDTHHmmss")}`;
    dtEnd = `DTEND:${dt.add(30, "minute").format("YYYYMMDDTHHmmss")}`;
  } else {
    const dateStr = dayjs(s.schedule_date).format("YYYYMMDD");
    dtStart = `DTSTART;VALUE=DATE:${dateStr}`;
    dtEnd = `DTEND;VALUE=DATE:${dateStr}`;
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Prelo//Prelo//EN",
    "BEGIN:VEVENT",
    dtStart,
    dtEnd,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT0M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${shopName} 現在開放預訂囉！`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prelo-${s.schedule_date}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="schedules-page">
    <StoreTopbar :title="shopName ? `${shopName} - 近期菜單` : '近期菜單'" />

    <div class="content">
      <!-- 月份切換 -->
      <div class="month-nav">
        <button class="month-nav__btn" @click="prevMonth">
          <i class="bx bx-chevron-left"></i>
        </button>
        <span class="month-nav__label">{{ monthLabel }}</span>
        <button class="month-nav__btn" @click="nextMonth">
          <i class="bx bx-chevron-right"></i>
        </button>
      </div>

      <!-- 月曆 -->
      <div class="calendar" :class="{ 'calendar--loading': isLoading }">
        <div class="calendar__week-header">
          <span
            v-for="d in ['日', '一', '二', '三', '四', '五', '六']"
            :key="d"
            >{{ d }}</span
          >
        </div>
        <div class="calendar__grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{
              'cal-cell--empty': !cell,
              'cal-cell--today': cell && cell.isSame(today, 'day'),
              'cal-cell--open':
                cell &&
                scheduleMap[cell.format('YYYY-MM-DD')]?.status === 'OPEN',
              'cal-cell--announced':
                cell &&
                scheduleMap[cell.format('YYYY-MM-DD')]?.status === 'ANNOUNCED',
              'cal-cell--venue':
                cell && !!scheduleMap[cell.format('YYYY-MM-DD')]?.is_venue,
            }"
          >
            <span v-if="cell" class="cal-cell__day">{{ cell.date() }}</span>
            <i
              v-if="cell && scheduleMap[cell.format('YYYY-MM-DD')]?.is_venue"
              class="bx bxs-truck cal-cell__venue-icon"
            ></i>
            <span
              v-else-if="cell && scheduleMap[cell.format('YYYY-MM-DD')]"
              class="cal-cell__dot"
            ></span>
          </div>
        </div>
      </div>

      <!-- 圖例 -->
      <div class="legend">
        <span class="legend__item">
          <span class="legend__dot legend__dot--open"></span>接單中
        </span>
        <span class="legend__item">
          <span class="legend__dot legend__dot--announced"></span>即將開放
        </span>
        <span class="legend__item">
          <span class="legend__dot legend__dot--venue"></span>巡迴場
        </span>
      </div>

      <!-- 行程列表 -->
      <div class="section-title">本月行程</div>

      <!-- 載入中骨架 -->
      <template v-if="isLoading">
        <div v-for="n in 2" :key="n" class="schedule-card">
          <el-skeleton animated>
            <template #template>
              <div style="display: flex; gap: 14px; align-items: flex-start">
                <el-skeleton-item
                  variant="rect"
                  style="
                    width: 48px;
                    height: 52px;
                    border-radius: 8px;
                    flex-shrink: 0;
                  "
                />
                <div
                  style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                  "
                >
                  <el-skeleton-item variant="text" style="width: 60%" />
                  <el-skeleton-item variant="text" style="width: 40%" />
                </div>
              </div>
              <el-skeleton-item
                variant="rect"
                style="
                  width: 100%;
                  height: 36px;
                  border-radius: 8px;
                  margin-top: 4px;
                "
              />
            </template>
          </el-skeleton>
        </div>
      </template>

      <!-- 無資料 -->
      <div v-else-if="monthSchedules.length === 0" class="empty">
        <i class="bx bx-calendar-x"></i>
        <p>本月尚無開放行程</p>
      </div>

      <!-- 行程卡片 -->
      <template v-else>
        <div
          v-for="s in monthSchedules"
          :key="s.id"
          class="schedule-card"
          :class="{
            'schedule-card--announced': s.status === 'ANNOUNCED',
            'schedule-card--past': isPastSchedule(s),
          }"
        >
          <!-- 已過去：可收合的標題列 -->
          <div
            v-if="isPastSchedule(s)"
            class="schedule-card__collapsed"
            @click="toggleExpand(s.id)"
          >
            <div class="schedule-card__collapsed-left">
              <span class="schedule-card__collapsed-date">
                {{ dayjs(s.schedule_date).format("M/D") }}
                （週{{
                  ["日", "一", "二", "三", "四", "五", "六"][
                    dayjs(s.schedule_date).day()
                  ]
                }}）
              </span>
              <span
                v-if="s.is_venue"
                class="badge badge--venue badge--venue-sm"
              >
                <i class="bx bxs-truck"></i>
              </span>
              <span class="badge badge--closed">已結單</span>
            </div>
            <i
              class="bx schedule-card__collapsed-chevron"
              :class="
                expandedIds.has(s.id) ? 'bx-chevron-up' : 'bx-chevron-down'
              "
            ></i>
          </div>

          <!-- 未過去：完整標題 -->
          <div v-else class="schedule-card__head">
            <div class="schedule-card__date-row">
              <span class="schedule-card__month">{{
                dayjs(s.schedule_date).format("M 月")
              }}</span>
              <span class="schedule-card__day">{{
                dayjs(s.schedule_date).date()
              }}</span>

              <span class="schedule-card__weekday">
                週{{
                  ["日", "一", "二", "三", "四", "五", "六"][
                    dayjs(s.schedule_date).day()
                  ]
                }}
              </span>
              <span v-if="s.is_venue" class="badge badge--venue">
                <i class="bx bxs-truck"></i> 巡迴場
              </span>
              <span class="badge" :class="getBadge(s).class">
                {{ getBadge(s).label }}
              </span>
            </div>
            <div v-if="s.note" class="schedule-card__note">
              <i class="bx bx-info-circle"></i> {{ s.note }}
            </div>
          </div>

          <!-- 巡迴場地資訊 -->
          <a
            v-if="s.is_venue && !isPastSchedule(s)"
            class="venue-info"
            :href="`https://maps.google.com/?q=${encodeURIComponent(s.venue_address || s.venue_name)}`"
            target="_blank"
            rel="noopener"
          >
            <img
              src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32"
              class="venue-info__icon"
              alt="Google Maps"
            />
            <div class="venue-info__body">
              <span class="venue-info__name">
                {{ s.venue_name
                }}<template v-if="s.venue_start && s.venue_end"
                  >・{{ s.venue_start }}–{{ s.venue_end }}</template
                >
              </span>
              <span v-if="s.venue_address" class="venue-info__address">{{
                s.venue_address
              }}</span>
            </div>
            <i class="bx bx-chevron-right venue-info__arrow"></i>
          </a>

          <!-- 展開內容（已過去時需手動展開；未過去時永遠顯示） -->
          <template v-if="!isPastSchedule(s) || expandedIds.has(s.id)">
            <!-- 流程步驟 -->
            <div class="flow-steps">
              <template v-for="(step, i) in getFlowSteps(s)" :key="step.label">
                <div
                  class="flow-step"
                  :class="{
                    'flow-step--active': getFlowStepIndex(s) === i,
                    'flow-step--done': getFlowStepIndex(s) > i,
                  }"
                >
                  <span class="flow-dot"></span>
                  <span class="flow-label">{{ step.label }}</span>
                  <span v-if="step.time" class="flow-time">{{
                    step.time
                  }}</span>
                </div>
                <div
                  v-if="i < getFlowSteps(s).length - 1"
                  class="flow-line"
                  :class="{ 'flow-line--active': getFlowStepIndex(s) > i }"
                ></div>
              </template>
            </div>

            <!-- 品項列表 -->
            <div v-if="s.items?.length" class="schedule-card__items">
              <div v-for="item in s.items" :key="item.id" class="item-chip">
                <div class="item-chip__main">
                  <span class="item-chip__name">{{ item.product_name }}</span>
                  <span class="item-chip__price">${{ item.unit_price }}</span>
                </div>
                <span
                  v-if="item.sales_limit > 0 && !isPastSchedule(s)"
                  class="item-chip__stock"
                  :class="{ 'item-chip__stock--low': item.remaining <= 5 }"
                >
                  {{ item.remaining ? `可訂 ${item.remaining} ` : "售完" }}
                </span>
              </div>
            </div>
            <div v-else class="schedule-card__items-empty">品項即將公告</div>

            <el-button
              v-if="s.status === 'OPEN'"
              type="primary"
              class="schedule-card__btn"
              @click="goOrder(s)"
            >
              我要訂購
            </el-button>
            <button
              v-if="s.status === 'ANNOUNCED' && s.order_start_at"
              class="cal-btn cal-btn--full"
              @click.stop="addToCalendar(s)"
            >
              <i class="bx bx-calendar-plus"></i> 加入行事曆
            </button>
          </template>
        </div>
      </template>
    </div>

    <div class="page-footer">
      由 <a href="/" target="_blank" rel="noopener">Prelo</a> 提供服務
    </div>
  </div>
</template>

<style lang="scss" scoped>
.schedules-page {
  height: 100dvh;
  overflow-y: auto;
  background: #fffdf9;
  padding-bottom: 40px;
}

.page-footer {
  text-align: center;
  padding: 24px 16px 32px;
  font-size: 12px;
  color: #888;

  a {
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* 月曆載入中淡化 */
.calendar--loading {
  opacity: 0.45;
  pointer-events: none;
  transition: opacity 0.2s;
}

/* Content */
.content {
  max-width: 520px;
  margin: 0 auto;
  padding: 8px 16px 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 月份切換 */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 8px;
  padding: 6px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &__btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #fffdf9;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 20px;
    color: #5c4b3e;

    &:active {
      background: #ede5dc;
    }
  }

  &__label {
    font-size: 16px;
    font-weight: 700;
    color: #1a120b;
  }
}

/* 月曆 */
.calendar {
  background: #fff;
  border-radius: 8px;
  padding: 12px 12px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &__week-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    margin-bottom: 6px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e8ddd5;

    span {
      font-size: 11px;
      font-weight: 700;
      color: #5c4b3e;
      letter-spacing: 0.03em;

      &:first-child {
        color: #b05840;
      } /* 日 */
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
    overflow: hidden;
  }
}

.cal-cell {
  aspect-ratio: 1.3;
  min-width: 0;
  min-height: 0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: default;
  transition: background 0.15s;

  &--empty {
    pointer-events: none;
  }

  &__day {
    font-size: 13px;
    font-weight: 600;
    color: #1a120b;
    line-height: 1;
  }

  &__dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
  }

  &__venue-icon {
    font-size: 15px;
    color: var(--color-primary);
    line-height: 1;
  }

  /* 有行程但不是今天 */
  &--open {
    background: #edfaf3;
    .cal-cell__day {
      color: #1e7a48;
    }
    .cal-cell__dot {
      background: #2eaa62;
    }
  }

  &--announced {
    background: var(--color-announced-bg);
    .cal-cell__day {
      color: var(--color-announced-text);
    }
    .cal-cell__dot {
      background: var(--color-announced-accent);
    }
  }

  /* 今天：主題色圓圈，覆蓋其他背景 */
  &--today {
    .cal-cell__day {
      width: 28px;
      height: 28px;
      background: var(--color-accent);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
      // box-shadow: 0 2px 6px rgba(var(--color-primary-rgb), 0.45);
    }
  }

  /* 今天同時有行程：保留底色 + 黃圈 */
  &--venue {
    background: var(--color-venue-bg);
    .cal-cell__dot {
      background: var(--color-primary);
    }
  }

  &--today.cal-cell--open {
    background: #edfaf3;
    .cal-cell__dot {
      background: #2eaa62;
    }
  }

  &--today.cal-cell--announced {
    background: var(--color-announced-bg);
    .cal-cell__dot {
      background: var(--color-announced-accent);
    }
  }

  &--today.cal-cell--venue {
    background: var(--color-venue-bg);
    .cal-cell__dot {
      background: var(--color-primary);
    }
  }
}

/* 圖例 */
.legend {
  display: flex;
  gap: 16px;
  justify-content: center;

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #5c4b3e;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &--open {
      background: #2eaa62;
    }
    &--announced {
      background: var(--color-announced-accent);
    }
    &--venue {
      background: var(--color-primary);
    }
  }
}

/* Section title */
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #5c4b3e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 4px;
}

/* Empty */
.empty {
  text-align: center;
  padding: 40px 0;
  color: #8a7060;

  i {
    font-size: 40px;
    display: block;
    margin-bottom: 8px;
  }
  p {
    font-size: 14px;
    margin: 0;
  }
}

/* 行程卡片 */
.schedule-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;

  &--announced {
    opacity: 0.85;
  }

  &--past {
    padding: 10px 16px;
    background: #f5f2ef;
    box-shadow: none;
    border: 1px solid #e8ddd5;
  }

  &__collapsed {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
    padding: 2px 0;
    &:active {
      opacity: 0.6;
    }
  }

  &__collapsed-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__collapsed-date {
    font-size: 14px;
    font-weight: 600;
    color: #5c4b3e;
  }

  &__collapsed-chevron {
    font-size: 18px;
    color: #8a7060;
  }

  &__head {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__date-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__day {
    font-size: 22px;
    font-weight: 800;
    color: #1a120b;
    line-height: 1;
  }

  &__month {
    font-size: 14px;
    color: #5c4b3e;
    font-weight: 600;
  }

  &__weekday {
    font-size: 14px;
    font-weight: 700;
    color: #1a120b;
  }

  &__deadline {
    font-size: 12px;
    color: #5c4b3e;
  }

  &__note {
    font-size: 12px;
    color: #5c4b3e;
    display: flex;
    align-items: center;
    gap: 4px;

    i {
      font-size: 13px;
      color: var(--color-primary);
    }
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__items-empty {
    font-size: 12px;
    color: #8a7060;
  }

  &__btn {
    width: 100%;
    height: 44px;
    font-size: 15px;
    font-weight: 700;
  }
}

.cal-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1.5px solid #c8d8e8;
  background: #f0f6fb;
  color: #4a7fa5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;

  i {
    font-size: 14px;
  }

  &--full {
    width: 100%;
    justify-content: center;
    height: 44px;
    font-size: 15px;
    border-radius: 8px;
    margin-top: 0;
    padding: 0;
  }

  &:hover {
    background: #ddeef8;
  }
  &:active {
    background: #cce4f4;
  }
}

/* Badge */
.badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;

  &--open {
    background: #e0f7ec;
    color: #1e7a48;
  }

  &--announced {
    background: var(--color-announced-bg);
    color: var(--color-announced-text);
  }

  &--closed {
    background: #e8ddd5;
    color: #5c4b3e;
  }

  &--venue {
    background: var(--color-venue-bg);
    color: var(--color-venue-text);
    display: inline-flex;
    align-items: center;
    gap: 3px;

    i {
      font-size: 13px;
    }
  }

  &--venue-sm {
    padding: 2px 6px;
    font-size: 11px;
  }
}

/* 流程步驟 */
.flow-steps {
  display: flex;
  align-items: flex-start;
  padding: 2px 4px;
}

.flow-step {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.flow-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0d5cc;
  flex-shrink: 0;
}

.flow-label {
  font-size: 12px;
  color: #c0a898;
  white-space: nowrap;
}

.flow-time {
  font-size: 12px;
  color: #b0a090;
  white-space: nowrap;
}

.flow-line {
  flex: 1;
  height: 2px;
  background: #e0d5cc;
  align-self: flex-start;
  margin-top: 3px;

  &--active {
    background: #2eaa62;
  }
}

.flow-step--active {
  .flow-dot {
    background: var(--color-accent);
  }
  .flow-label {
    color: var(--color-accent);
    font-weight: 700;
  }
}

.flow-step--done {
  .flow-dot {
    background: #2eaa62;
  }
  .flow-label {
    color: #2eaa62;
  }
}

/* 巡迴場地資訊 */
.venue-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--color-venue-bg);
  border-radius: 8px;
  border: 1px solid var(--color-venue-border);
  padding: 8px 10px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;

  &:active {
    background: var(--color-venue-selected);
  }

  &__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 3px;
    margin-top: 2px;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: #6b4000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__address {
    font-size: 12px;
    color: #8a5c10;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__arrow {
    font-size: 16px;
    color: #c0a060;
    flex-shrink: 0;
  }
}

/* 品項 chip */
.item-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: #fffdf9;
  border: 1px solid #ede0d0;
  border-radius: 6px;
  padding: 8px 12px;
  width: 100%;

  &__main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: #1a120b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__price {
    font-size: 14px;
    color: #5c4b3e;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__stock {
    font-size: 11px;
    font-weight: 700;
    color: #5c4b3e;
    white-space: nowrap;
    flex-shrink: 0;

    &--low {
      color: #d06020;
    }
  }
}
</style>
