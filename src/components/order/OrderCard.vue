<script setup>
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { orderStatusOptions } from "@/utils/constants";
import OrderDetail from "./OrderDetail.vue";

const orderDetail = ref(null);

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  items: {
    // 該行程可以下訂的產品
    type: Array,
    required: true,
  },
  viewMode: {
    type: String,
    required: true,
  },
});

const statusOptions = orderStatusOptions;

const emit = defineEmits(["status-change", "update"]);

const getStatusLabel = (status) => {
  const map = {
    PLACED: "已下單",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  };
  return map[status] || status;
};

const getStatusColor = (status) => {
  const option = statusOptions.find((o) => o.value === status);
  return option?.color || "#6b7280";
};

const getPaymentLabel = (payment) => {
  const map = {
    cash: "現金",
    bank: "匯款",
    linepay: "Line Pay",
    card: "信用卡",
  };
  return map[payment] || payment;
};

const isToday = (datetime) => {
  return dayjs(datetime).isSame(dayjs(), "day");
};

const orderNParts = computed(() => {
  const id = props.order?.order_no || "";
  return { prefix: "", lastThree: id };
});

const itemsSummary = computed(() =>
  props.order.items.map((i) => `${i.product_name}×${i.quantity}`).join("、"),
);

const formatPickupTime = (datetime) => {
  if (!datetime) return "-";
  return dayjs(datetime).format("M/D HH:mm");
};

const updateStatus = (status) => {
  emit("status-change", props.order, status);
};

const handleDeleteOrder = () => {
  console.log("delete order!");
  emit("update");
};
</script>

<template>
  <!-- ── Simple mode：橫向 row ─────────────────────────── -->
  <template v-if="viewMode === 'simple'">
    <div
      class="order-card order-row"
      :class="`status-${order.status.toLowerCase()}`"
    >
      <div class="row-bar"></div>
      <div class="row-body">
        <div class="col-order">
          <div class="order-num">
            <span class="num-prefix">{{ orderNParts.prefix }}</span
            ><span class="num-main">{{ orderNParts.lastThree }}</span>
          </div>
          <span
            class="status-chip"
            :style="{ background: getStatusColor(order.status) }"
            >{{ getStatusLabel(order.status) }}</span
          >
        </div>
        <div class="col-customer">
          <div class="customer-name">{{ order.customer_name }}</div>
          <div class="customer-sub">
            {{ order.customer_phone }} · {{ order.pickup_time }}
          </div>
        </div>
        <div class="col-tags">
          <el-tag size="small" type="info">{{
            getPaymentLabel(order.payment_method)
          }}</el-tag>
          <el-tag
            size="small"
            type="success"
            v-if="order.pickup_method === 'pickup'"
            >自取</el-tag
          >
          <el-tag
            size="small"
            type="warning"
            v-if="order.pickup_method === 'delivery'"
            >宅配</el-tag
          >
          <el-tag size="small" type="primary" v-if="order.bring_own_bag"
            >自備袋</el-tag
          >
        </div>
        <div class="col-items">
          <span>{{ itemsSummary }}</span>
          <span v-if="order.note" class="row-note">｜{{ order.note }}</span>
        </div>
        <div class="col-total">{{ $formatPrice(order.total_amount) }}</div>
        <div class="col-actions" @click.stop>
          <el-button
            icon="edit"
            link
            size="small"
            @click="orderDetail.visible = true"
            >詳情</el-button
          >
          <template v-if="order.status === 'PLACED'">
            <el-button size="small" plain @click="updateStatus('CANCELLED')"
              >取消</el-button
            >
            <el-button
              type="success"
              size="small"
              @click="updateStatus('COMPLETED')"
              >✓ 完成</el-button
            >
          </template>
          <el-button
            v-if="order.status === 'COMPLETED' || order.status === 'CANCELLED'"
            plain
            size="small"
            @click="updateStatus('PLACED')"
            >復原</el-button
          >
        </div>
      </div>
    </div>
  </template>

  <!-- ── Detailed mode：垂直卡片 ───────────────────────── -->
  <template v-else>
    <div class="order-card" :class="`status-${order.status.toLowerCase()}`">
      <!-- 狀態色條 -->
      <div class="card-top-bar"></div>

      <!-- 頭部：編號 + 狀態 -->
      <div class="card-header">
        <div class="order-num">
          <span class="num-prefix">{{ orderNParts.prefix }}</span
          ><span class="num-main">{{ orderNParts.lastThree }}</span>
        </div>
        <span
          class="status-chip"
          :style="{ background: getStatusColor(order.status) }"
          >{{ getStatusLabel(order.status) }}</span
        >
      </div>

      <!-- 客戶資訊 -->
      <div class="card-customer">
        <div class="customer-name">{{ order.customer_name }}</div>
        <div v-if="viewMode === 'detailed'" class="customer-meta">
          <span class="meta-item">
            <el-icon><Phone /></el-icon>{{ order.customer_phone }}
          </span>
          <span class="meta-item">
            <el-icon><AlarmClock /></el-icon>{{ order.pickup_time }}
          </span>
        </div>
        <div v-if="viewMode === 'detailed'" class="customer-tags">
          <el-tag size="small" type="info">{{
            getPaymentLabel(order.payment_method)
          }}</el-tag>
          <el-tag
            size="small"
            type="success"
            v-if="order.pickup_method === 'pickup'"
            >自取</el-tag
          >
          <el-tag
            size="small"
            type="warning"
            v-if="order.pickup_method === 'delivery'"
            >宅配</el-tag
          >
          <el-tag size="small" type="primary" v-if="order.bring_own_bag"
            >自備袋</el-tag
          >
        </div>
      </div>

      <!-- 訂購明細 -->
      <div v-if="viewMode === 'detailed'" class="card-items">
        <div class="items-label">
          <span>訂購明細</span>
          <el-button
            type="primary"
            icon="edit"
            link
            size="small"
            @click="orderDetail.visible = true"
          >
            查看詳情
          </el-button>
        </div>
        <div class="items-list">
          <div v-for="(item, idx) in order.items" :key="idx" class="item-row">
            <span class="item-name">
              {{ item.product_name }}
              <el-tag v-if="item.is_sliced" size="small">切</el-tag>
            </span>
            <span class="item-qty">× {{ item.quantity }}</span>
            <span class="item-price">{{ $formatPrice(item.line_total) }}</span>
          </div>
        </div>
      </div>

      <!-- 備註 -->
      <div v-if="viewMode === 'detailed' && order.note" class="card-note">
        <span class="note-label">備註</span>{{ order.note }}
      </div>

      <!-- 底部：總金額 -->
      <div class="card-footer">
        <div class="order-total">
          <span class="total-label">合計</span>
          <span class="total-amount">{{
            $formatPrice(order.total_amount)
          }}</span>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="card-actions" @click.stop>
        <template v-if="order.status === 'PLACED'">
          <el-button
            size="small"
            plain
            class="btn-cancel"
            @click="updateStatus('CANCELLED')"
            >取消</el-button
          >
          <el-button
            type="success"
            class="btn-complete"
            @click="updateStatus('COMPLETED')"
            >✓ 完成取貨</el-button
          >
        </template>
        <el-button
          v-if="order.status === 'COMPLETED' || order.status === 'CANCELLED'"
          plain
          size="small"
          style="flex: 1"
          @click="updateStatus('PLACED')"
          >復原為已下單</el-button
        >
      </div>
    </div>
  </template>

  <!-- 訂購明細模態框（兩種模式共用） -->
  <OrderDetail
    ref="orderDetail"
    :order="order"
    :availableItems="items"
    @delete-order="handleDeleteOrder"
    @update-order="emit('update')"
  />
</template>

<style scoped lang="scss">
$text-primary: #2d1a0e;
$text-secondary: #7a6a5c;
$text-muted: #a09080;
$border: #e8dfd6;
$bg-subtle: #faf7f4;

.order-card {
  position: relative;
  background: white;
  border: 1px solid $border;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 380px;
  height: 100%;
  box-shadow: 0 1px 3px rgba(28, 25, 23, 0.07);
  transition:
    box-shadow 0.2s,
    transform 0.2s;

  &.simple-mode {
    min-height: initial;
  }

  &:hover {
    box-shadow: 0 4px 14px rgba(28, 25, 23, 0.11);
    transform: translateY(-2px);
  }

  // ── 狀態色條 ─────────────────────────────
  .card-top-bar {
    height: 3px;
    flex-shrink: 0;
  }

  &.status-placed .card-top-bar {
    background: var(--color-primary);
  }
  &.status-completed .card-top-bar {
    background: #16a34a;
  }
  &.status-cancelled .card-top-bar {
    background: #d1d5db;
  }

  // ── 頭部：編號 + 狀態 ────────────────────
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px 6px;

    .order-num {
      font-family: "Courier New", monospace;
      font-size: 11px;
      color: $text-muted;
      letter-spacing: 0.3px;

      .num-main {
        color: $text-primary;
        font-weight: 700;
        font-size: 13px;
      }
    }

    .status-chip {
      padding: 3px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      letter-spacing: 0.3px;
    }
  }

  // ── 客戶資訊 ─────────────────────────────
  .card-customer {
    padding: 0px 14px 10px;
    border-bottom: 1px solid $border;

    .customer-name {
      line-height: 18px;
      font-size: 18px;
      font-weight: 700;
      color: $text-primary;
      margin-bottom: 7px;
    }

    .customer-meta {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 5px;

      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: $text-secondary;

        .el-icon {
          font-size: 13px;
          color: $text-muted;
        }
      }
    }

    .customer-tags {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }
  }

  // ── 訂購明細 ─────────────────────────────
  .card-items {
    padding: 10px 14px;
    background: $bg-subtle;
    flex: 1;
    display: flex;
    flex-direction: column;

    .items-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: $text-muted;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 7px;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 150px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 3px;
      }
      &::-webkit-scrollbar-thumb {
        background: $border;
        border-radius: 2px;
      }

      .item-row {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 8px;
        align-items: center;
        font-size: 13px;
        padding: 6px 10px;
        background: white;
        border-radius: 4px;
        border: 1px solid $border;

        .item-name {
          color: $text-primary;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .item-qty {
          color: $text-muted;
          font-size: 12px;
          text-align: center;
          min-width: 32px;
        }

        .item-price {
          color: $text-primary;
          font-weight: 600;
          // font-family: "Courier New", monospace;
          text-align: right;
          min-width: 56px;
        }
      }
    }
  }

  // ── 備註 ─────────────────────────────────
  .card-note {
    padding: 2px 14px 8px;
    font-size: 12px;
    color: $text-muted;
    line-height: 1.5;

    .note-label {
      font-weight: 600;
      margin-right: 4px;
      color: $text-secondary;
    }
  }

  // ── 底部：合計 ───────────────────────────
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-top: 1px solid $border;
    background: white;

    .order-total {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      width: 100%;
      gap: 5px;

      .total-label {
        font-size: 11px;
        color: $text-muted;
        font-weight: 600;
        text-transform: uppercase;
      }

      .total-amount {
        font-size: 20px;
        font-weight: 700;
        color: $text-primary;
        line-height: 1;
      }
    }
  }

  // ── 操作按鈕 ─────────────────────────────
  .card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: $bg-subtle;

    .el-button {
      margin: 0;
    }

    .btn-cancel {
      flex: 1;
      font-size: 13px;
    }

    .btn-complete {
      flex: 2;
      font-size: 14px;
      font-weight: 600;
      height: 36px;
    }
  }
}

// ── Simple mode (order-row) ─────────────────────────────
.order-row {
  min-height: initial;
  flex-direction: row;

  .row-bar {
    width: 4px;
    flex-shrink: 0;
  }

  &.status-placed .row-bar {
    background: var(--color-primary);
  }
  &.status-completed .row-bar {
    background: #16a34a;
  }
  &.status-cancelled .row-bar {
    background: #d1d5db;
  }

  .row-body {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 14px;
    padding: 10px 14px;
    min-width: 0;
  }

  .col-order {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
    min-width: 68px;

    .order-num {
      font-family: "Courier New", monospace;
      font-size: 11px;
      color: $text-muted;
    }
    .num-main {
      color: $text-primary;
      font-weight: 700;
      font-size: 13px;
    }
    .status-chip {
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      white-space: nowrap;
      align-self: flex-start;
    }
  }

  .col-customer {
    flex-shrink: 0;
    min-width: 120px;
    max-width: 180px;

    .customer-name {
      font-size: 15px;
      font-weight: 700;
      color: $text-primary;
    }
    .customer-sub {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 2px;
      white-space: nowrap;
    }
  }

  .col-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .col-items {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: $text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .row-note {
      color: #d97706;
    }
  }

  .col-total {
    font-size: 18px;
    font-weight: 700;
    color: $text-primary;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .col-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;

    .el-button {
      margin: 0;
    }
  }
}

// ── 手機版 simple mode：收成緊湊卡片 ──────────────────────
@media (max-width: 768px) {
  .order-row {
    flex-direction: column;

    .row-bar {
      width: 100%;
      height: 3px;
    }

    .row-body {
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 12px;
    }

    .col-order {
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-width: unset;
      flex: 1;
    }

    .col-customer {
      max-width: unset;
      flex: 1;
      order: -1;
    }

    .col-order {
      order: 0;
    }

    .col-tags {
      width: 100%;
    }

    .col-items {
      width: 100%;
      white-space: normal;
    }

    .col-total {
      font-size: 20px;
    }

    .col-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .order-card {
    min-height: 0;
    height: auto;

    .card-items {
      flex: 0;
    }
  }
}
</style>
