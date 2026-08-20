import { orderStatusOptions } from "./constants";

// ── 星期 ─────────────────────────────────────────────
export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
export const getWeekdayLabel = (n) => WEEKDAY_LABELS[n] ?? n;

// ── 付款方式（統一 lowercase key，consumer 不必在意大小寫）─
const PAYMENT_MAP = {
  cash: "現金",
  linepay: "Line Pay",
  bank: "銀行轉帳",
  card: "信用卡",
};
export const getPaymentLabel = (v) =>
  PAYMENT_MAP[String(v ?? "").toLowerCase()] ?? v ?? "—";

// ── 取貨方式（同上，API 有時傳大寫 "PICKUP" 有時小寫 "pickup"）
const PICKUP_MAP = {
  pickup: "自取",
  delivery: "宅配",
};
export const getPickupLabel = (v) =>
  PICKUP_MAP[String(v ?? "").toLowerCase()] ?? v ?? "—";

// ── 訂單狀態（衍生自 orderStatusOptions，維持單一來源）──
export const getOrderStatusLabel = (v) =>
  orderStatusOptions.find((o) => o.value === v)?.label ?? v;
export const getOrderStatusColor = (v) =>
  orderStatusOptions.find((o) => o.value === v)?.color ?? "";
