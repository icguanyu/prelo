<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

const REMEMBER_KEY = "prelo-remember-email";

const router = useRouter();
const authStore = useAuthStore();
const { loading } = storeToRefs(authStore);
const formRef = ref();

const savedEmail = localStorage.getItem(REMEMBER_KEY);
const form = reactive({
  email: savedEmail ?? "",
  password: "",
});
const rememberMe = ref(!!savedEmail);

const rules = {
  email: [{ required: true, message: "請輸入帳號", trigger: "blur" }],
  password: [{ required: true, message: "請輸入密碼", trigger: "blur" }],
};

const handleLogin = async () => {
  if (loading.value) return;

  const valid = await formRef.value?.validate?.().catch(() => false);
  if (!valid) return;

  try {
    await authStore.login({ email: form.email, password: form.password });
    if (rememberMe.value) {
      localStorage.setItem(REMEMBER_KEY, form.email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    ElMessage.success("登入成功");
    router.push("/shop");
  } catch (err) {
    console.log("catch", err);
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login">
      <!-- Left brand panel -->
      <div class="login__panel">
        <div class="panel__deco panel__deco--lg" />
        <div class="panel__deco panel__deco--sm" />

        <div class="login__panel-inner">
          <div class="login__logo"></div>
          <p class="login__brand-tagline">鋪樂｜小店家的預購接單工具</p>
          <ul class="login__features">
            <li>管理訂單與出貨狀態</li>
            <li>商品上架與庫存追蹤</li>
            <li>訂單資料一目了然</li>
          </ul>
        </div>
      </div>

      <!-- Right form panel -->
      <div class="login__form-panel">
        <div class="login__mobile-logo"></div>
        <h2 class="login__title">歡迎回來</h2>
        <p class="login__subtitle">請輸入您的帳號與密碼</p>

        <el-form
          ref="formRef"
          class="login__form"
          label-position="top"
          :model="form"
          :rules="rules"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="email">
            <template #label><span class="form-label">帳號</span></template>
            <el-input
              v-model="form.email"
              placeholder="輸入電子郵件"
              autocomplete="username"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <template #label><span class="form-label">密碼</span></template>
            <el-input
              v-model="form.password"
              placeholder="輸入密碼"
              type="password"
              autocomplete="current-password"
              show-password
              size="large"
            />
          </el-form-item>
          <div class="login__remember">
            <el-checkbox v-model="rememberMe">記住帳號</el-checkbox>
          </div>
          <el-button
            class="login__submit"
            type="primary"
            size="large"
            :loading="loading"
            :disabled="loading"
            @click="handleLogin"
          >
            {{ loading ? "登入中..." : "登入" }}
          </el-button>
        </el-form>
      </div>
    </div>
    <FooterBar />
  </div>
</template>

<style lang="scss" scoped>
$panel-bg: #fff0ec;
$input-bg: #fff;
$border: #e8e3de;
$text-primary: #252525;
$text-muted: #7a7a7a;

.login-page {
  height: 100dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.login {
  flex: 1;
  display: flex;
  min-height: 0;
}

// ─── Left brand panel ─────────────────────────────────────────────────────────
.login__panel {
  flex: 0 0 50%;
  position: relative;
  overflow: hidden;
  background: #fff0ec;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e8dfd6;

  @media (max-width: 800px) {
    display: none;
  }
}

.panel__deco {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;

  &--lg {
    width: 480px;
    height: 480px;
    bottom: -160px;
    right: -160px;
    border: 1px solid rgba(242, 107, 91, 0.12);
  }

  &--sm {
    width: 240px;
    height: 240px;
    top: -80px;
    left: -80px;
    border: 1px solid rgba(242, 107, 91, 0.08);
  }
}

.login__panel-inner {
  position: relative;
  padding: 48px 56px;
  max-width: 360px;
}

.login__logo {
  width: 160px;
  height: 44px;
  margin-bottom: 6px;
  background-image: url("@/assets/images/logo.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;
}

.login__brand-tagline {
  font-size: 13px;
  font-weight: 500;
  color: #a09080;
  letter-spacing: 0.1em;
  margin: 0 0 36px;
}

.login__features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;

  li {
    font-size: 14px;
    color: #5a5048;
    padding-left: 16px;
    position: relative;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--color-primary);
      opacity: 0.6;
    }
  }
}

// ─── Right form panel ─────────────────────────────────────────────────────────
.login__form-panel {
  flex: 0 0 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: #fff;

  @media (max-width: 800px) {
    flex: 1;
    padding: 40px 24px;
  }
}

.login__mobile-logo {
  display: none;
  width: 130px;
  height: 36px;
  margin-bottom: 20px;
  background-image: url("@/assets/images/logo.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;

  @media (max-width: 800px) {
    display: block;
  }
}

.login__title {
  font-size: 22px;
  font-weight: 700;
  color: $text-primary;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
  text-align: center;
  width: min(380px, 100%);
}

.login__subtitle {
  font-size: 14px;
  color: $text-muted;
  margin: 0 0 28px;
  text-align: center;
  width: min(380px, 100%);
}

// ─── Form ─────────────────────────────────────────────────────────────────────
.login__form {
  width: min(380px, 100%);

  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: #252525;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 6px;
    line-height: 1;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    background: $input-bg;
    box-shadow: 0 0 0 1px $border;
    transition:
      box-shadow 0.18s ease,
      background 0.18s ease;
    padding: 0 12px;

    &:hover {
      box-shadow: 0 0 0 1px #c8c3be;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px var(--color-primary) !important;
      background: #fff;
    }
  }

  :deep(.el-input__inner) {
    height: 42px;
    font-size: 14px;
    color: $text-primary;

    &::placeholder {
      color: #b8b8b8;
    }
  }
}

// ─── Remember me ──────────────────────────────────────────────────────────────
.login__remember {
  margin-bottom: 14px;

  :deep(.el-checkbox__label) {
    font-size: 13px;
    color: $text-muted;
  }

  :deep(.el-checkbox__inner) {
    border-radius: 4px;
  }

  :deep(.el-checkbox.is-checked .el-checkbox__inner) {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

// ─── Submit button ────────────────────────────────────────────────────────────
.login__submit {
  width: 100%;
  margin-top: 6px;
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  transition:
    background 0.18s,
    opacity 0.18s;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover) !important;
    border-color: var(--color-primary-hover) !important;
  }

  &:active:not(:disabled) {
    background: var(--color-primary-dark) !important;
    border-color: var(--color-primary-dark) !important;
  }

  &:disabled {
    opacity: 0.6;
  }
}
</style>
