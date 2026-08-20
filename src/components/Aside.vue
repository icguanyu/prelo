<script setup>
import { computed, onMounted, ref } from "vue";
import dayjs from "dayjs";
import { Schedules } from "@/api/schedules";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits(["toggle"]);
const authStore = useAuthStore();
const shopSlug = computed(() => authStore.user?.shopSlug || "");

const currentYear = computed(() => dayjs().format("YYYY"));
const currentMonth = computed(() => dayjs().format("MMM").toUpperCase());
const currentDate = computed(() => dayjs().format("DD"));
const todayOrderCount = ref(0);

const loadTodayOrderCount = async () => {
  const today = dayjs().format("YYYY-MM-DD");
  try {
    const res = await Schedules.GetByDate(today);
    if (!res?.data) {
      todayOrderCount.value = 0;
      return;
    }
    const count =
      res.data.order_count ??
      (Array.isArray(res.data.orders) ? res.data.orders.length : 0);
    todayOrderCount.value = Number.isFinite(count) ? count : 0;
  } catch (error) {
    console.log("load today order count error", error);
    todayOrderCount.value = 0;
  }
};

onMounted(() => {
  loadTodayOrderCount();
});
</script>

<template>
  <aside>
    <div class="aside-logo" />
    <!-- <div class="date-box">
      <div class="year">{{ currentYear }}</div>
      <div class="month">{{ currentMonth }}</div>
      <div class="date">{{ currentDate }}</div>
    </div> -->
    <!-- <router-link class="link" to="/shop">
      <div class="icon">
        <img src="@/assets/images/icons/home.png" alt="" />
      </div>
      <div class="title">總覽</div>
    </router-link> -->
    <router-link class="link" to="/shop">
      <el-badge :value="todayOrderCount" :max="99" :offset="[-10, 4]">
        <div class="icon">
          <img src="@/assets/images/icons/receipt.png" alt="" />
        </div>
      </el-badge>
      <div class="title">訂單</div>
    </router-link>
    <router-link class="link" to="/shop/order">
      <div class="icon">
        <img src="@/assets/images/icons/calendar.png" alt="" />
      </div>
      <div class="title">接單</div>
    </router-link>
    <router-link class="link" to="/shop/products">
      <div class="icon">
        <img src="@/assets/images/icons/baguette.png" alt="" />
      </div>
      <div class="title">商品</div>
    </router-link>
    <router-link class="link" to="/shop/settings">
      <div class="icon">
        <img src="@/assets/images/icons/setting.png" alt="" />
      </div>
      <div class="title">設定</div>
    </router-link>
    <a
      v-if="shopSlug"
      class="link store-front-link"
      :href="`/s/${shopSlug}`"
      target="_blank"
      rel="noopener"
      title="前往前台"
    >
      <div class="icon">
        <img src="@/assets/images/icons/store.png" alt="" />
      </div>
      <div class="title">前台</div>
    </a>
    <div
      class="aside-toggle"
      aria-label="Toggle aside menu"
      @click="emit('toggle')"
    >
      <div class="icon">
        <img src="@/assets/images/icons/expand_left.svg" alt="" />
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
aside {
  position: sticky;
  top: 0;
  flex-shrink: 0;
  width: 70px;
  flex-basis: 70px;
  height: 100dvh;
  background-color: #fff;
  border-right: 1px solid rgba(180, 140, 100, 0.18);
  display: flex;
  flex-direction: column;

  gap: 8px;
  overflow: hidden;
  transition:
    width 0.2s ease,
    flex-basis 0.2s ease,
    opacity 0.2s ease;

  .aside-logo {
    width: 55px;
    height: 40px;
    margin: 14px auto 6px;
    background-image: url("@/assets/images/logo-circle.png");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    flex-shrink: 0;
  }

  .link {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #5a4030;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 6px;
    margin: 0 4px;
    .el-badge {
      &::v-deep(sup) {
        border: none;
      }
    }
    .icon {
      width: 35px;
      height: 35px;
      img {
        user-select: none;
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: brightness(0) opacity(0.55);
      }
    }
    .title {
      font-size: 12px;
    }
  }
  .link.router-link-exact-active {
    background-color: rgba(var(--color-primary-rgb), 0.12);
    color: var(--color-primary);
    // &:after {
    //   content: "";
    //   display: block;
    //   width: 10px;
    //   height: 10px;
    //   background-color: var(--color-primary);
    //   position: absolute;
    //   right: 0;
    //   top: 50%;
    //   transform: translateY(-50%) translateX(50%) rotate(45deg);
    // }
  }
  .store-front-link {
    margin-top: auto;
    border-top: 1px solid rgba(180, 140, 100, 0.18);
    padding-top: 12px;
  }
  .aside-toggle {
    display: none;
  }
}

aside.is-collapsed {
  width: 0;
  flex-basis: 0;
  opacity: 0;
  padding: 0;
  pointer-events: none;
}
@media (max-width: 640px) {
  aside {
    .date-box {
      .year {
        font-size: 9px;
      }
      .date {
        font-size: 22px;
      }
    }
    .link {
      padding: 4px 8px;
      .el-badge {
        &::v-deep(sup) {
          display: none;
        }
      }
      .icon {
        width: 28px;
        height: 28px;
      }
      .title {
        display: none;
      }
    }
  }
}
</style>
