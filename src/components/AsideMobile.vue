<script setup>
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();
const shopSlug = computed(() => authStore.user?.shopSlug || "");
</script>

<template>
  <nav class="aside-mobile">
    <router-link class="nav-item" to="/shop" title="訂單">
      <div class="icon">
        <img src="@/assets/images/icons/receipt.png" alt="訂單" />
      </div>
      <span class="label">訂單</span>
    </router-link>

    <router-link class="nav-item" to="/shop/order" title="接單">
      <div class="icon">
        <img src="@/assets/images/icons/calendar.png" alt="接單" />
      </div>

      <span class="label">接單</span>
    </router-link>

    <router-link class="nav-item" to="/shop/products" title="商品">
      <div class="icon">
        <img src="@/assets/images/icons/baguette.png" alt="商品" />
      </div>
      <span class="label">商品</span>
    </router-link>

    <router-link class="nav-item" to="/shop/settings" title="設定">
      <div class="icon">
        <img src="@/assets/images/icons/setting.png" alt="設定" />
      </div>
      <span class="label">設定</span>
    </router-link>

    <a
      v-if="shopSlug"
      class="nav-item"
      :href="`/s/${shopSlug}`"
      target="_blank"
      rel="noopener"
      title="前台"
    >
      <div class="icon">
        <img src="@/assets/images/icons/store.png" alt="前台" />
      </div>
      <span class="label">前台</span>
    </a>
  </nav>
</template>

<style lang="scss" scoped>
.aside-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: auto;
  background-color: #fff;
  border-top: 1px solid rgba(180, 140, 100, 0.18);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: max(6px, env(safe-area-inset-bottom));
  padding-top: 0px;
  z-index: 10;
  gap: 4px;

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    flex: 1;
    color: #5a4030;
    text-decoration: none;
    padding: 4px 0;
    position: relative;
    transition: all 0.2s ease;

    .el-badge {
      &::v-deep(sup) {
        border: none;
        background-color: var(--color-primary);
      }
    }

    .icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        user-select: none;
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: brightness(0) opacity(0.55);
      }
    }

    .label {
      user-select: none;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      color: #7a6a5c;
    }
  }

  .nav-item.router-link-exact-active {
    background-color:rgba(var(--color-primary-rgb), 0.12);
    border-radius: 8px;

    .label {
      color: #333;
      font-weight: 700;
    }

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 3px;
      background-color: var(--color-primary);
      border-radius: 0 0 4px 4px;
    }
  }
}
</style>
