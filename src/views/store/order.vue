<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import dayjs from "dayjs";
import { Shop } from "@/api/shop";
import { ElMessage } from "element-plus";
import StoreTopbar from "@/components/store/StoreTopbar.vue";

const router = useRouter();
const route = useRoute();

const slug = route.params.slug;
const date = route.params.date;

const paymentLabel = {
  cash: "現金",
  linepay: "Line Pay",
  bank: "銀行轉帳",
  card: "信用卡",
};
const pickupMethodLabel = { PICKUP: "自取", DELIVERY: "宅配" };

const isLoading = ref(true);
const isSubmitting = ref(false);
const shop = ref(null);
const schedule = ref(null);
const notFound = ref(false);
const successOrder = ref(null); // 下單成功後存訂單資訊

const cart = reactive({}); // schedule_item_id → { quantity, is_sliced }

const form = reactive({
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  pickup_time: "",
  payment_method: "",
  pickup_method: "PICKUP",
  bring_own_bag: false,
  note: "",
});

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [shopRes, scheduleRes] = await Promise.all([
      Shop.GetInfo(slug),
      Shop.GetScheduleByDate(slug, date),
    ]);
    shop.value = shopRes.data;
    schedule.value = scheduleRes.data;
    console.log("schedule:", schedule.value);
    if (shop.value?.paymentMethods?.length) {
      form.payment_method = shop.value.paymentMethods[0];
    }
    if (shop.value?.pickupMethods?.length) {
      form.pickup_method = shop.value.pickupMethods[0].toUpperCase();
    }

    schedule.value?.items?.forEach((item) => {
      cart[item.id] = { quantity: 0, is_sliced: false };
    });
  } catch (err) {
    if (err?.response?.status === 404) notFound.value = true;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchData);

const cartItems = computed(() =>
  (schedule.value?.items ?? [])
    .filter((item) => (cart[item.id]?.quantity ?? 0) > 0)
    .map((item) => ({
      schedule_item_id: item.id,
      quantity: cart[item.id].quantity,
      is_sliced: cart[item.id].is_sliced,
      unit_price: item.unit_price,
      slice_price: item.slice_price,
      name: item.product_name,
    })),
);

const totalAmount = computed(() =>
  cartItems.value.reduce((sum, i) => {
    const price = i.is_sliced && i.slice_price ? i.slice_price : i.unit_price;
    return sum + price * i.quantity;
  }, 0),
);

const isDelivery = computed(() => form.pickup_method === "DELIVERY");

const hasMultiPickup = computed(
  () => (shop.value?.pickupMethods?.length ?? 0) > 1,
);

const increment = (itemId, remaining, salesLimit) => {
  if (salesLimit != null && remaining != null && remaining <= 0) return;
  const cur = cart[itemId]?.quantity ?? 0;
  if (remaining > 0 && cur >= remaining) return;
  cart[itemId].quantity = cur + 1;
};

const decrement = (itemId) => {
  const cur = cart[itemId]?.quantity ?? 0;
  if (cur > 0) cart[itemId].quantity = cur - 1;
};

const pickupTimeOptions = computed(() => {
  let startStr, endStr;

  if (schedule.value?.is_venue && schedule.value.venue_start && schedule.value.venue_end) {
    startStr = schedule.value.venue_start;
    endStr = schedule.value.venue_end;
  } else {
    const dow = dayjs(date).day();
    const hours = shop.value?.businessHours?.find((h) => h.day === dow && h.enabled);
    if (!hours) return [];
    [startStr, endStr] = hours.time;
  }

  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const slots = [];
  for (let t = startTotal; t <= endTotal; t += 30) {
    const h = String(Math.floor(t / 60)).padStart(2, "0");
    const m = String(t % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
});

const submitOrder = async () => {
  if (cartItems.value.length === 0) {
    ElMessage.warning("請至少選擇一項商品");
    return;
  }
  if (!form.customer_name.trim()) {
    ElMessage.warning("請填寫姓名");
    return;
  }
  if (!form.customer_phone.trim()) {
    ElMessage.warning("請填寫電話");
    return;
  }
  if (!form.pickup_time) {
    ElMessage.warning("請選擇取貨時間");
    return;
  }
  if (!form.payment_method) {
    ElMessage.warning("請選擇付款方式");
    return;
  }
  if (isDelivery.value && !form.customer_address.trim()) {
    ElMessage.warning("宅配需填寫地址");
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await Shop.CreateOrder(slug, {
      schedule_id: schedule.value.id,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      pickup_time: form.pickup_time,
      payment_method: form.payment_method,
      pickup_method: form.pickup_method,
      bring_own_bag: form.bring_own_bag,
      note: form.note.trim() || null,
      customer_address: isDelivery.value ? form.customer_address.trim() : null,
      items: cartItems.value.map((i) => ({
        schedule_item_id: i.schedule_item_id,
        quantity: i.quantity,
        is_sliced: i.is_sliced,
      })),
    });
    successOrder.value = res.data;
  } catch (err) {
    if (err?.response?.status === 409) {
      ElMessage.error("部分商品已售完，請重新確認數量");
      fetchData();
    } else {
      ElMessage.error("下單失敗，請稍後再試");
    }
  } finally {
    isSubmitting.value = false;
  }
};

const dateLabel = computed(() => {
  if (!date) return "";
  const d = dayjs(date);
  return d.format(
    `M月D日（週${["日", "一", "二", "三", "四", "五", "六"][d.day()]}）`,
  );
});

const fmt = (n) => `NT$ ${Number(n).toLocaleString()}`;
</script>

<template>
  <div class="order-page">
    <StoreTopbar :title="dateLabel" :subtitle="shop?.shopName ?? ''" />

    <!-- 載入中 -->
    <div v-if="isLoading" class="state-loading">
      <el-skeleton animated>
        <template #template>
          <div class="skeleton-wrap">
            <el-skeleton-item
              variant="rect"
              style="width: 100%; height: 120px; border-radius: 8px"
            />
            <el-skeleton-item
              variant="rect"
              style="width: 100%; height: 200px; border-radius: 8px"
            />
            <el-skeleton-item
              variant="rect"
              style="width: 100%; height: 160px; border-radius: 8px"
            />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 找不到 -->
    <div v-else-if="notFound" class="state-empty">
      <i class="bx bx-calendar-x"></i>
      <p>找不到此行程</p>
    </div>

    <!-- 下單成功 -->
    <div v-else-if="successOrder" class="success-screen">
      <div class="success-icon"><i class="bx bx-check-circle"></i></div>
      <h2>下單成功！</h2>
      <p class="success-sub">訂單編號已發送，請保存以下資訊</p>
      <div class="success-card">
        <div class="success-row">
          <span class="success-label">訂單編號</span>
          <span class="success-val order-no-suffix">{{ successOrder.order_no }}</span>
        </div>
        <div class="success-row">
          <span class="success-label">取貨日期</span>
          <span class="success-val">{{ dateLabel }}</span>
        </div>
        <div class="success-row">
          <span class="success-label">取貨時間</span>
          <span class="success-val">{{
            successOrder.pickup_time ?? form.pickup_time
          }}</span>
        </div>
        <div class="success-row">
          <span class="success-label">訂單金額</span>
          <span class="success-val success-val--price">{{
            fmt(successOrder.total_amount ?? totalAmount)
          }}</span>
        </div>
      </div>

      <!-- 訂購品項 -->
      <div v-if="successOrder.items?.length" class="success-items">
        <div class="success-items__title">訂購品項</div>
        <div
          v-for="item in successOrder.items"
          :key="item.product_name"
          class="success-item-row"
        >
          <div class="success-item-name">
            {{ item.product_name }}
            <span v-if="item.is_sliced" class="slice-tag">切片</span>
          </div>
          <div class="success-item-right">
            <span class="success-item-qty">x{{ item.quantity }}</span>
            <span class="success-item-price">{{
              fmt(item.line_total ?? item.unit_price * item.quantity)
            }}</span>
          </div>
        </div>
      </div>

      <!-- 巡迴場地提醒 -->
      <a
        v-if="schedule?.is_venue"
        class="venue-banner venue-banner--success"
        :href="`https://maps.google.com/?q=${encodeURIComponent(schedule.venue_address || schedule.venue_name)}`"
        target="_blank"
        rel="noopener"
      >
        <div class="venue-banner__icon-wrap">
          <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32" alt="Google Maps" />
        </div>
        <div class="venue-banner__body">
          <span class="venue-banner__name">
            {{ schedule.venue_name }}
            <span v-if="schedule.venue_start && schedule.venue_end" class="venue-banner__time">{{ schedule.venue_start }}–{{ schedule.venue_end }}</span>
          </span>
          <span v-if="schedule.venue_address" class="venue-banner__address">{{ schedule.venue_address }}</span>
        </div>
        <i class="bx bx-chevron-right venue-banner__arrow"></i>
      </a>

      <p class="success-hint">{{ schedule?.is_venue ? "請前往指定地點，憑訂單編號取貨" : "請憑訂單編號到店取貨，或來電確認" }}</p>
      <button
        class="cta-btn"
        @click="router.push({ name: 'store-schedules', params: { slug } })"
      >
        回到行程頁
      </button>
    </div>

    <!-- 正常下單畫面 -->
    <template v-else-if="schedule">
      <div class="order-body">
        <!-- 巡迴場提醒 -->
        <a
          v-if="schedule.is_venue"
          class="venue-banner"
          :href="`https://maps.google.com/?q=${encodeURIComponent(schedule.venue_address || schedule.venue_name)}`"
          target="_blank"
          rel="noopener"
        >
          <div class="venue-banner__icon-wrap">
            <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32" alt="Google Maps" />
          </div>
          <div class="venue-banner__body">
            <span class="venue-banner__name">
              {{ schedule.venue_name }}
              <span v-if="schedule.venue_start && schedule.venue_end" class="venue-banner__time">{{ schedule.venue_start }}–{{ schedule.venue_end }}</span>
            </span>
            <span v-if="schedule.venue_address" class="venue-banner__address">{{ schedule.venue_address }}</span>
          </div>
          <i class="bx bx-chevron-right venue-banner__arrow"></i>
        </a>

        <!-- 商品選擇 -->
        <section class="card">
          <div class="card__title"><i class="bx bx-basket"></i> 選擇商品</div>
          <div v-if="!schedule.items?.length" class="empty-hint">
            此行程尚無品項
          </div>
          <div v-else class="item-list">
            <div v-for="item in schedule.items" :key="item.id" class="item-row"
              :class="{ 'item-row--sold': item.sales_limit != null && item.remaining != null && item.remaining <= 0 }">
              <div class="item-img">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.product_name"
                />
                <i v-else class="bx bx-baguette"></i>
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.product_name }}</div>
                <div class="item-price">
                  {{ fmt(item.unit_price) }}
                  <span v-if="item.is_sliceable && item.slice_price" class="item-slice-price">
                    切片 {{ fmt(item.slice_price) }}
                  </span>
                </div>
                <div v-if="item.sales_limit != null && item.remaining != null && item.remaining <= 0" class="item-remaining item-remaining--sold">
                  售完
                </div>
                <div v-else-if="item.remaining > 0" class="item-remaining">
                  剩餘 {{ item.remaining }} 份
                </div>
                <!-- 切片選項，只在已選數量 > 0 時顯示 -->
                <label
                  v-if="(cart[item.id]?.quantity ?? 0) > 0 && item.is_sliceable"
                  class="slice-toggle"
                >
                  <input type="checkbox" v-model="cart[item.id].is_sliced" />
                  <span class="slice-check"></span>
                  <span class="slice-label">需要切片</span>
                </label>
              </div>
              <div class="item-qty">
                <button
                  class="qty-btn"
                  :disabled="(cart[item.id]?.quantity ?? 0) === 0"
                  @click="decrement(item.id)"
                >
                  <i class="bx bx-minus"></i>
                </button>
                <span class="qty-num">{{ cart[item.id]?.quantity ?? 0 }}</span>
                <button
                  class="qty-btn qty-btn--add"
                  :disabled="
                    (item.sales_limit != null && item.remaining != null && item.remaining <= 0) ||
                    (item.remaining > 0 && (cart[item.id]?.quantity ?? 0) >= item.remaining)
                  "
                  @click="increment(item.id, item.remaining, item.sales_limit)"
                >
                  <i class="bx bx-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 取貨資訊 -->
        <section class="card">
          <div class="card__title"><i class="bx bx-package"></i> 取貨資訊</div>

          <!-- 取貨方式（多種才顯示） -->
          <div v-if="hasMultiPickup" class="form-row">
            <label class="form-label">取貨方式</label>
            <div class="toggle-group">
              <button
                v-for="m in shop.pickupMethods"
                :key="m"
                class="toggle-btn"
                :class="{
                  'toggle-btn--active': form.pickup_method === m.toUpperCase(),
                }"
                @click="form.pickup_method = m.toUpperCase()"
              >
                {{ pickupMethodLabel[m.toUpperCase()] ?? m }}
              </button>
            </div>
          </div>

          <!-- 取貨時間 -->
          <div class="form-row">
            <label class="form-label">取貨時間</label>
            <select
              v-model="form.pickup_time"
              class="form-select"
              :disabled="pickupTimeOptions.length === 0"
            >
              <option value="" disabled>
                {{ pickupTimeOptions.length ? "請選擇時間" : "當日無營業時間" }}
              </option>
              <option v-for="t in pickupTimeOptions" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>

          <!-- 付款方式 -->
          <div class="form-row">
            <label class="form-label">付款方式</label>
            <div class="toggle-group">
              <button
                v-for="m in shop.paymentMethods"
                :key="m"
                class="toggle-btn"
                :class="{ 'toggle-btn--active': form.payment_method === m }"
                @click="form.payment_method = m"
              >
                {{ paymentLabel[m] ?? m }}
              </button>
            </div>
          </div>

          <!-- 自備袋子 -->
          <div class="form-row form-row--inline">
            <label class="form-label">自備袋子</label>
            <label class="switch">
              <input type="checkbox" v-model="form.bring_own_bag" />
              <span class="switch-track"></span>
            </label>
          </div>
        </section>

        <!-- 聯絡資訊 -->
        <section class="card">
          <div class="card__title"><i class="bx bx-user"></i> 聯絡資訊</div>

          <div class="form-row">
            <label class="form-label"
              >姓名 <span class="required">*</span></label
            >
            <input
              v-model="form.customer_name"
              class="form-input"
              placeholder="請輸入姓名"
            />
          </div>
          <div class="form-row">
            <label class="form-label"
              >電話 <span class="required">*</span></label
            >
            <input
              v-model="form.customer_phone"
              class="form-input"
              type="tel"
              placeholder="請輸入手機號碼"
            />
          </div>
          <div v-if="isDelivery" class="form-row">
            <label class="form-label"
              >地址 <span class="required">*</span></label
            >
            <input
              v-model="form.customer_address"
              class="form-input"
              placeholder="請輸入收貨地址"
            />
          </div>
          <div class="form-row">
            <label class="form-label">備註</label>
            <textarea
              v-model="form.note"
              class="form-textarea"
              placeholder="特殊需求或備註（選填）"
              rows="2"
            />
          </div>
        </section>

        <!-- 底部佔位 -->
        <div style="height: 90px" />
      </div>

      <!-- 固定底部欄 -->
      <div class="order-footer">
        <div class="footer-total">
          <span class="footer-total__label">小計</span>
          <span class="footer-total__amount">{{ fmt(totalAmount) }}</span>
        </div>
        <button
          class="cta-btn"
          :disabled="isSubmitting || cartItems.length === 0"
          @click="submitOrder"
        >
          <span v-if="isSubmitting">送出中...</span>
          <span v-else>確認下單</span>
          <i v-if="!isSubmitting" class="bx bx-right-arrow-alt"></i>
        </button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
// SVG data URI 無法使用 CSS var()，以 SCSS 變數替代（值需與 _variables.scss 同步）
$_primary-hex: 'fe904d';
$_primary-hex: 'c8944a';

.order-page {
  height: 100dvh;
  overflow-y: auto;
  background: #fffdf9;
  display: flex;
  flex-direction: column;
}


/* States */
.state-loading {
  padding: 16px;

  .skeleton-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 520px;
    margin: 0 auto;
  }
}

.state-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0b0a0;
  padding: 48px 20px;
  text-align: center;

  i {
    font-size: 52px;
    margin-bottom: 12px;
    display: block;
  }
  p {
    font-size: 16px;
    font-weight: 700;
    color: #8a7060;
    margin: 0;
  }
}

/* Success */
.success-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px 40px;
  text-align: center;
  max-width: 440px;
  margin: 0 auto;
  width: 100%;
}

.success-icon {
  font-size: 64px;
  color: #2eaa62;
  line-height: 1;
  margin-bottom: 16px;
}

.success-screen h2 {
  font-size: 24px;
  font-weight: 800;
  color: #1a120b;
  margin: 0 0 6px;
}

.success-sub {
  font-size: 14px;
  color: #8a7060;
  margin: 0 0 24px;
}

.success-card {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.success-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e8ddd5;

  &:last-child {
    border-bottom: none;
  }
}

.success-label {
  font-size: 13px;
  color: #8a7060;
}

.success-val {
  font-size: 14px;
  font-weight: 700;
  color: #1a120b;

  &--price {
    color: var(--color-primary);
    font-size: 16px;
  }
}

.order-no-suffix {
  color: var(--color-primary);
  font-weight: 800;
}

.success-items {
  width: 100%;
  background: #fffdf9;
  border: 1px solid #e8ddd5;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;

  &__title {
    font-size: 12px;
    font-weight: 700;
    color: #8a7060;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
  }
}

.success-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #e8ddd5;

  &:last-child {
    border-bottom: none;
  }
}

.success-item-name {
  font-size: 14px;
  color: #1a120b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.success-item-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.success-item-qty {
  font-size: 13px;
  color: #a09080;
}

.success-item-price {
  font-size: 14px;
  font-weight: 700;
  color: #1a120b;
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

.success-hint {
  font-size: 12px;
  color: #a09080;
  margin: 0 0 28px;
}

/* Body */
.order-body {
  flex: 1;
  padding: 12px 16px;
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Card */
.card {
  background: #fff;
  border-radius: 8px;
  padding: 18px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: #8a7060;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;

    i {
      font-size: 15px;
    }
  }
}

.empty-hint {
  font-size: 13px;
  color: #bbb;
}

/* Item list */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e8ddd5;

  &:last-child {
    border-bottom: none;
  }
}

.item-img {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: #f5ede3;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d4b896;
  font-size: 24px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a120b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-price {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.item-slice-price {
  font-size: 11px;
  font-weight: 500;
  color: #a09080;
}

.item-remaining {
  font-size: 11px;
  color: #b09080;
  margin-top: 2px;

  &--sold {
    color: #8c8c8c;
    font-weight: 700;
  }
}

.item-row--sold {
  opacity: 0.5;
}

.slice-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  cursor: pointer;

  input {
    display: none;
  }

  &:active {
    opacity: 0.7;
  }
}

.slice-check {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid #d4b896;
  background: #fffdf9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;

  .slice-toggle input:checked + & {
    background: var(--color-primary);
    border-color: var(--color-primary);

    &::after {
      content: "";
      width: 9px;
      height: 5px;
      border-left: 2px solid #fff;
      border-bottom: 2px solid #fff;
      transform: rotate(-45deg) translate(1px, -1px);
      display: block;
    }
  }
}

.slice-label {
  font-size: 12px;
  font-weight: 600;
  color: #8a7060;
}

.item-qty {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.qty-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1.5px solid #e8ddd5;
  background: #fffdf9;
  color: #5c4b3e;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
  &:not(:disabled):active {
    background: #f0e8de;
  }

  &--add {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;

    &:not(:disabled):active {
      background: var(--color-primary-hover);
    }
  }
}

.qty-num {
  font-size: 16px;
  font-weight: 800;
  color: #1a120b;
  min-width: 20px;
  text-align: center;
}

/* Form */
.form-row {
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }

  &--inline {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #8a7060;
  margin-bottom: 7px;

  .required {
    color: #b04030;
  }
}

.form-row--inline .form-label {
  margin-bottom: 0;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e8ddd5;
  border-radius: 8px;
  background: #fffdf9;
  font-size: 14px;
  color: #1a120b;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
  font-family: inherit;

  &::placeholder {
    color: #c0b0a0;
  }
  &:focus {
    border-color: var(--color-primary);
  }
}

.form-textarea {
  resize: none;
  line-height: 1.6;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23#{$_primary-hex}' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
  cursor: pointer;
}

/* Toggle group */
.toggle-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toggle-btn {
  padding: 7px 18px;
  border-radius: 999px;
  border: 1.5px solid #e8ddd5;
  background: #fffdf9;
  color: #8a7060;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:active {
    opacity: 0.7;
  }

  &--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
  }
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;

  input {
    display: none;
  }

  &-track {
    display: block;
    width: 44px;
    height: 26px;
    border-radius: 999px;
    background: #e8ddd5;
    cursor: pointer;
    transition: background 0.2s;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s;
    }
  }

  input:checked + .switch-track {
    background: var(--color-primary);

    &::after {
      transform: translateX(18px);
    }
  }
}

/* Footer */
.order-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e8ddd5;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

.footer-total {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 90px;

  &__label {
    font-size: 11px;
    color: #a09080;
    font-weight: 600;
  }

  &__amount {
    font-size: 20px;
    font-weight: 800;
    color: #1a120b;
    line-height: 1.2;
  }
}

.cta-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 20px;
  border-radius: 999px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.35);

  i {
    font-size: 20px;
  }

  &:hover {
    background: var(--color-primary-hover);
  }
  &:active {
    background: var(--color-primary-dark);
    box-shadow: none;
  }

  &:disabled {
    background: rgba(var(--color-primary-rgb), 0.35);
    box-shadow: none;
    cursor: default;
  }
}

/* 巡迴場橫幅 */
.venue-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-venue-bg);
  border: 1.5px solid var(--color-venue-border);
  border-radius: 10px;
  padding: 12px 14px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;

  &:active { background: var(--color-venue-selected); }

  &--success {
    width: 100%;
    margin-bottom: 12px;
    text-align: left;
  }

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

    img {
      width: 20px;
      height: 20px;
    }
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
    color: var(--color-venue-text);
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__address {
    font-size: 12px;
    color: var(--color-venue-text);
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

/* Success page CTA */
.success-screen .cta-btn {
  width: 100%;
  flex: none;
}
</style>
