<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Loading } from "@element-plus/icons-vue";
import { Shop } from "@/api/shop";

const router = useRouter();
const route = useRoute();

const dayLabel = ["日", "一", "二", "三", "四", "五", "六"];

const paymentLabel = {
  cash: "現金",
  linepay: "Line Pay",
  bank: "銀行轉帳",
  card: "信用卡",
};

const pickupLabel = {
  pickup: "自取",
  delivery: "宅配",
};

const shop = ref(null);
const isLoading = ref(true);
const notFound = ref(false);

// 商品相關
const categories = ref([]);
const products = ref([]);
const activeCategoryId = ref(null);
const productsLoading = ref(false);

const fetchShop = async () => {
  try {
    const res = await Shop.GetInfo(route.params.slug);
    console.log("shop info", res.data);
    shop.value = res.data;
    document.title = res.data.shopName
      ? `${res.data.shopName} | Prelo`
      : "Prelo";
  } catch (err) {
    if (err?.response?.status === 404) {
      notFound.value = true;
    }
  } finally {
    isLoading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await Shop.GetCategories(route.params.slug);
    categories.value = res.data?.data ?? [];
    console.log("categories", categories.value);
  } catch {}
};

const fetchProducts = async () => {
  productsLoading.value = true;
  try {
    const params = activeCategoryId.value
      ? { category_id: activeCategoryId.value }
      : {};
    const res = await Shop.GetProducts(route.params.slug, params);
    products.value = res.data?.data ?? [];
  } catch {
    products.value = [];
  } finally {
    productsLoading.value = false;
  }
};

onMounted(async () => {
  await fetchShop();
  if (!notFound.value) {
    fetchCategories();
    fetchProducts();
  }
});

watch(activeCategoryId, fetchProducts);

const activeHours = computed(
  () => shop.value?.businessHours?.filter((h) => h.enabled) ?? [],
);

const hasDelivery = computed(
  () => shop.value?.pickupMethods?.includes("delivery") ?? false,
);
</script>

<template>
  <div class="store-page">
    <!-- 載入中 -->
    <div v-if="isLoading">
      <el-skeleton animated>
        <template #template>
          <div class="hero">
            <el-skeleton-item
              style="
                width: 100%;
                height: 180px;
                display: block;
                border-radius: 0;
              "
            />
            <div class="hero__identity">
              <el-skeleton-item
                variant="circle"
                style="width: 120px; height: 120px"
              />
              <el-skeleton-item
                variant="h1"
                style="width: 160px; margin-top: 12px"
              />
              <el-skeleton-item
                variant="text"
                style="width: 260px; margin-top: 6px"
              />
            </div>
          </div>
          <div class="body">
            <el-skeleton-item
              variant="rect"
              style="width: 100%; height: 80px; border-radius: 8px"
            />
            <el-skeleton-item
              variant="rect"
              style="width: 100%; height: 180px; border-radius: 8px"
            />
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 找不到店家 -->
    <div v-else-if="notFound" class="state-center state-notfound">
      <i class="bx bx-store-alt"></i>
      <p>找不到此店家</p>
      <small>請確認網址是否正確</small>
      <button class="home-btn" @click="router.push('/')">回首頁</button>
    </div>

    <!-- 正常內容 -->
    <template v-else-if="shop">
      <!-- Hero -->
      <div class="hero">
        <div class="hero__cover">
          <img
            v-if="shop.cover"
            :src="shop.cover"
            :alt="shop.shopName"
            class="hero__cover-img"
          />
        </div>
        <div class="hero__identity">
          <div class="hero__avatar">
            <img v-if="shop.avatar" :src="shop.avatar" :alt="shop.shopName" />
            <span v-else class="hero__avatar-fallback">
              {{ shop.shopName?.[0] ?? "🍞" }}
            </span>
          </div>
          <h1 class="hero__name">{{ shop.shopName }}</h1>
          <p v-if="shop.intro" class="hero__intro">{{ shop.intro }}</p>
        </div>
      </div>

      <!-- Body -->
      <div class="body">
        <!-- 聯絡資訊 -->
        <div class="card">
          <div class="card__title"><i class="bx bx-map-pin"></i> 店家資訊</div>
          <div v-if="shop.address" class="info-row">
            <span class="info-row__label">地址</span>
            <span class="info-row__address">
              {{ shop.address }}
              <a
                :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`"
                target="_blank"
                rel="noopener"
                class="map-link"
                title="在 Google Maps 開啟"
                ><i class="bx bx-map"></i
              ></a>
            </span>
          </div>
          <div v-if="shop.phone" class="info-row">
            <span class="info-row__label">電話</span>
            <span class="info-row__phone">
              {{ shop.phone }}
              <a :href="`tel:${shop.phone}`" class="call-btn" title="撥打電話">
                <i class="bx bx-phone-call"></i>
              </a>
            </span>
          </div>
          <div
            v-if="shop.lineUrl || shop.facebookUrl || shop.instagramUrl"
            class="info-row"
          >
            <span class="info-row__label">社群</span>
            <div class="social-links">
              <a
                v-if="shop.lineUrl"
                :href="shop.lineUrl"
                target="_blank"
                rel="noopener"
                class="social-link social-link--line"
                title="LINE"
                ><i class="bx bxl-line"></i
              ></a>
              <a
                v-if="shop.facebookUrl"
                :href="shop.facebookUrl"
                target="_blank"
                rel="noopener"
                class="social-link social-link--facebook"
                title="Facebook"
                ><i class="bx bxl-facebook"></i
              ></a>
              <a
                v-if="shop.instagramUrl"
                :href="shop.instagramUrl"
                target="_blank"
                rel="noopener"
                class="social-link social-link--instagram"
                title="Instagram"
                ><i class="bx bxl-instagram"></i
              ></a>
            </div>
          </div>
        </div>

        <!-- 營業時間 -->
        <div class="card">
          <div class="card__title"><i class="bx bx-time"></i> 營業時間</div>
          <div v-if="activeHours.length === 0" class="empty-hint">尚未設定</div>
          <div
            v-for="h in shop.businessHours"
            :key="h.day"
            class="hours-row"
            :class="{ 'hours-row--closed': !h.enabled }"
          >
            <span class="hours-row__day">週{{ dayLabel[h.day] }}</span>
            <span v-if="h.enabled" class="hours-row__time">
              {{ h.time[0] }} – {{ h.time[1] }}
            </span>
            <span v-else class="hours-row__closed">公休</span>
          </div>
        </div>

        <!-- 付款 & 取貨方式 -->
        <div
          v-if="shop.paymentMethods?.length || shop.pickupMethods?.length"
          class="card"
        >
          <div class="card__title">
            <i class="bx bx-credit-card"></i> 付款 & 取貨
          </div>
          <div class="method-group">
            <div v-if="shop.paymentMethods?.length" class="method-row">
              <span class="method-row__label">付款</span>
              <div class="tags">
                <span
                  v-for="m in shop.paymentMethods"
                  :key="m"
                  class="tag tag--payment"
                >
                  {{ paymentLabel[m] ?? m }}
                </span>
              </div>
            </div>
            <div v-if="shop.pickupMethods?.length" class="method-row">
              <span class="method-row__label">取貨</span>
              <div class="tags">
                <span
                  v-for="m in shop.pickupMethods"
                  :key="m"
                  class="tag tag--pickup"
                >
                  {{ pickupLabel[m] ?? m }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="hasDelivery && shop.shipping?.note" class="shipping-note">
            <i class="bx bx-info-circle"></i>
            {{ shop.shipping.note }}
          </div>
        </div>

        <!-- 本店商品 -->
        <div class="card card--products">
          <div class="card__title"><i class="bx bx-store"></i> 本店商品</div>

          <!-- 種類 tabs -->
          <div v-if="categories.length > 0" class="cat-tabs">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="cat-tab"
              :class="{ 'cat-tab--active': activeCategoryId === cat.id }"
              @click="activeCategoryId = cat.id"
            >
              {{ cat.name }}
            </button>
            <button
              class="cat-tab cat-tab--all"
              :class="{ 'cat-tab--all-active': activeCategoryId === null }"
              @click="activeCategoryId = null"
            >
              全部
            </button>
          </div>

          <!-- 商品清單 -->
          <!-- 初次載入 skeleton -->
          <div
            v-if="productsLoading && products.length === 0"
            class="product-skeleton"
          >
            <div v-for="n in 4" :key="n" class="product-skeleton__item">
              <el-skeleton-item
                variant="image"
                style="width: 100%; aspect-ratio: 1; border-radius: 8px"
              />
              <el-skeleton-item
                variant="text"
                style="width: 70%; margin-top: 8px"
              />
              <el-skeleton-item variant="text" style="width: 40%" />
            </div>
          </div>

          <div
            v-else-if="!productsLoading && products.length === 0"
            class="empty-hint"
            style="margin-top: 4px"
          >
            尚無上架商品
          </div>

          <!-- 切換種類時 grid 保留，疊加 loading overlay -->
          <div
            v-else
            class="product-grid-wrap"
            :class="{ 'product-grid-wrap--loading': productsLoading }"
          >
            <div class="product-grid-overlay" v-if="productsLoading">
              <el-icon
                class="is-loading"
                size="28"
                :style="{ color: 'var(--color-primary)' }"
                ><Loading
              /></el-icon>
            </div>
            <div class="product-grid">
              <div
                v-for="product in products"
                :key="product.id"
                class="product-card"
              >
                <!-- 圖片 -->
                <div class="product-card__img-wrap">
                  <img
                    v-if="product.image_urls?.[0]"
                    :src="product.image_urls[0]"
                    :alt="product.name"
                    class="product-card__img"
                  />
                  <div v-else class="product-card__img-fallback">
                    <i class="bx bx-baguette"></i>
                  </div>
                </div>
                <!-- 資訊 -->
                <div class="product-card__info">
                  <div class="product-card__name">{{ product.name }}</div>
                  <div v-if="product.description" class="product-card__desc">
                    {{ product.description }}
                  </div>
                  <div class="product-card__price">{{ product.price }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 固定底部 CTA -->
    <div v-if="shop && !isLoading" class="bottom-bar">
      <div class="bottom-bar__btns">
        <button
          class="cta-btn"
          @click="
            router.push({
              name: 'store-schedules',
              params: { slug: route.params.slug },
            })
          "
        >
          <i class="bx bx-calendar-check"></i>
          我要訂購
        </button>
        <button
          class="cta-btn cta-btn--ghost"
          @click="
            router.push({
              name: 'store-order-lookup',
              params: { slug: route.params.slug },
            })
          "
        >
          <i class="bx bx-receipt"></i>
          我的訂單
        </button>
      </div>
      <div class="bottom-bar__powered">
        由 <a href="/" target="_blank" rel="noopener">Prelo</a> 提供服務
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.store-page {
  height: 100dvh;
  overflow-y: auto;
  background: #fffdf9;
  padding-bottom: 120px;
}

.state-center {
  padding: 48px 20px;
}

.state-notfound {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: #c0b0a0;

  i {
    font-size: 56px;
    margin-bottom: 12px;
    display: block;
  }
  p {
    font-size: 18px;
    font-weight: 700;
    color: #8a7060;
    margin: 0 0 6px;
  }
  small {
    font-size: 13px;
  }

  .home-btn {
    margin-top: 20px;
    padding: 9px 24px;
    border-radius: 999px;
    border: 1.5px solid #e8ddd5;
    background: #fff;
    color: #8a7060;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;

    &:active { opacity: 0.7; }
  }
}

/* Hero */
.hero {
  &__cover {
    height: 180px;
    background: linear-gradient(160deg, #e0e0e0 0%, #c8c8c8 55%, #b0b0b0 100%);
    overflow: hidden;
    position: relative;
  }

  &__cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__identity {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 20px 28px;
    text-align: center;
    margin-top: -60px;
  }

  &__avatar {
    width: 120px;
    height: 120px;
    border-radius: 999px;
    overflow: hidden;
    border: 4px solid #fff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    position: relative;
    z-index: 2001;
    margin-bottom: 6px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__avatar-fallback {
    font-size: 32px;
    line-height: 1;
    font-weight: 700;
    color: #7a4f00;
  }

  &__name {
    font-size: 26px;
    font-weight: 900;
    color: #1a120b;
    margin: 0;
    letter-spacing: 0.06em;
    font-family: "Noto Serif TC", "Georgia", serif;
  }

  &__intro {
    font-size: 14px;
    color: #5c4b3e;
    line-height: 1.7;
    margin: 2px 0 0;
    max-width: 340px;
  }
}

/* Body */
.body {
  max-width: 520px;
  margin: 0 auto;
  padding: 0 16px;
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
    font-size: 15px;
    font-weight: 700;
    color: #1a120b;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 7px;

    i {
      font-size: 17px;
      color: var(--color-primary);
    }
  }
}

/* Info rows */
.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #1a120b;
  line-height: 1.5;

  & + & {
    margin-top: 10px;
  }

  &__label {
    flex-shrink: 0;
    width: 32px;
    font-size: 13px;
    font-weight: 700;
    color: #8a7060;
  }

  &__link {
    color: #1a120b;
    text-decoration: none;

    &:active {
      color: var(--color-primary);
    }
  }

  &__phone {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    line-height: 1;
  }

  &__address {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
}

.social-links {
  display: flex;
  gap: 8px;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  font-size: 18px;
  text-decoration: none;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.7;
  }
  & .bx {
    font-size: 22px;
  }
  &--line {
    background: #06c755;
    color: #fff;
  }

  &--facebook {
    background: #1877f2;
    color: #fff;
  }

  &--instagram {
    background: radial-gradient(
      circle at 30% 107%,
      #fdf497 0%,
      #fdf497 5%,
      #fd5949 45%,
      #d6249f 60%,
      #285aeb 90%
    );
    color: #fff;
  }
}

.call-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #e8f5ee;
  color: #1e7a48;
  font-size: 14px;
  flex-shrink: 0;
  text-decoration: none;
  transition: background 0.15s;

  &:hover { background: #d0f0e0; }
  &:active { background: #b0e8cc; }
}

.map-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #edfaf3;
  color: #1e7a48;
  font-size: 14px;
  flex-shrink: 0;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: #d0f0e0;
  }
  &:active {
    background: #b0e8cc;
  }
}

/* Business hours */
.hours-row {
  display: grid;
  grid-template-columns: 48px 1fr;
  align-items: center;
  font-size: 14px;
  padding: 4px 0;
  color: #1a120b;
  border-bottom: 1px solid #e8ddd5;

  &:last-child {
    border-bottom: none;
  }

  &--closed {
    color: #bbb;
  }

  &__day {
    font-weight: 600;
  }

  &__time {
    color: #5c4b3e;
  }

  &__closed {
    font-size: 12px;
    color: #ccc;
  }
}

.empty-hint {
  font-size: 13px;
  color: #bbb;
}

/* Tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;

  &--payment {
    background: #fff7e6;
    color: #d97706;
    border: 1px solid #f5d89a;
  }

  &--pickup {
    background: #e8f4ff;
    color: #1a6faa;
    border: 1px solid #b8d9f5;
  }
}

/* Method group */
.method-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &__label {
    flex-shrink: 0;
    width: 32px;
    font-size: 13px;
    font-weight: 700;
    color: #8a7060;
    padding-top: 5px;
  }

  .tags {
    flex: 1;
  }
}

/* Shipping note */
.shipping-note {
  margin-top: 12px;
  font-size: 12px;
  color: #8a7060;
  background: #fffdf9;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.5;

  i {
    flex-shrink: 0;
    font-size: 14px;
    margin-top: 1px;
    color: var(--color-primary);
  }
}

/* Fixed bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 16px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  background: rgba(247, 243, 238, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(232, 221, 213, 0.6);
}

.bottom-bar__btns {
  display: flex;
  gap: 10px;

  .cta-btn {
    flex: 1;
  }
}

.bottom-bar__powered {
  text-align: center;
  font-size: 11px;
  color: #b8a898;
  letter-spacing: 0.02em;

  a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
}

.cta-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 999px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.35);

  i {
    font-size: 18px;
  }

  &:hover {
    background: var(--color-primary-hover);
    box-shadow: 0 6px 18px rgba(var(--color-primary-rgb), 0.45);
  }

  &:active {
    background: var(--color-primary-dark);
    box-shadow: none;
  }

  &--ghost {
    background: #fff;
    color: var(--color-primary);
    border: 1.5px solid #e8ddd5;
    box-shadow: none;

    &:hover {
      background: #fff;
      color: var(--color-primary);
      box-shadow: none;
    }

    &:active {
      background: #f0e8de;
      box-shadow: none;
    }
  }
}

/* Products card */
.card--products {
  padding-bottom: 20px;
}

/* Category tabs */
.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.cat-tab {
  padding: 4px 12px;
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

  &--all {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &--all-active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
  }
}

/* Product grid */
.product-grid-wrap {
  position: relative;

  &--loading .product-grid {
    opacity: 0.35;
    pointer-events: none;
  }
}

.product-grid-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  .el-icon {
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-skeleton {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  &__item {
    display: flex;
    flex-direction: column;
  }
}


.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8ddd5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition:
    box-shadow 0.15s,
    transform 0.15s;

  &:active {
    transform: scale(0.98);
  }

  &__img-wrap {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: #f5ede3;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }

  &__img-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d4b896;
    font-size: 40px;
    background: linear-gradient(135deg, #fdf0e4 0%, #f0e0cc 100%);
  }

  &__info {
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: #1a120b;
    line-height: 1.4;
  }

  &__desc {
    font-size: 12px;
    color: #9a8070;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__price {
    font-size: 15px;
    font-weight: 800;
    color: #1a120b;
    margin-top: 6px;

    &::before {
      content: "NT$\00a0";
      font-size: 11px;
      font-weight: 600;
      color: #8a7060;
    }
  }
}
</style>
