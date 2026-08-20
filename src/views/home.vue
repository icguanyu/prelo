<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";

const REMEMBER_KEY = "prelo-remember-email";

const router = useRouter();
const authStore = useAuthStore();
const { isLoading } = storeToRefs(authStore);
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
  if (isLoading.value) return;

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
    ElMessage.error(err.response?.data?.message ?? "登入失敗");
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-logo" />
      <h2 class="login-title">商家入口</h2>
      <p class="login-subtitle">請輸入您的帳號與密碼</p>

      <el-form
        ref="formRef"
        class="login-form"
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
        <div class="login-remember">
          <el-checkbox v-model="rememberMe">記住帳號</el-checkbox>
        </div>
        <el-button
          class="login-submit"
          type="primary"
          size="large"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleLogin"
        >
          {{ isLoading ? "登入中..." : "登入" }}
        </el-button>
      </el-form>
    </div>
    <FooterBar />
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  height: 100dvh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
}

.login-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(400px, 100%);
  padding: 40px 32px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #E8E3DE;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);

  @media (max-width: 480px) {
    border: none;
    box-shadow: none;
    border-radius: 0;
    padding: 40px 24px;
  }
}

.login-logo {
  width: 140px;
  height: 38px;
  margin-bottom: 24px;
  background-image: url("@/assets/images/logo.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #252525;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
  text-align: center;
}

.login-subtitle {
  font-size: 14px;
  color: #7a7a7a;
  margin: 0 0 28px;
  text-align: center;
}

.login-form {
  width: 100%;

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
    box-shadow: 0 0 0 1px #e8e3de;
    transition: box-shadow 0.18s ease;
    padding: 0 12px;

    &:hover {
      box-shadow: 0 0 0 1px #c8c3be;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px var(--color-primary) !important;
    }
  }

  :deep(.el-input__inner) {
    height: 42px;
    font-size: 14px;

    &::placeholder {
      color: #b8b8b8;
    }
  }
}

.login-remember {
  margin-bottom: 14px;

  :deep(.el-checkbox__label) {
    font-size: 13px;
    color: #7a7a7a;
  }

  :deep(.el-checkbox__inner) {
    border-radius: 4px;
  }

  :deep(.el-checkbox.is-checked .el-checkbox__inner) {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.login-submit {
  width: 100%;
  margin-top: 6px;
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  transition: background 0.18s, opacity 0.18s;

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
