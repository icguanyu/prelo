<script setup>
import { ProductCategory, Products } from "@/api/products";
import { reactive } from "vue";
const editCategory = ref();
const editProduct = ref();
const currentCategory = ref(null);
const loading = ref(false);
const showTour = ref(false);
const TOUR_KEY = "products_category_tour_done";
const props = {
  label: "name",
  value: "id",
};
const form = reactive({
  page: null,
  limit: null,
  keyword: "",
  category_id: null, // 暫時不須透過分類搜尋，撈出全部即可
});
const categories = ref([{ name: "全部", id: null }]);
const products = ref([]);

const hasNoCategory = computed(
  () => !loading.value && categories.value.length <= 1,
);

const filteredProducts = computed(() => {
  if (currentCategory.value === null) return products.value;
  return products.value.filter(
    (item) => item.category_id === currentCategory.value,
  );
});

const initProductCategories = async () => {
  loading.value = true;
  try {
    const res = await ProductCategory.List();
    // console.log("product categories", res);
    categories.value = [{ name: "全部", id: null }, ...res.data.data];
    if (res.data.data.length === 0 && !localStorage.getItem(TOUR_KEY)) {
      showTour.value = true;
    }
  } catch (error) {
    console.log("catch", error);
  } finally {
    loading.value = false;
  }
};

const onTourFinish = () => {
  localStorage.setItem(TOUR_KEY, "1");
};

const handleAddProduct = () => {
  if (hasNoCategory.value) {
    ElMessageBox.confirm(
      "新增產品前，請先建立至少一個產品種類。",
      "尚未建立種類",
      {
        confirmButtonText: "去建立種類",
        cancelButtonText: "取消",
        type: "warning",
      },
    )
      .then(() => editCategory.value.open())
      .catch(() => {});
    return;
  }
  editProduct.value.open();
};

const initProducts = async () => {
  loading.value = true;
  try {
    const res = await Products.List();
    console.log("products", res);
    products.value = res.data.data;
  } catch (error) {
    console.log("catch", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  initProductCategories();
  initProducts();
});
</script>

<template>
  <div class="products-manager">
    <!-- 頂部標題 -->
    <div class="page-header">
      <div class="header-top">
        <div>
          <h2>產品管理</h2>
          <p class="subtitle">管理麵包產品資訊，快速編輯與分類</p>
        </div>
        <el-button type="primary" icon="Plus" @click="handleAddProduct">
          新增產品
        </el-button>
      </div>
    </div>

    <EditCategory ref="editCategory" @updated="initProductCategories" />
    <EditProduct ref="editProduct" @update="initProducts" />

    <el-tour
      v-model="showTour"
      @finish="onTourFinish"
      @close="onTourFinish"
    >
      <el-tour-step
        target="#category-setting-btn"
        title="先建立產品種類"
        description="新增產品前，請先點擊這裡建立種類，才能在產品中選擇分類。"
        :next-button-props="{ children: '好，去建立' }"
      />
    </el-tour>
    <div class="toolbar">
      <div class="category-tags" v-loading="loading">
        <div
          v-if="loading && categories.length <= 1"
          class="toolbar-skeleton"
          aria-hidden="true"
        ></div>
        <button
          v-else
          v-for="cat in categories"
          :key="cat.id"
          class="cat-tag"
          :class="{ active: currentCategory === cat.id }"
          @click="currentCategory = cat.id"
        >
          {{ cat.name }}
        </button>
      </div>
      <el-button
        id="category-setting-btn"
        icon="setting"
        text
        @click="editCategory.open()"
      >編輯</el-button>
    </div>

    <el-alert
      v-if="hasNoCategory"
      type="warning"
      :closable="false"
      show-icon
      title="尚未建立任何產品種類"
    >
      <template #default>
        新增產品前請先建立種類，才能在產品中選擇分類。
        <el-button link type="warning" @click="editCategory.open()">
          立即建立 →
        </el-button>
      </template>
    </el-alert>

    <div class="columns-2">
      <div class="card" v-for="item in filteredProducts" :key="item.id">
        <div class="thumb" :class="{ disabled: !item.is_active }">
          <img v-if="item.image_url" :src="item.image_url" :alt="item.name" />
          <div v-else class="image-placeholder">
            <span>No Image</span>
          </div>
          <div v-if="!item.is_active" class="overlay">下架</div>
          <div class="category">{{ item.category_name }}</div>
        </div>
        <div class="info">
          <div class="title">
            <span class="text-ellipsis-2">{{ item.name }}</span>
            <el-icon @click="editProduct.open(item.id)"><MoreFilled /></el-icon>
          </div>
          <p class="description text-ellipsis-2">{{ item.description }}</p>
          <div class="price-row">
            <span class="price">${{ item.price }}</span>
            <span v-if="item.is_sliceable && item.slice_price" class="slice-price">切片 ${{ item.slice_price }}</span>
          </div>
        </div>
      </div>
    </div>
    <el-empty
      v-if="filteredProducts.length === 0"
      description="沒有符合條件的產品"
    ></el-empty>

    <!-- <div class="new-product flex justify-end">
      <el-button
        type="primary"
        circle
        icon="plus"
        size="large"
        plain
        @click="editProduct?.open()"
      />
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/scrollbar.scss" as *;

.products-manager {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  margin-bottom: 8px;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;

    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
  }
}

.toolbar {
  padding: 6px 0;
  border-radius: 8px;
  background-color: #fff;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 16px;
  z-index: 10;
  padding: 8px 8px 8px 12px;

  .category-tags {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 36px;
    align-items: center;
  }

  .toolbar-skeleton {
    flex: 1;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(90deg, #faf7f4 0%, #ede7df 50%, #faf7f4 100%);
    background-size: 200% 100%;
    animation: toolbar-shimmer 1.2s ease-in-out infinite;
  }

  .cat-tag {
    padding: 5px 14px;
    border-radius: 6px;
    border: 1px solid #e0d5cc;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
    color: #4a3f38;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    white-space: nowrap;

    &:hover {
      background: #f1e9e6;
      border-color: #c8b8b0;
    }

    &.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
      font-weight: 600;
    }
  }

  .el-button {
    flex-shrink: 0;
    align-self: center;
  }
}

@keyframes toolbar-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.card {
  overflow: hidden;
  display: flex;
  background-color: #fff;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 8px;
  gap: 16px;
  transition: box-shadow 0.3s ease;
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    .thumb {
      img {
        transform: scale(1.1);
      }
    }
  }
  .thumb {
    flex-shrink: 0;
    width: 160px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .image-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #94a3b8;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);

      span {
        font-weight: 500;
      }
    }
    &.disabled {
      filter: grayscale(0.8) brightness(1) opacity(0.7);
    }
    .category {
      position: absolute;
      bottom: 8px;
      left: 8px;
      padding: 4px 8px;
      background-color: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 12px;
      border-radius: 4px;
    }
    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 800;
      font-style: italic;
      color: rgba(255, 255, 255, 0.5);
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
      letter-spacing: 4px;
      filter: invert(1);
      pointer-events: none;
    }
  }
  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    .title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.125rem;
      font-weight: 600;
      gap: 8px;
      color: var(--el-text-color-primary);
      .el-icon {
        font-size: 20px;
        cursor: pointer;
      }
    }
    .description {
      margin: 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
      line-height: 1.4;
    }

    .price-row {
      margin-top: auto;
      display: flex;
      align-items: baseline;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
    }
    .price {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f345f;
    }
    .slice-price {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--el-text-color-secondary);
    }
  }
}

.new-product {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 20;
  padding-bottom: 16px; /* 基礎邊距 */
  padding-bottom: max(16px, env(safe-area-inset-bottom)); /* 增強 */
}

@media (max-width: 640px) {
  .products-manager {
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

  .page {
    padding: 12px;
  }
  .card {
    gap: 12px;
    transition: box-shadow 0.3s ease;
    .thumb {
      width: 140px;
      height: 100px;
      .category {
        bottom: 4px;
        left: 4px;
        padding: 2px 4px;
      }
    }
    .info {
      .description {
        font-size: 12px;
        line-height: 1.2;
      }
    }
  }
}
</style>
