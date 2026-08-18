<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);
const formRef = ref();

const form = reactive({
  shopName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error("兩次輸入的密碼不一致"));
  } else {
    callback();
  }
};

const rules = {
  shopName: [
    { required: true, message: "請輸入店名", trigger: "blur" },
    { min: 2, message: "店名至少 2 個字元", trigger: "blur" },
  ],
  email: [
    { required: true, message: "請輸入 Email", trigger: "blur" },
    { type: "email", message: "Email 格式不正確", trigger: "blur" },
  ],
  password: [
    { required: true, message: "請輸入密碼", trigger: "blur" },
    { min: 8, message: "密碼至少 8 個字元", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "請再次輸入密碼", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" },
  ],
};

const handleRegister = async () => {
  if (loading.value) return;
  const valid = await formRef.value?.validate?.().catch(() => false);
  if (!valid) return;

  try {
    const token = await authStore.register({
      name: form.shopName,
      email: form.email,
      password: form.password,
    });
    if (token) {
      ElMessage.success("開店成功，歡迎加入！");
      router.push("/shop");
    } else {
      ElMessage.success("註冊成功，請登入");
      router.push("/login");
    }
  } catch {
    // 錯誤訊息由 API 攔截器統一顯示
  }
};

const features = [
  {
    title: "預購排程管理",
    desc: "設定開放日期、每日數量上限，系統自動幫你管控",
  },
  {
    title: "商品菜單",
    desc: "上架品項、設定規格與價格，隨時調整",
  },
  {
    title: "客人自助下單",
    desc: "專屬連結發出去，客人自己選日期、選商品、送出訂單",
  },
];
</script>

<template>
  <div class="page-wrap">
    <div class="page">
      <!-- 左側品牌欄 -->
      <aside class="brand">
        <div class="brand__inner">
          <div class="brand__logo" @click="router.push('/')" />

          <div class="brand__eyebrow">鋪樂｜小店家最愛・預購訂單管理工具</div>
          <div class="brand__headline">客人自助下單<br />你輕鬆接單</div>
          <p class="brand__sub">
            不用再 LINE 來 LINE 去<br />5 分鐘建立你的專屬訂購頁
          </p>

          <ul class="features">
            <li v-for="(f, i) in features" :key="f.title" class="feature">
              <span class="feature__icon">
                <!-- 排程 -->
                <svg
                  v-if="i === 0"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
                <!-- 菜單 -->
                <svg
                  v-else-if="i === 1"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
                <!-- 訂購頁 -->
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                  />
                  <path
                    d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                  />
                </svg>
              </span>
              <div>
                <div class="feature__title">{{ f.title }}</div>
                <div class="feature__desc">{{ f.desc }}</div>
              </div>
            </li>
          </ul>

          <div class="brand__footer">免費使用，隨時可以取消</div>
        </div>
      </aside>

      <!-- 右側表單欄 -->
      <main class="form-col">
        <div class="form-wrap">
          <div class="form-header">
            <h1 class="form-title">建立店家帳號</h1>
            <p class="form-sub">
              已有帳號？
              <el-button type="primary" link @click="router.push('/login')">
                登入
              </el-button>
            </p>
          </div>

          <el-form
            ref="formRef"
            class="form"
            label-position="top"
            :model="form"
            :rules="rules"
            @keyup.enter="handleRegister"
          >
            <el-form-item label="店名" prop="shopName">
              <el-input
                v-model="form.shopName"
                placeholder="例：我家烘焙坊"
                size="large"
                autocomplete="organization"
              />
            </el-form-item>

            <el-form-item label="Email" prop="email">
              <el-input
                v-model="form.email"
                placeholder="your@email.com"
                size="large"
                autocomplete="email"
              />
            </el-form-item>

            <div class="form-row">
              <el-form-item label="密碼" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="至少 8 個字元"
                  size="large"
                  autocomplete="new-password"
                  show-password
                />
              </el-form-item>

              <el-form-item label="確認密碼" prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="再輸入一次"
                  size="large"
                  autocomplete="new-password"
                  show-password
                />
              </el-form-item>
            </div>

            <el-button
              class="submit-btn"
              type="primary"
              size="large"
              :loading="loading"
              :disabled="loading"
              @click="handleRegister"
            >
              免費開始使用
            </el-button>

            <p class="form-terms">
              點擊「免費開始使用」即表示同意
              <RouterLink to="/terms">服務條款</RouterLink>
              與
              <RouterLink to="/privacy">隱私權政策</RouterLink>。
            </p>
            <p class="form-disclaimer">
              本服務目前處於試營運階段，暫不收取任何費用；功能與收費政策日後可能調整，恕不另行通知。因系統異常或失效造成之商業損失，本平台概不負賠償責任。
            </p>
          </el-form>
        </div>
      </main>
    </div>
    <FooterBar />
  </div>
</template>

<style scoped lang="scss">
.page-wrap {
  height: 100dvh;
  overflow-y: auto;
}

.page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100dvh;
}

/* ── 左側 ── */
.brand {
  background:
    radial-gradient(
      circle at 15% 20%,
      rgba(var(--color-primary-rgb), 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 85% 80%,
      rgba(var(--color-primary-rgb), 0.06) 0%,
      transparent 45%
    ),
    #fff0ec;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow: hidden;
}

.brand__inner {
  position: relative;
  max-width: 360px;
  width: 100%;
}

.brand__logo {
  background-image: url("@/assets/images/logo2.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;
  width: 120px;
  height: 42px;
  margin-bottom: 6px;
  cursor: pointer;
}

.brand__eyebrow {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  opacity: 0.75;
}

.brand__headline {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.25;
  color: #252525;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.brand__sub {
  font-size: 15px;
  line-height: 1.7;
  color: #7a7a7a;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.feature__icon {
  width: 40px;
  height: 40px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-primary);
}

.feature__title {
  font-size: 14px;
  font-weight: 600;
  color: #252525;
  margin-bottom: 2px;
}

.feature__desc {
  font-size: 13px;
  color: #7a7a7a;
  line-height: 1.5;
}

.brand__footer {
  font-size: 13px;
  color: #a0a0a0;
}

/* ── 右側 ── */
.form-col {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  min-height: 100dvh;
}

.form-wrap {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 28px;
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #252525;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.form-sub {
  font-size: 14px;
  color: #7a7a7a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 2px;

  .el-button {
    font-size: 14px;
    color: var(--color-primary);
    padding: 0 2px;
  }
}

.form {
  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 600;
    color: #252525;
    padding-bottom: 4px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 0 0 1px #e8e3de;
    transition: box-shadow 0.15s;

    &:hover {
      box-shadow: 0 0 0 1px #c8c3be;
    }
    &.is-focus {
      box-shadow: 0 0 0 2px var(--color-primary) !important;
    }
  }

  :deep(.el-input__inner) {
    color: #252525;
    font-size: 15px;
    &::placeholder {
      color: #b8b8b8;
    }
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.3);
  transition: all 0.15s;

  &:hover {
    background: var(--color-primary-hover) !important;
    border-color: var(--color-primary-hover) !important;
    box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
  }
}

.form-terms {
  margin: 14px 0 0;
  font-size: 12px;
  color: #a89888;
  text-align: center;
  line-height: 1.6;

  a {
    color: #8a7060;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: var(--color-primary);
    }
  }
}

.form-disclaimer {
  margin: 8px 0 0;
  font-size: 11px;
  color: #c0b0a0;
  text-align: center;
  line-height: 1.7;
}

/* ── RWD ── */
@media (max-width: 768px) {
  .page {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .brand {
    position: static;
    height: auto;
    padding: 32px 24px;

    .brand__headline {
      font-size: 26px;
    }
    .features {
      display: none;
    }
    .brand__footer {
      display: none;
    }
  }

  .form-col {
    min-height: auto;
    padding: 32px 24px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
