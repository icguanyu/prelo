<script setup>
import { ProductCategory } from "@/api/products";
const emit = defineEmits(["save", "updated", "close"]);
const isLoading = ref(false);
const visible = ref(false);
const categories = ref([]);

const localCategories = ref([]);

const form = reactive({
  page: null,
  limit: null,
  keyword: "",
});

const newCategory = reactive({
  name: "",
});

const open = () => {
  visible.value = true;
};

const close = () => {
  visible.value = false;
};

const addCategory = async () => {
  isLoading.value = true;
  try {
    const res = await ProductCategory.Create(newCategory);
    ElNotification({
      title: "成功",
      message: "已新增種類",
      type: "success",
    });
    newCategory.name = "";
    await initProductCategories();
    emit("updated");
  } catch (error) {
    console.error("save category error", error);
  } finally {
    isLoading.value = false;
  }
};

const removeCategory = (id) => {
  ElMessageBox.confirm("確定要刪除這個種類嗎？", "警告", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      isLoading.value = true;
      try {
        await ProductCategory.Delete(id);
        ElNotification({
          title: "成功",
          message: "已刪除種類",
          type: "success",
        });
        await initProductCategories();
        emit("updated");
      } catch (error) {
        console.error("delete category error", error);
      } finally {
        isLoading.value = false;
      }
    })
    .catch(() => {
      // 取消刪除
    });
};

const submit = () => {
  emit("save", [...localCategories.value]);
  visible.value = false;
};

defineExpose({ open, close });

const initProductCategories = async () => {
  isLoading.value = true;
  try {
    const res = await ProductCategory.List(form);
    categories.value = res.data.data;
  } catch (err) {
    console.error("fetch categories error", err);
  } finally {
    isLoading.value = false;
  }
};

// mounted(() => {
//   initProductCategories();
// });
</script>

<template>
  <el-dialog
    v-model="visible"
    title="編輯商品種類"
    width="800px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @opened="initProductCategories"
    @closed="emit('close')"
  >
    <div class="layout">
      <section class="list" v-loading="isLoading">
        <header>
          <h3>現有種類</h3>
          <small>若種類被移除，原已存在的商品將被歸類為「未分類」</small>
        </header>
        <div v-if="categories.length" class="chips">
          <div class="chip" v-for="item in categories" :key="item.id">
            <div class="chip__title">{{ item.name }}</div>
            <el-button
              size="small"
              icon="Minus"
              circle
              plain
              @click="removeCategory(item.id)"
            />
          </div>
        </div>

        <el-empty v-else description="目前沒有種類" />
      </section>

      <section class="form">
        <header>
          <h3>新增種類</h3>
          <!-- <small>名稱建議不超過4個字</small> -->
        </header>
        <el-form :model="newCategory" label-width="60px" label-position="top">
          <el-form-item label="名稱" prop="name">
            <el-input v-model="newCategory.name" placeholder="輸入種類名稱" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="addCategory">新增</el-button>
          </el-form-item>
        </el-form>
      </section>
    </div>

    <template #footer>
      <el-button @click="close">返回</el-button>
      <!-- <el-button type="primary" @click="submit" :loading="isLoading"
        >儲存</el-button
      > -->
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

section header {
  display: flex;
  flex-direction: column;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  h3 {
    margin: 0;
    font-weight: 600;
  }
  small {
    color: var(--el-text-color-secondary);
  }
}

.chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  .chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: #f5f5f5;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .chip__title {
      user-select: none;
      font-weight: 600;
    }
  }
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
