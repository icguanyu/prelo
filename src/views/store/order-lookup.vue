<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import StoreTopbar from "@/components/store/StoreTopbar.vue";
import dayjs from "dayjs";
import { Shop } from "@/api/shop";
import { ElMessage } from "element-plus";

const router = useRouter();
const route = useRoute();
const slug = route.params.slug;

const isLoading = ref(false);
const orders = ref(null); // null = 尚未查詢，[] = 查詢過但無結果
const expandedIds = ref(new Set()); // 過去訂單手動展開的 id 集合

const STORAGE_KEY = "prelo-lookup-phone";
const form = reactive({ phone: "", rememberMe: false });

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    form.phone = saved;
    form.rememberMe = true;
  }
});

const statusLabel = { PLACED: "已下單", COMPLETED: "已完成", CANCELLED: "已取消" };
const statusColor = { PLACED: "var(--color-primary)", COMPLETED: "#5a9672", CANCELLED: "#8C8C8C" };
const paymentLabel = { cash: "現金", linepay: "Line Pay", bank: "銀行轉帳", card: "信用卡" };
const pickupLabel = { pickup: "自取", delivery: "宅配" };

const lookup = async () => {
  if (!form.phone.trim()) { ElMessage.warning("請輸入電話"); return; }

  if (form.rememberMe) {
    localStorage.setItem(STORAGE_KEY, form.phone.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  isLoading.value = true;
  orders.value = null;
  expandedIds.value = new Set();
  try {
    const res = await Shop.GetOrdersByPhone(slug, form.phone.trim());
    console.log("查詢訂單", res);
    orders.value = res.data?.data ?? [];
  } catch {
    ElMessage.error("查詢失敗，請稍後再試");
  } finally {
    isLoading.value = false;
  }
};

const today = dayjs().startOf("day");
const isPast = (order) => order.schedule_date && dayjs(order.schedule_date).isBefore(today);
const isExpanded = (order) => !isPast(order) || expandedIds.value.has(order.id ?? order.order_no);
const toggleExpand = (order) => {
  const key = order.id ?? order.order_no;
  const s = new Set(expandedIds.value);
  s.has(key) ? s.delete(key) : s.add(key);
  expandedIds.value = s;
};

const fmt = (n) => `NT$ ${Number(n ?? 0).toLocaleString()}`;
const fmtDate = (d) => d ? dayjs(d).format("YYYY/MM/DD") : "—";
</script>

<template>
  <div class="lookup-page">

    <StoreTopbar title="查詢訂單" />

    <div class="lookup-body">

      <!-- 查詢表單 -->
      <section class="card">
        <div class="card__title"><i class="bx bx-search"></i> 輸入訂購電話</div>
        <div class="form-row">
          <label class="form-label">手機號碼</label>
          <input
            v-model="form.phone"
            class="form-input"
            type="tel"
            placeholder="訂購時填寫的手機號碼"
            @keyup.enter="lookup"
          />
        </div>
        <label class="remember-me">
          <input type="checkbox" v-model="form.rememberMe" />
          <span class="remember-me__check"></span>
          <span class="remember-me__label">記住我的電話號碼</span>
        </label>
        <button class="query-btn" :disabled="isLoading" @click="lookup">
          <span v-if="isLoading">查詢中...</span>
          <span v-else><i class="bx bx-search-alt"></i> 查詢</span>
        </button>
      </section>

      <!-- 無結果 -->
      <div v-if="orders !== null && orders.length === 0" class="empty-result">
        <i class="bx bx-receipt"></i>
        <p>此電話尚無訂單記錄</p>
      </div>

      <!-- 訂單列表 -->
      <template v-if="orders?.length">
        <section
          v-for="order in orders"
          :key="order.id ?? order.order_no"
          class="card card--result"
          :class="{ 'card--past': isPast(order) }"
        >
          <!-- 標題列（全部訂單都有，過去的點擊展開） -->
          <div
            class="order-header"
            :class="{ 'order-header--clickable': isPast(order) }"
            @click="isPast(order) && toggleExpand(order)"
          >
            <div class="order-header-left">
              <div class="order-no">{{ order.order_no }}</div>
              <span v-if="order.is_venue" class="venue-chip">
                <i class="bx bxs-truck"></i> 巡迴
              </span>
            </div>
            <div class="order-header-right">
              <span
                class="status-badge"
                :style="{ background: statusColor[order.status] + '20', color: statusColor[order.status] }"
              >
                {{ statusLabel[order.status] ?? order.status }}
              </span>
              <i
                v-if="isPast(order)"
                class="bx order-chevron"
                :class="isExpanded(order) ? 'bx-chevron-up' : 'bx-chevron-down'"
              ></i>
            </div>
          </div>

          <!-- 展開內容 -->
          <template v-if="isExpanded(order)">
            <div class="divider" />

            <!-- 巡迴場地 -->
            <a
              v-if="order.is_venue"
              class="venue-banner"
              :href="`https://maps.google.com/?q=${encodeURIComponent(order.venue_address || order.venue_name)}`"
              target="_blank"
              rel="noopener"
            >
              <div class="venue-banner__icon-wrap">
                <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32" alt="Google Maps" />
              </div>
              <div class="venue-banner__body">
                <span class="venue-banner__name">
                  {{ order.venue_name }}
                  <span v-if="order.venue_start && order.venue_end" class="venue-banner__time">{{ order.venue_start }}–{{ order.venue_end }}</span>
                </span>
                <span v-if="order.venue_address" class="venue-banner__address">{{ order.venue_address }}</span>
              </div>
              <i class="bx bx-chevron-right venue-banner__arrow"></i>
            </a>
            <div v-if="order.is_venue" class="divider" />

            <!-- 取貨資訊 -->
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">取貨日期</span>
                <span class="info-val">{{ fmtDate(order.schedule_date) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">取貨時間</span>
                <span class="info-val">{{ order.pickup_time ?? "—" }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">取貨方式</span>
                <span class="info-val">{{ pickupLabel[order.pickup_method] ?? order.pickup_method ?? "—" }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">付款方式</span>
                <span class="info-val">{{ paymentLabel[order.payment_method] ?? order.payment_method ?? "—" }}</span>
              </div>
              <div v-if="order.customer_address" class="info-item info-item--full">
                <span class="info-label">收貨地址</span>
                <span class="info-val">{{ order.customer_address }}</span>
              </div>
              <div v-if="order.note" class="info-item info-item--full">
                <span class="info-label">備註</span>
                <span class="info-val">{{ order.note }}</span>
              </div>
            </div>

            <div class="divider" />

            <!-- 品項清單 -->
            <div class="items-title">訂購品項</div>
            <div class="item-list">
              <div v-for="item in order.items" :key="item.id" class="item-row">
                <div class="item-name">
                  {{ item.product_name }}
                  <span v-if="item.is_sliced" class="slice-tag">切片</span>
                </div>
                <div class="item-right">
                  <span class="item-qty">x{{ item.quantity }}</span>
                  <span class="item-price">{{ fmt(item.unit_price * item.quantity) }}</span>
                </div>
              </div>
            </div>

            <div class="divider" />

            <div class="total-row">
              <span class="total-label">合計</span>
              <span class="total-amount">{{ fmt(order.total_amount) }}</span>
            </div>
          </template>
        </section>
      </template>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.lookup-page {
  height: 100dvh;
  overflow-y: auto;
  background: #f7f3ee;
  display: flex;
  flex-direction: column;
}


/* Body */
.lookup-body {
  flex: 1;
  padding: 16px;
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

/* Card */
.card {
  background: #fff;
  border-radius: 8px;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: #8a7060;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    i { font-size: 15px; }
  }

  &--past {
    background: #faf8f5;
    box-shadow: none;
    border: 1px solid #ede8e2;
  }
}

/* Form */
.form-row {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #8a7060;
  margin-bottom: 7px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e8ddd5;
  border-radius: 8px;
  background: #fdf8f2;
  font-size: 14px;
  color: #1a120b;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
  font-family: inherit;

  &::placeholder { color: #c0b0a0; }
  &:focus { border-color: var(--color-primary); }
}

.remember-me {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 14px;

  input { display: none; }

  &__check {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 1.5px solid #d4b896;
    background: #fdf8f2;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;

    .remember-me input:checked + & {
      background: var(--color-primary);
      border-color: var(--color-primary);

      &::after {
        content: "";
        width: 10px;
        height: 6px;
        border-left: 2px solid #fff;
        border-bottom: 2px solid #fff;
        transform: rotate(-45deg) translate(1px, -1px);
        display: block;
      }
    }
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #8a7060;
  }
}

.query-btn {
  width: 100%;
  padding: 13px;
  border-radius: 999px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 4px;

  i { font-size: 17px; }
  &:hover { background: var(--color-primary-hover); }
  &:active { background: #8a5e30; }
  &:disabled { background: #d4c5b0; cursor: default; }
}

/* Empty */
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  color: #c0b0a0;
  text-align: center;

  i { font-size: 40px; margin-bottom: 10px; display: block; }
  p { font-size: 14px; font-weight: 600; color: #a09080; margin: 0; }
}

/* Order header */
.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  &--clickable {
    cursor: pointer;
    user-select: none;
    &:active { opacity: 0.7; }
  }
}

.order-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.order-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.order-no {
  font-size: 14px;
  font-weight: 800;
  color: #1a120b;
  letter-spacing: 0.02em;
  white-space: nowrap;
}



.order-chevron {
  font-size: 18px;
  color: #a09080;
  transition: transform 0.2s;
}

.status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.divider {
  height: 1px;
  background: #f3ede8;
  margin: 14px 0;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;

  &--full { grid-column: 1 / -1; }
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  color: #a09080;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-val {
  font-size: 14px;
  font-weight: 600;
  color: #1a120b;
}

/* Items */
.items-title {
  font-size: 13px;
  font-weight: 700;
  color: #8a7060;
  margin-bottom: 10px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-name {
  font-size: 14px;
  color: #1a120b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.slice-tag {
  font-size: 11px;
  background: #fdf3e3;
  color: var(--color-primary);
  border: 1px solid #f0d8b0;
  border-radius: 4px;
  padding: 1px 6px;
  font-weight: 600;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.item-qty {
  font-size: 13px;
  color: #a09080;
}

.item-price {
  font-size: 14px;
  font-weight: 700;
  color: #1a120b;
}

/* Total */
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 14px;
  font-weight: 700;
  color: #5c4b3e;
}

.total-amount {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-primary);
}

/* 巡迴標記 */
.venue-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  background: #fef3c7;
  color: #7a4f00;
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;

  i { font-size: 12px; }
}

/* 巡迴場地橫幅 */
.venue-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fffbeb;
  border: 1.5px solid #f0d070;
  border-radius: 10px;
  padding: 12px 14px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;

  &:active { background: #fef3c7; }

  &__icon-wrap {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    background: #fff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);

    img { width: 20px; height: 20px; }
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: #6b4000;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__address {
    font-size: 12px;
    color: #8a5c10;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__time {
    font-size: 12px;
    font-weight: 500;
    color: #a07820;
  }

  &__arrow {
    font-size: 18px;
    color: #c0a060;
    flex-shrink: 0;
  }
}
</style>
