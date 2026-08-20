<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Users } from "@/api/auth";
import { ElMessage, ElMessageBox } from "element-plus";
import imageCompression from "browser-image-compression";

const router = useRouter();
const authStore = useAuthStore();
const isLoading = ref(false);

const paymentOptions = [
  { label: "現金", value: "cash" },
  // { label: "Line Pay", value: "linepay" },
  // { label: "銀行轉帳", value: "bank" },
  // { label: "信用卡", value: "card" },
  // { label: "街口支付", value: "jkpay" },
  // { label: "Apple Pay", value: "applepay" },
];

const pickupOptions = [
  { label: "自取/面交", value: "pickup" },
  // { label: "宅配", value: "delivery" },
];

const defaultBusinessHours = [
  { day: 0, enabled: false, time: ["10:00", "16:00"] },
  { day: 1, enabled: false, time: ["09:00", "18:00"] },
  { day: 2, enabled: false, time: ["09:00", "18:00"] },
  { day: 3, enabled: false, time: ["09:00", "18:00"] },
  { day: 4, enabled: false, time: ["09:00", "18:00"] },
  { day: 5, enabled: false, time: ["09:00", "18:00"] },
  { day: 6, enabled: false, time: ["10:00", "16:00"] },
];

const form = reactive({
  avatar: "",
  cover: "",
  shopName: "",
  shopSlug: "",
  owner: "",
  phone: "",
  email: "",
  address: "",
  intro: "",
  orderPickupTime: "14:00",
  paymentMethods: ["cash"],
  pickupMethods: [],
  shipping: {
    freeThreshold: null,
    fee: null,
    note: "",
  },
  packaging: {
    defaultPack: "紙袋",
    packFee: 5,
    ecoDiscount: 10,
    note: "歡迎自備容器，享環保折扣。",
  },
  businessHours: [...defaultBusinessHours],
  lineUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  lineUserId: null,
});

const lineBotUrl = import.meta.env.VITE_LINE_BOT_URL || "https://line.me";

const lineInputId = ref("");
const lineBinding = ref(false);

const handleBindLine = async () => {
  lineBinding.value = true;
  try {
    await Users.BindLine(lineInputId.value.trim());
    form.lineUserId = lineInputId.value.trim();
    lineInputId.value = "";
    ElMessage.success("LINE 通知綁定成功");
  } catch {
    // 錯誤已由 axios interceptor 顯示
  } finally {
    lineBinding.value = false;
  }
};

const handleUnbindLine = async () => {
  try {
    await ElMessageBox.confirm("解除後將不再收到新訂單通知，確定嗎？", "解除 LINE 通知", {
      confirmButtonText: "確定解除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  lineBinding.value = true;
  try {
    await Users.UnbindLine();
    form.lineUserId = null;
    ElMessage.success("已解除 LINE 通知綁定");
  } catch {
    // 錯誤已由 axios interceptor 顯示
  } finally {
    lineBinding.value = false;
  }
};

const coverLoading = ref(false);
const avatarLoading = ref(false);
const coverInput = ref(null);
const avatarInput = ref(null);

const compressAndUpload = async (file, uploadFn) => {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
  });
  const fd = new FormData();
  fd.append("file", compressed);
  const res = await uploadFn(fd);
  return res.data.url;
};

const handleCoverUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  coverLoading.value = true;
  try {
    form.cover = await compressAndUpload(file, Users.UploadCover);
  } catch {
    ElMessage.error("封面上傳失敗");
  } finally {
    coverLoading.value = false;
    e.target.value = "";
  }
};

const handleAvatarUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  avatarLoading.value = true;
  try {
    form.avatar = await compressAndUpload(file, Users.UploadAvatar);
  } catch {
    ElMessage.error("LOGO 上傳失敗");
  } finally {
    avatarLoading.value = false;
    e.target.value = "";
  }
};

const segment = ref("basic");

const slugError = computed(() => {
  const s = form.shopSlug;
  if (!s) return "前台入口網址為必填";
  if (s.length < 2) return "至少需要 2 個字元";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s))
    return "只允許小寫英文、數字，可用連字號(-)，但不能開頭或結尾";
  return "";
});

const slugUrl = computed(() =>
  form.shopSlug ? `${window.location.origin}/s/${form.shopSlug}` : "",
);

const onSlugInput = (val) => {
  form.shopSlug = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
};

const copySlugUrl = () => {
  if (!slugUrl.value) return;
  navigator.clipboard.writeText(slugUrl.value).then(() => {
    ElMessage.success("已複製入口網址");
  });
};

const openSlugUrl = () => {
  if (!slugUrl.value) return;
  window.open(slugUrl.value, "_blank");
};

const dayLabelMap = {
  0: "日",
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
};

const dayNumberMap = {
  日: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
};

const normalizeBusinessHours = (hours) => {
  if (!Array.isArray(hours) || hours.length === 0) {
    return [...defaultBusinessHours];
  }
  return hours.map((row) => {
    const numericDay =
      typeof row.day === "number" ? row.day : dayNumberMap[row.day];
    const normalizedDay =
      Number.isInteger(numericDay) && numericDay >= 0 && numericDay <= 6
        ? numericDay
        : 0;
    return {
      ...row,
      day: normalizedDay,
    };
  });
};

const formatDayLabel = (day) => dayLabelMap[day] ?? day;

// 獲取用戶資訊
const fetchUserData = async () => {
  isLoading.value = true;
  try {
    const res = await Users.Me();
    console.log("user data:", res.data);
    if (res.data) {
      Object.assign(form, res.data);
      form.businessHours = normalizeBusinessHours(res.data.businessHours);
    }
  } catch (error) {
    ElMessage.error("無法載入用戶資訊");
    console.error("fetch user error:", error);
  } finally {
    isLoading.value = false;
  }
};

const toggleAllWeekday = (enabled) => {
  form.businessHours = form.businessHours.map((i) => ({
    ...i,
    enabled,
  }));
};

const handleSave = async () => {
  if (slugError.value) {
    segment.value = "basic";
    ElMessage.error(slugError.value);
    return;
  }
  isLoading.value = true;
  try {
    const payload = {
      ...form,
      businessHours: normalizeBusinessHours(form.businessHours),
    };
    await Users.Put(payload);
    await authStore.fetchUser();
    ElMessage.success("設定已儲存");
  } catch (error) {
    ElMessage.error("儲存設定失敗");
    console.error("save user error:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = () => {
  ElMessageBox.confirm("確定要登出嗎？", "登出確認", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      authStore.logout();
      ElMessage.success("已登出");
      router.push("/");
    })
    .catch(() => {});
};

onMounted(() => {
  fetchUserData();
});
</script>

<template>
  <div class="settings-manager">
    <div class="page-header">
      <div class="header-top">
        <div>
          <h2>設定</h2>
          <p class="subtitle">管理商店基本資訊、付款方式、營業時間與包裝設定</p>
        </div>
        <!-- <div class="header-actions">
          <el-button type="primary" @click="handleSave">儲存設定</el-button>
        </div> -->
      </div>
    </div>
    <div class="segmented">
      <el-segmented
        v-model="segment"
        :options="[
          { label: '01 基本', value: 'basic' },
          { label: '02 取貨付款', value: 'pay' },
          { label: '03 營業時間', value: 'hours' },
          { label: '04 包裝', value: 'pack' },
          { label: '05 通知', value: 'notify' },
        ]"
      />
    </div>
    <el-form label-width="120px" label-position="left">
      <div class="flex flex-col gap-2">
        <el-card class="card" shadow="never" v-show="segment === 'basic'">
          <div class="panel">
            <div class="panel__header">
              <span class="badge">01</span>
              <div>
                <p class="label">品牌</p>
                <h3>商店設定</h3>
              </div>
            </div>
            <small class="hint">請填寫商家基本資料，使用者可於前台查看</small>
          </div>

          <div class="card__subtitle">店面預覽</div>
          <div class="store-preview">
            <!-- 封面 -->
            <div
              class="sp-cover"
              v-loading="coverLoading"
              @click="coverInput.click()"
            >
              <img v-if="form.cover" :src="form.cover" class="sp-cover__img" />
              <div v-else class="sp-cover__empty">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>上傳封面照</span>
              </div>
              <button
                v-if="form.cover"
                class="sp-cover__remove"
                @click.stop="form.cover = ''"
              >
                ×
              </button>
            </div>
            <!-- 頭像 + 店名 -->
            <div class="sp-identity">
              <div
                class="sp-avatar"
                v-loading="avatarLoading"
                @click="avatarInput.click()"
              >
                <img v-if="form.avatar" :src="form.avatar" />
                <span v-else class="sp-avatar__fallback">
                  {{ form.shopName?.[0] ?? "店" }}
                </span>
                <div class="sp-avatar__overlay">
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
                    <path
                      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                    />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <p class="sp-name">{{ form.shopName || "店名" }}</p>
              <p v-if="form.intro" class="sp-intro">{{ form.intro }}</p>
            </div>
          </div>
          <p class="seo-hint">封面與 LOGO 設定後將顯示於搜尋引擎（SEO）</p>
          <input
            ref="coverInput"
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            style="display: none"
            @change="handleCoverUpload"
          />
          <input
            ref="avatarInput"
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            style="display: none"
            @change="handleAvatarUpload"
          />
          <br />
          <div class="card__subtitle">基本資訊</div>
          <el-form-item label="店名">
            <el-input
              v-model="form.shopName"
              placeholder="輸入店名"
              maxlength="20"
              show-word-limit
            />
            <p class="seo-hint">
              作為 SEO 網頁標題（&lt;title&gt;）顯示於搜尋結果
            </p>
          </el-form-item>
          <el-form-item label="負責人">
            <el-input
              v-model="form.owner"
              placeholder="負責人姓名"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="電話">
            <el-input
              v-model="form.phone"
              placeholder="聯絡電話"
              maxlength="10"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="Email">
            <el-input
              v-model="form.email"
              placeholder="聯絡信箱"
              maxlength="50"
              show-word-limit
              disabled
            />
          </el-form-item>
          <el-form-item label="地址">
            <el-input
              v-model="form.address"
              placeholder="門市地址"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="介紹">
            <el-input
              v-model="form.intro"
              type="textarea"
              :rows="3"
              placeholder="品牌故事、主打品項"
              maxlength="200"
              show-word-limit
            />
            <p class="seo-hint">
              作為 SEO 摘要（meta description）顯示於搜尋結果，建議 50–150 字
            </p>
          </el-form-item>

          <el-divider />
          <div class="card__subtitle">社群連結</div>
          <el-form-item label="LINE">
            <el-input
              v-model="form.lineUrl"
              placeholder="https://line.me/..."
              maxlength="200"
            />
          </el-form-item>
          <el-form-item label="Facebook">
            <el-input
              v-model="form.facebookUrl"
              placeholder="https://facebook.com/..."
              maxlength="200"
            />
          </el-form-item>
          <el-form-item label="Instagram">
            <el-input
              v-model="form.instagramUrl"
              placeholder="https://instagram.com/..."
              maxlength="200"
            />
          </el-form-item>

          <el-divider />
          <div class="card__subtitle">前台入口</div>
          <el-form-item label="專屬網址" required>
            <div class="slug-wrap">
              <div class="slug-input-row">
                <span class="slug-prefix">/s/</span>
                <el-input
                  v-model="form.shopSlug"
                  placeholder="your-bakery"
                  maxlength="50"
                  :class="{ 'is-error': slugError }"
                  @input="onSlugInput"
                />
              </div>
            </div>
          </el-form-item>
          <div v-if="slugError" class="slug-msg error">
            <el-icon><Warning /></el-icon>{{ slugError }}
          </div>
          <div v-else-if="form.shopSlug" class="slug-msg preview">
            <el-icon><Link /></el-icon>
            <span class="slug-url">{{ slugUrl }}</span>
            <el-button icon="Share" size="small" @click="copySlugUrl" plain />
            <el-button
              icon="Position"
              size="small"
              @click="openSlugUrl"
              plain
            />
          </div>

          <el-divider />
          <el-form-item label="帳號管理">
            <el-button type="danger" text size="small" @click="handleLogout">
              登出帳號
            </el-button>
          </el-form-item>
        </el-card>
        <el-card class="card" shadow="never" v-show="segment === 'pay'">
          <div class="panel">
            <div class="panel__header">
              <span class="badge">02</span>
              <div>
                <p class="label">取貨與付款</p>
                <h3>支付、取貨</h3>
              </div>
            </div>
            <small class="hint">設定取貨方式與接受的付款方式</small>
          </div>

          <el-form-item label="取貨時間">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div class="flex">
                <el-time-select
                  v-model="form.orderPickupTime"
                  placeholder="開始"
                  start="06:00"
                  step="00:30"
                  end="22:00"
                  :filterable="false"
                  style="width: 120px"
                />
                <span class="white-space-nowrap">後，開放取貨</span>
              </div>
              <small class="hint">若未設定，則開放營業時間內均可取貨</small>
            </div>
          </el-form-item>
          <el-form-item label="付款方式" prop="paymentMethods">
            <el-checkbox-group v-model="form.paymentMethods">
              <el-space wrap>
                <el-checkbox
                  v-for="item in paymentOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  border
                />
              </el-space>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="取貨方式" prop="pickupMethods">
            <el-checkbox-group v-model="form.pickupMethods">
              <el-space wrap>
                <el-checkbox
                  v-for="item in pickupOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  border
                />
              </el-space>
            </el-checkbox-group>
          </el-form-item>

          <div
            v-if="form.pickupMethods.includes('delivery')"
            class="shipping-config"
          >
            <el-form-item label="運費">
              <el-input-number
                v-model="form.shipping.fee"
                :min="0"
                :max="500"
                :precision="0"
              />
              <span class="suffix">元</span>
            </el-form-item>
            <el-form-item label="免運門檻">
              <el-input-number
                v-model="form.shipping.freeThreshold"
                :min="0"
                :max="5000"
                :step="100"
                :precision="0"
              />
              <span class="suffix">元（設 0 = 不提供免運）</span>
            </el-form-item>
            <el-form-item label="備註">
              <el-input
                v-model="form.shipping.note"
                type="textarea"
                :rows="2"
                placeholder="運費說明、配送範圍等"
              />
            </el-form-item>
          </div>
        </el-card>
        <el-card class="card" shadow="never" v-show="segment === 'hours'">
          <div class="panel">
            <div class="panel__header">
              <span class="badge">03</span>
              <div>
                <p class="label">營業</p>
                <h3>營業時間</h3>
              </div>
            </div>
            <small class="hint">門市實際營業時間</small>
          </div>

          <div class="hours-head">
            <span>週一～週日</span>
            <el-space>
              <el-button size="small" text @click="toggleAllWeekday(true)"
                >全開</el-button
              >
              <el-button size="small" text @click="toggleAllWeekday(false)"
                >全關</el-button
              >
            </el-space>
          </div>
          <div class="hours">
            <div
              v-for="(row, idx) in form.businessHours"
              :key="row.day"
              class="hour-row"
            >
              <el-switch v-model="row.enabled" />
              <span class="day">週{{ formatDayLabel(row.day) }}</span>
              <el-time-select
                v-model="row.time[0]"
                :disabled="!row.enabled"
                placeholder="開始"
                start="00:00"
                step="00:30"
                end="23:30"
                :filterable="false"
              />
              <el-time-select
                v-model="row.time[1]"
                :disabled="!row.enabled"
                placeholder="結束"
                start="00:00"
                step="00:30"
                end="23:30"
                :filterable="false"
              />
            </div>
          </div>
        </el-card>
        <el-card class="card" shadow="never" v-show="segment === 'pack'">
          <div class="panel">
            <div class="panel__header">
              <span class="badge">04</span>
              <div>
                <p class="label">包裝</p>
                <h3>包裝設定</h3>
              </div>
            </div>
            <small class="hint">是否提供包裝選項</small>
          </div>

          <el-form-item label="預設包裝">
            <el-input
              v-model="form.packaging.defaultPack"
              placeholder="紙袋/紙盒/裸裝"
            />
          </el-form-item>
          <el-form-item label="包裝費">
            <el-input-number
              v-model="form.packaging.packFee"
              :min="0"
              :max="50"
              :precision="0"
            />
            <span class="suffix">元/單</span>
          </el-form-item>
          <el-form-item label="環保折抵">
            <el-input-number
              v-model="form.packaging.ecoDiscount"
              :min="0"
              :max="50"
              :precision="0"
            />
            <span class="suffix">元/單</span>
          </el-form-item>
          <el-form-item label="備註">
            <el-input
              v-model="form.packaging.note"
              type="textarea"
              :rows="2"
              placeholder="自備餐具優惠、保冷袋租借等"
            />
          </el-form-item>
        </el-card>
        <el-card class="card" shadow="never" v-show="segment === 'notify'">
          <div class="panel">
            <div class="panel__header">
              <span class="badge">05</span>
              <div>
                <p class="label">推播</p>
                <h3>LINE 訂單通知</h3>
              </div>
            </div>
            <small class="hint">新訂單成立時自動推播通知到您的 LINE</small>
          </div>

          <template v-if="form.lineUserId">
            <div class="line-bound">
              <div class="line-bound__status">
                <el-icon :size="18" color="#06C755"><SuccessFilled /></el-icon>
                <span>已連結 LINE 通知</span>
              </div>
              <div class="line-bound__id">User ID：{{ form.lineUserId }}</div>
              <el-button
                type="danger"
                text
                size="small"
                :loading="lineBinding"
                @click="handleUnbindLine"
              >解除綁定</el-button>
            </div>
          </template>

          <template v-else>
            <div class="line-steps">
              <div class="line-step line-step--col">
                <span class="line-step__num">1</span>
                <div class="line-step__content">
                  <span>掃描 QR Code 或點擊按鈕加入好友</span>
                  <div class="line-step__actions">
                    <a
                      :href="lineBotUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="line-add-btn"
                    >
                      <img
                        src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png"
                        alt="加入好友"
                        height="36"
                      />
                    </a>
                    <a :href="lineBotUrl" target="_blank" rel="noopener noreferrer">
                      <img
                        src="@/assets/images/line.png"
                        alt="LINE QR Code"
                        class="line-qr"
                      />
                    </a>
                  </div>
                </div>
              </div>
              <div class="line-step">
                <span class="line-step__num">2</span>
                <span>傳送「<strong>綁定</strong>」給 Bot，Bot 會回覆您的 LINE User ID</span>
              </div>
              <div class="line-step">
                <span class="line-step__num">3</span>
                <span>複製 User ID，貼入下方完成綁定</span>
              </div>
            </div>
            <el-form-item label="LINE User ID">
              <div class="line-input-row">
                <el-input
                  v-model="lineInputId"
                  placeholder="Ue1234567890abcdef1234567890abcd"
                  clearable
                />
                <el-button
                  type="primary"
                  :loading="lineBinding"
                  :disabled="!lineInputId.trim()"
                  @click="handleBindLine"
                >綁定</el-button>
              </div>
            </el-form-item>
          </template>
        </el-card>
      </div>
    </el-form>

    <el-card class="actions" shadow="never">
      <el-button @click="$router.go(-1)">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="isLoading">
        {{ isLoading ? "儲存中..." : "儲存設定" }}
      </el-button>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.settings-manager {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 768px;
}

.page-header {
  background-color: transparent;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;

    .subtitle {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: #909399;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }
  }
}

h2 {
  margin: 0;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-size: 24px;
}

.segmented {
  padding: 6px 0;
  border-radius: 8px;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
  z-index: 2002;
  overflow-x: auto;
  .el-segmented {
    padding: 0 8px;
    background-color: #fff;

    --el-segmented-item-selected-bg-color: var(--color-accent);
    --el-segmented-item-hover-bg-color: var(--color-accent-light);
    --el-segmented-item-active-bg-color: var(--color-accent);
    --el-border-radius-base: 8px;
  }
}

.el-card {
  border-radius: 0;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;

  :deep(.el-card__body) {
    background: transparent;
  }
}
.panel {
  margin-bottom: 16px;
  .panel__header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
    .badge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--color-accent);
      color: white;
      font-weight: 700;
      font-size: 14px;
    }

    h3 {
      margin: 0;
      font-size: 18px;
      line-height: 20px;
      white-space: nowrap;
    }
    .label {
      margin: 0;
      font-size: 12px;
      color: #748096;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  }
  .hint {
    color: var(--el-text-color-secondary);
    display: block;
    margin-bottom: 8px;
    margin-left: auto;
  }
}

.shipping-config {
  margin-top: 12px;
}

.card__subtitle {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
  margin-top: 24px;
  margin-bottom: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--bg-page-alt);
}

/* ── 店面預覽 ── */
.store-preview {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.sp-cover {
  height: 140px;
  background: linear-gradient(160deg, #e0e0e0 0%, #c8c8c8 55%, #b0b0b0 100%);
  position: relative;
  cursor: pointer;
  overflow: hidden;

  &:hover .sp-cover__empty {
    opacity: 1;
  }
  &:hover::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.15);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    opacity: 0.6;
    transition: opacity 0.15s;
    z-index: 1;
  }

  &__remove {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(0, 0, 0, 0.7);
    }
  }
}

.sp-identity {
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px 20px;
  text-align: center;
  margin-top: -48px;
}

.sp-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  background: linear-gradient(160deg, #e0e0e0 0%, #c8c8c8 55%, #b0b0b0 100%);
  cursor: pointer;
  position: relative;
  z-index: 2001;
  margin-bottom: 8px;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
    color: #7a4f00;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    opacity: 0;
    transition: opacity 0.15s;
  }

  &:hover &__overlay {
    opacity: 1;
  }
}

.sp-name {
  font-size: 16px;
  font-weight: 900;
  color: #1a120b;
  margin: 0 0 4px;
  font-family: "Noto Serif TC", serif;
  letter-spacing: 0.06em;
}

.sp-intro {
  font-size: 12px;
  color: #5c4b3e;
  margin: 0;
  line-height: 1.5;
  max-width: 280px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.seo-hint {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.5;
  &::before {
    content: "提示：";
  }
}

.suffix {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.hours-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
}

.hours {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hour-row {
  display: grid;
  grid-template-columns: auto 48px 1fr 1fr;
  align-items: center;
  gap: 8px;
}

.day {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.slug-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slug-input-row {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: var(--el-color-primary);
  }

  .slug-prefix {
    padding: 0 10px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 13px;
    white-space: nowrap;
    border-right: 1px solid var(--el-border-color);
    line-height: 30px;
    height: 32px;
    display: flex;
    align-items: center;
  }

  .el-input {
    flex: 1;
    :deep(.el-input__wrapper) {
      border: none;
      box-shadow: none !important;
      border-radius: 0;
    }
  }
}

.slug-msg {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  .el-button {
    margin-left: 0px;
  }
  .el-icon {
    font-size: 13px;
    flex-shrink: 0;
  }

  &.error {
    color: var(--el-color-danger);
  }
  &.preview {
    color: var(--el-text-color-secondary);
  }
  &.hint {
    color: var(--el-text-color-placeholder);
  }

  .slug-url {
    font-family: monospace;
    font-size: 12px;
    line-height: 14px;
    color: #000;
    word-break: break-all;
  }
}

.line-bound {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #f0fff5;
  border-radius: 8px;
  border: 1px solid #06c755;

  &__status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #06c755;
  }

  &__id {
    font-size: 13px;
    font-family: monospace;
    color: var(--el-text-color-secondary);
    word-break: break-all;
  }
}

.line-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.line-step {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--el-text-color-primary);

  &--col {
    align-items: flex-start;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__num {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #06c755;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.line-add-btn {
  display: inline-flex;
  img {
    display: block;
    border-radius: 4px;
  }
}

.line-qr {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  display: block;
}

.line-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.actions {
  background: transparent;
  border-top: 1px solid var(--bg-page-alt) !important;
  border-radius: 0 !important;
  display: flex;
  gap: 12px;
  padding-top: 16px;
}

@media (max-width: 640px) {
  .settings-manager {
    padding: 10px 4%;
  }

  .page-header {
    .header-top {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
