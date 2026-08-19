<script setup>
import { useRouter } from "vue-router";
import demoImg1 from "@/assets/images/demo/1.jpg";
import demoImg2 from "@/assets/images/demo/2.jpg";
import demoImg3 from "@/assets/images/demo/3.jpg";
import demoM1 from "@/assets/images/demo/m1.jpg";
import demoM2 from "@/assets/images/demo/m2.jpg";
import demoM3 from "@/assets/images/demo/m3.jpg";
import demoM4 from "@/assets/images/demo/m4.jpg";
import demoM5 from "@/assets/images/demo/m5.jpg";
import demoM6 from "@/assets/images/demo/m6.jpg";
import demoM7 from "@/assets/images/demo/m7.jpg";

const router = useRouter();
const previewMode = ref("pc");

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const painPoints = [
  { text: "用 LINE 一筆一筆確認訂單，回覆到手痠" },
  { text: "手動整理訂單容易漏單，錯誤難以避免" },
  { text: "反覆回答相同問題，佔用大量寶貴時間" },
  { text: "訂單散落各處，統計出貨頭皮發麻" },
];

const steps = [
  {
    title: "建立商品與預購期程",
    desc: "上架商品、設定預購開放日期與每日數量上限，幾分鐘即可完成",
  },
  {
    title: "分享專屬連結",
    desc: "將你的店鋪連結傳給客人，無需下載 App，直接在瀏覽器下單",
  },
  {
    title: "客人自助下單，後台輕鬆管理",
    desc: "訂單自動彙整到後台，出貨狀態即時更新，不再漏單",
  },
];

const features = [
  {
    title: "預購期程管理",
    desc: "彈性設定開放時段與每日限量，系統自動幫你管控，輕鬆掌握接單節奏",
  },
  {
    title: "商品上架",
    desc: "支援多商品分類，圖文並茂讓客人一目了然，隨時調整規格與售價",
  },
  {
    title: "訂單彙整",
    desc: "所有訂單集中顯示，確認出貨狀態不再手忙腳亂，一個頁面管理所有訂單",
  },
  {
    title: "客人自助查詢",
    desc: "客人用手機號碼即可自助查詢訂單狀態，大幅減少客服時間",
  },
  {
    title: "LINE 即時訂單通知",
    desc: "客人下單的瞬間，LINE 立即推播通知到您手機，商品明細一目了然，再也不漏接一筆",
  },
];
</script>

<template>
  <div class="lp-wrap">
    <!-- Nav -->
    <nav class="lp-nav">
      <div class="lp-nav__logo" @click="router.push('/')" />
      <div class="lp-nav__actions">
        <el-button class="lp-nav__login" @click="router.push('/login')"
          >登入</el-button
        >
        <el-button class="lp-nav__register" @click="router.push('/register')"
          >免費開店</el-button
        >
      </div>
    </nav>

    <!-- Hero -->
    <section class="lp-hero">
      <div class="lp-hero__inner">
        <p class="lp-eyebrow">小店家最愛・預購訂單管理工具</p>
        <h1 class="lp-hero__title">客人自助下單<br />你輕鬆接單</h1>
        <p class="lp-hero__sub">
          不用再 LINE 來 LINE 去<br />
          5 分鐘建立你的專屬訂購頁，免費開始使用
        </p>
        <div class="lp-hero__actions">
          <el-button
            class="lp-btn-primary lp-btn-lg"
            @click="router.push('/register')"
          >
            立即免費開店
          </el-button>
          <el-button class="lp-btn-ghost lp-btn-lg" @click="scrollTo('lp-how')">
            了解更多
          </el-button>
        </div>
        <div class="lp-hero__trust">
          <span class="lp-trust-badge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            不接手金流
          </span>
          <span class="lp-trust-dot" />
          <span class="lp-trust-badge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            資料安全無虞
          </span>
          <span class="lp-trust-dot" />
          <span class="lp-trust-badge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            免費使用
          </span>
        </div>
      </div>

      <!-- Stats inside hero -->
      <div class="lp-hero__stats">
        <div class="lp-stats__item">
          <span class="lp-stats__num"
            >網頁 <span class="lp-stats__unit">下單</span></span
          >
          <span class="lp-stats__label">客人用連結直接下單，免安裝APP</span>
        </div>
        <div class="lp-stats__sep" />
        <div class="lp-stats__item">
          <span class="lp-stats__num"
            >手機 <span class="lp-stats__unit">平板</span></span
          >
          <span class="lp-stats__label">跨裝置隨時管理</span>
        </div>
        <div class="lp-stats__sep" />
        <div class="lp-stats__item">
          <span class="lp-stats__num"
            >5 <span class="lp-stats__unit">分鐘</span></span
          >
          <span class="lp-stats__label">即可完成開店</span>
        </div>
        <div class="lp-stats__sep" />
        <div class="lp-stats__item">
          <span class="lp-stats__num"
            >無 <span class="lp-stats__unit">綁約</span></span
          >
          <span class="lp-stats__label">隨時可以取消</span>
        </div>
      </div>
    </section>

    <!-- Pain Points -->
    <section class="lp-pain">
      <div class="lp-inner">
        <p class="lp-eyebrow lp-eyebrow--dark">你是否還在...</p>
        <h2 class="lp-section-title">靠社群平台一筆筆手動收訂單？</h2>
        <div class="lp-pain__grid">
          <div
            v-for="item in painPoints"
            :key="item.text"
            class="lp-pain__card"
          >
            <div class="lp-pain__x">✕</div>
            <p>{{ item.text }}</p>
          </div>
        </div>
        <div class="lp-pain__divider">
          <span>Prelo，讓這一切成為過去</span>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="lp-how" id="lp-how">
      <div class="lp-inner">
        <p class="lp-eyebrow lp-eyebrow--dark">三步驟上線</p>
        <h2 class="lp-section-title">開店超簡單</h2>
        <div class="lp-how__steps">
          <div v-for="(step, i) in steps" :key="i" class="lp-how__step">
            <div class="lp-how__num">{{ i + 1 }}</div>
            <div class="lp-how__body">
              <h3>{{ step.title }}</h3>
              <p>{{ step.desc }}</p>
            </div>
            <div v-if="i < steps.length - 1" class="lp-how__line" />
          </div>
        </div>
      </div>
    </section>

    <!-- Dashboard Preview -->
    <section class="lp-preview">
      <div class="lp-inner">
        <p class="lp-eyebrow lp-eyebrow--dark">產品截圖</p>
        <h2 class="lp-section-title">清楚好用的管理後台</h2>
        <div class="lp-preview__toggle">
          <button
            class="lp-preview__toggle-btn"
            :class="{ active: previewMode === 'pc' }"
            @click="previewMode = 'pc'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <polyline points="8 21 12 17 16 21" />
            </svg>
            PC / 平板
          </button>
          <button
            class="lp-preview__toggle-btn"
            :class="{ active: previewMode === 'mobile' }"
            @click="previewMode = 'mobile'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            手機
          </button>
        </div>

        <div v-if="previewMode === 'pc'" class="lp-preview__browser">
          <div class="lp-preview__bar">
            <div class="lp-preview__dots">
              <span class="lp-preview__dot lp-preview__dot--red" />
              <span class="lp-preview__dot lp-preview__dot--yellow" />
              <span class="lp-preview__dot lp-preview__dot--green" />
            </div>
            <div class="lp-preview__url">您的專屬連結</div>
          </div>
          <div class="lp-preview__screen">
            <el-carousel height="100%" :interval="4000">
              <el-carousel-item>
                <img :src="demoImg1" alt="接單排程" class="lp-preview__img" />
              </el-carousel-item>
              <el-carousel-item>
                <img :src="demoImg2" alt="訂單管理" class="lp-preview__img" />
              </el-carousel-item>
              <el-carousel-item>
                <img :src="demoImg3" alt="產品管理" class="lp-preview__img" />
              </el-carousel-item>
            </el-carousel>
          </div>
        </div>

        <div v-else class="lp-preview__phone-view">
          <el-carousel height="100%" :interval="4000">
            <el-carousel-item>
              <img :src="demoM1" alt="商店首頁" class="lp-preview__img" />
            </el-carousel-item>
            <el-carousel-item>
              <img :src="demoM2" alt="接單行程" class="lp-preview__img" />
            </el-carousel-item>
            <el-carousel-item>
              <img :src="demoM3" alt="訂購頁面" class="lp-preview__img" />
            </el-carousel-item>
            <el-carousel-item>
              <img :src="demoM4" alt="下單成功" class="lp-preview__img" />
            </el-carousel-item>
            <el-carousel-item>
              <img :src="demoM5" alt="查詢訂單" class="lp-preview__img" />
            </el-carousel-item>
            <el-carousel-item>
              <img :src="demoM6" alt="訂單管理" class="lp-preview__img" />
            </el-carousel-item>
            <el-carousel-item>
              <img :src="demoM7" alt="訂單管理" class="lp-preview__img" />
            </el-carousel-item>
          </el-carousel>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="lp-features">
      <div class="lp-inner">
        <p class="lp-eyebrow lp-eyebrow--dark">核心功能</p>
        <h2 class="lp-section-title">一站式預購管理</h2>
        <div class="lp-features__grid">
          <!-- 預購期程 -->
          <div class="lp-feat-card">
            <div class="lp-feat-card__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="8" y1="14" x2="8" y2="14" />
                <line x1="12" y1="14" x2="12" y2="14" />
                <line x1="8" y1="18" x2="8" y2="18" />
                <line x1="12" y1="18" x2="12" y2="18" />
              </svg>
            </div>
            <h3>{{ features[0].title }}</h3>
            <p>{{ features[0].desc }}</p>
          </div>
          <!-- 商品上架 -->
          <div class="lp-feat-card">
            <div class="lp-feat-card__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="3.5" cy="6" r="1" />
                <circle cx="3.5" cy="12" r="1" />
                <circle cx="3.5" cy="18" r="1" />
              </svg>
            </div>
            <h3>{{ features[1].title }}</h3>
            <p>{{ features[1].desc }}</p>
          </div>
          <!-- 訂單彙整 -->
          <div class="lp-feat-card">
            <div class="lp-feat-card__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="12" y2="16" />
              </svg>
            </div>
            <h3>{{ features[2].title }}</h3>
            <p>{{ features[2].desc }}</p>
          </div>
          <!-- 客人查詢 -->
          <div class="lp-feat-card">
            <div class="lp-feat-card__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3>{{ features[3].title }}</h3>
            <p>{{ features[3].desc }}</p>
          </div>
          <!-- LINE 通知 -->
          <div class="lp-feat-card lp-feat-card--line">
            <div class="lp-feat-card__icon lp-feat-card__icon--line">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="9" y1="10" x2="9" y2="10" stroke-width="2.5" stroke-linecap="round" />
                <line x1="12" y1="10" x2="12" y2="10" stroke-width="2.5" stroke-linecap="round" />
                <line x1="15" y1="10" x2="15" y2="10" stroke-width="2.5" stroke-linecap="round" />
              </svg>
            </div>
            <div class="lp-feat-card__new">NEW</div>
            <h3>{{ features[4].title }}</h3>
            <p>{{ features[4].desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="lp-cta">
      <div class="lp-cta__inner">
        <p class="lp-eyebrow">立即加入</p>
        <h2 class="lp-cta__title">準備好了嗎？</h2>
        <p class="lp-cta__sub">建立你的預購頁面，免費開始使用。</p>
        <el-button
          class="lp-btn-primary lp-btn-lg"
          @click="router.push('/register')"
        >
          立即免費開店
        </el-button>
        <p class="lp-cta__hint">免費使用，隨時可以取消</p>
      </div>
    </section>

    <!-- Disclaimer -->
    <div class="lp-disclaimer">
      <p>
        Prelo 目前<strong>免費開放使用</strong>，功能持續更新中。服務內容或收費政策日後可能調整，使用前請詳閱
        <RouterLink to="/terms">服務條款</RouterLink>
        及
        <RouterLink to="/privacy">隱私權政策</RouterLink>；因系統因素造成之損失，本平台恕不負責。
      </p>
    </div>

    <FooterBar />
  </div>
</template>

<style scoped lang="scss">
$dark: #252525;
$cream: #fffdf9;
$cream-deep: #fff0ec;
$white: #fff;
$text: #252525;
$muted: #7a7a7a;
$border: #e8e3de;

// ─── Wrapper ──────────────────────────────────────────────────────────────────
.lp-wrap {
  height: 100dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: $cream;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
.lp-nav {
  position: sticky;
  top: 0;
  flex-shrink: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  height: 64px;
  background: rgba(#fffdf9, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border;
}

.lp-nav__logo {
  width: 110px;
  height: 32px;
  background-image: url("@/assets/images/logo2.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;
  cursor: pointer;
}

.lp-nav__actions {
  display: flex;
}

.lp-nav__login {
  height: 36px !important;
  padding: 0 18px !important;
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  background: transparent !important;
  border-color: $border !important;
  color: $muted !important;
  transition:
    border-color 0.15s,
    color 0.15s !important;

  &:hover {
    border-color: #c0b0a0 !important;
    color: $text !important;
  }
}

.lp-nav__register {
  height: 36px !important;
  padding: 0 20px !important;
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: #fff !important;
  box-shadow: 0 2px 10px rgba(var(--color-primary-rgb), 0.3) !important;
  transition: all 0.15s !important;

  &:hover {
    background: var(--color-primary-hover) !important;
    border-color: var(--color-primary-hover) !important;
    box-shadow: 0 4px 14px rgba(var(--color-primary-rgb), 0.4) !important;
    transform: translateY(-1px) !important;
  }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
.lp-hero {
  position: relative;
  min-height: calc(100dvh - 64px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #fffdf9;
}

.lp-hero__inner {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 80px 24px 60px;
  max-width: 660px;
  margin: 0 auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.lp-hero__stats {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  border-top: 1px solid rgba($text, 0.08);
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(4px);
}

.lp-hero__title {
  font-size: clamp(40px, 8vw, 68px);
  font-weight: 800;
  line-height: 1.15;
  color: $text;
  margin: 0 0 24px;
  letter-spacing: -0.02em;
}

.lp-hero__sub {
  font-size: 16px;
  line-height: 1.9;
  color: $muted;
  margin: 0 0 44px;
}

.lp-hero__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.lp-hero__trust {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.lp-trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #a89880;

  svg {
    color: var(--color-primary);
    opacity: 0.85;
    flex-shrink: 0;
  }
}

.lp-trust-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: $border;
}

// ─── Shared button styles ─────────────────────────────────────────────────────
.lp-btn-primary {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: #fff !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.35) !important;
  transition: all 0.15s !important;

  &:hover {
    background: var(--color-primary-hover) !important;
    border-color: var(--color-primary-hover) !important;
    box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.45) !important;
    transform: translateY(-1px) !important;
  }

  &:active {
    transform: translateY(0) !important;
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3) !important;
  }
}

.lp-btn-ghost {
  background: transparent !important;
  border-color: $border !important;
  color: $muted !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  transition: all 0.15s !important;

  &:hover {
    border-color: #c0b0a0 !important;
    color: $text !important;
  }
}

.lp-btn-lg {
  height: 50px !important;
  padding: 0 36px !important;
  font-size: 15px !important;
}

// ─── Shared section layout ────────────────────────────────────────────────────
.lp-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 88px 24px;
  text-align: center;
}

.lp-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin: 0 0 14px;
}

.lp-eyebrow--dark {
  color: var(--color-secondary);
}

.lp-section-title {
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 800;
  color: $text;
  margin: 0 0 52px;
  letter-spacing: -0.01em;
}

// ─── Pain Points ──────────────────────────────────────────────────────────────
.lp-pain {
  background: $cream;
}

.lp-pain__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 44px;
}

.lp-pain__card {
  background: $white;
  border: 1px solid $border;
  border-radius: 8px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }

  p {
    font-size: 14px;
    color: $muted;
    margin: 0;
    line-height: 1.65;
  }
}

.lp-pain__x {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #dc3c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.lp-pain__divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;

  &::before,
  &::after {
    content: "";
    width: 80px;
    height: 1px;
    background: $border;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-secondary);
    white-space: nowrap;
  }
}

// ─── How It Works ─────────────────────────────────────────────────────────────
.lp-how {
  background:
    repeating-linear-gradient(
      -55deg,
      transparent,
      transparent 28px,
      rgba(180, 140, 100, 0.07) 28px,
      rgba(180, 140, 100, 0.07) 29px
    ),
    #fffdf9;
}

.lp-how__steps {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 540px;
  margin: 0 auto;
  text-align: left;
}

.lp-how__step {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  position: relative;
}

.lp-how__num {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.35);
}

.lp-how__body {
  padding-top: 8px;
  padding-bottom: 40px;

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: $text;
    margin: 0 0 6px;
  }

  p {
    font-size: 14px;
    color: $muted;
    margin: 0;
    line-height: 1.75;
  }
}

.lp-how__line {
  position: absolute;
  left: 21px;
  top: 46px;
  width: 2px;
  height: calc(100% - 8px);
  background: linear-gradient(180deg, $border 60%, transparent);
}

// ─── Features ─────────────────────────────────────────────────────────────────
.lp-features {
  background: $cream;
}

.lp-features__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 20px;
}

.lp-feat-card {
  background: $white;
  border: 1px solid $border;
  border-radius: 8px;
  padding: 28px 24px;
  text-align: left;
  transition:
    box-shadow 0.2s,
    transform 0.2s;

  &:hover {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
    transform: translateY(-2px);
  }

  h3 {
    font-size: 15px;
    font-weight: 700;
    color: $text;
    margin: 14px 0 8px;
  }

  p {
    font-size: 13px;
    color: $muted;
    margin: 0;
    line-height: 1.75;
  }
}

.lp-feat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.lp-feat-card--line {
  position: relative;
  border-color: rgba(0, 185, 0, 0.25);
  background: linear-gradient(135deg, #f0fff0 0%, #fff 60%);

  &:hover {
    box-shadow: 0 8px 28px rgba(0, 185, 0, 0.12);
  }
}

.lp-feat-card__icon--line {
  background: rgba(0, 185, 0, 0.12);
  border-color: rgba(0, 185, 0, 0.25);
  color: #00b300;
}

.lp-feat-card__new {
  position: absolute;
  top: 14px;
  right: 14px;
  background: #00b300;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 4px;
  line-height: 1.6;
}

// ─── Stats (inside hero) ──────────────────────────────────────────────────────
.lp-stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 22px 44px;
  gap: 5px;
}

.lp-stats__num {
  font-size: 30px;
  font-weight: 800;
  color: $text;
  letter-spacing: -0.02em;
  line-height: 1;
}

.lp-stats__sup {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
  vertical-align: super;
  line-height: 0;
}

.lp-stats__unit {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-secondary);
}

.lp-stats__label {
  font-size: 13px;
  color: $muted;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.lp-stats__sep {
  width: 1px;
  height: 36px;
  background: $border;
  flex-shrink: 0;

  @media (max-width: 600px) {
    display: none;
  }
}

// ─── Dashboard Preview ────────────────────────────────────────────────────────
.lp-preview {
  background:
    repeating-linear-gradient(
      -55deg,
      transparent,
      transparent 28px,
      rgba(180, 140, 100, 0.07) 28px,
      rgba(180, 140, 100, 0.07) 29px
    ),
    #fffdf9;
}

.lp-preview__toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.lp-preview__toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 22px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  border: 1px solid $border;
  background: $white;
  color: $muted;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;

  &:first-child {
    border-radius: 6px 0 0 6px;
    border-right: none;
  }

  &:last-child {
    border-radius: 0 6px 6px 0;
  }

  &:hover:not(.active) {
    background: #f5f0eb;
    color: $text;
  }

  &.active {
    background: $text;
    border-color: $text;
    color: $white;
  }
}

.lp-preview__browser {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid $border;
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.1);
}

.lp-preview__phone-view {
  width: 300px;
  max-width: 100%;
  margin: 0 auto;
  aspect-ratio: 9 / 19.5;
  background: #f5efe8;
  border: 1px solid $border;
  border-radius: 8px;
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  :deep(.el-carousel),
  :deep(.el-carousel__container) {
    height: 100%;
  }
}

.lp-preview__phone-placeholder {
  width: 100%;
  height: 100%;
  background: #f5efe8;
}

.lp-preview__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #e8e2dc;
  border-bottom: 1px solid $border;
}

.lp-preview__dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.lp-preview__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;

  &--red {
    background: #ff5f57;
  }
  &--yellow {
    background: #febc2e;
  }
  &--green {
    background: #28c840;
  }
}

.lp-preview__url {
  flex: 1;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  color: $muted;
  text-align: center;
  max-width: 280px;
  margin: 0 auto;
}

.lp-preview__screen {
  background: #f5f0ea;
  aspect-ratio: 16 / 9;
  overflow: hidden;

  :deep(.el-carousel),
  :deep(.el-carousel__container) {
    height: 100%;
  }
}

.lp-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  display: block;
}

.lp-preview__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #b8a898;

  p {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #a89880;
  }

  span {
    font-size: 12px;
    color: #c0b0a0;
  }

  svg {
    opacity: 0.4;
  }
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
.lp-cta {
  position: relative;
  overflow: hidden;
  background: $dark;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(var(--color-primary-rgb), 0.25) 0%,
        transparent 55%
      ),
      radial-gradient(
        circle at 80% 80%,
        rgba(255, 180, 80, 0.1) 0%,
        transparent 45%
      );
    pointer-events: none;
  }
}

.lp-cta__inner {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 100px 24px;
}

.lp-cta__title {
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 800;
  color: #fff;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}

.lp-cta__sub {
  font-size: 15px;
  color: rgba(#f0e8de, 0.65);
  margin: 0 0 36px;
  line-height: 1.7;
}

.lp-cta__hint {
  margin: 16px 0 0;
  font-size: 13px;
  color: rgba(#f0e8de, 0.35);
}

// ─── RWD ──────────────────────────────────────────────────────────────────────
@media (max-width: 600px) {
  .lp-nav {
    padding: 0 20px;
  }

  .lp-nav__logo {
    width: 90px;
  }

  .lp-inner {
    padding: 64px 20px;
  }

  .lp-stats__item {
    padding: 24px 24px;
  }

  .lp-pain__grid {
    grid-template-columns: 1fr 1fr;
  }

  .lp-how__steps {
    max-width: 100%;
  }
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────
.lp-disclaimer {
  background: #fff;
  border-top: 1px solid #e0d5cc;
  padding: 14px 32px;

  p {
    margin: 0;
    font-size: 11px;
    color: #9e9087;
    line-height: 1.8;
    text-align: center;

    strong {
      font-weight: 600;
      color: #7a7068;
    }

    a {
      color: #9e9087;
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover {
        color: #5a5048;
      }
    }
  }
}
</style>
