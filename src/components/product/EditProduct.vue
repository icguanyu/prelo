<script setup>
import { Products } from "@/api/products";
const uploadPhotos = ref(null);
const editCategoryRef = ref(null);
const selectCategoryRef = ref(null);
const uploadPhotosLoading = computed(
  () => uploadPhotos.value?.isLoading || false,
);
const visible = ref(false);
const emit = defineEmits(["update"]);
const isLoading = ref(false);
const formRef = ref(null);
const rules = {
  name: [{ required: true, message: "請輸入產品名稱", trigger: "blur" }],
  category_id: [{ required: true, message: "請選擇產品類別", trigger: "change" }],
  price: [{ required: true, message: "請輸入產品定價", trigger: "blur" }],
  is_active: [{ required: true, message: "請選擇產品狀態", trigger: "change" }],
};
const form = reactive({
  id: null,
  name: "",
  category_id: "",
  price: 0,
  description: "",
  ingredients: "",
  ingredient_details: [],
  image_urls: [],
  is_active: true,
  is_sliceable: false,
  slice_price: null,
});

const open = (id) => {
  Object.assign(form, {
    id: null,
    name: "",
    category_id: "",
    price: 0,
    description: "",
    ingredients: "",
    ingredient_details: [],
    image_urls: [],
    is_active: true,
    is_sliceable: false,
    slice_price: null,
  });
  nextTick(() => formRef.value?.clearValidate());
  visible.value = true;
  if (id) {
    initProudctById(id);
  }
};

const close = () => {
  visible.value = false;
};

const initProudctById = async (id) => {
  isLoading.value = true;
  try {
    const res = await Products.GetById(id);
    Object.assign(form, res.data);
  } catch (err) {
    console.error("get product by id error", err);
    ElMessage.error("載入商品資料失敗，請稍後再試");
    close();
  } finally {
    isLoading.value = false;
  }
};

const beforeSave = async (formEl) => {
  formEl.validate((valid) => {
    if (valid) {
      save();
    } else {
      return;
    }
  });
};

const handleUpload = (urls) => {
  form.image_urls = urls;
  // if (isLoading.value || uploadPhotosLoading.value) return;
  if (formRef.value?.validate) {
    beforeSave(formRef.value);
  }
};

const save = async () => {
  isLoading.value = true;
  try {
    if (form.id) {
      await Products.Update(form.id, form);
      ElNotification({ title: "成功", message: "商品已更新", type: "success" });
    } else {
      const res = await Products.Create(form);
      form.id = res.data?.id ?? res.data?.data?.id;
      ElNotification({ title: "成功", message: "商品已新增，可繼續上傳圖片", type: "success" });
    }
    emit("update");
  } catch (err) {
    console.error("save product error", err);
    ElMessage.error("儲存失敗，請稍後再試");
  } finally {
    isLoading.value = false;
  }
};

const removeIngredient = (idx) => {
  form.ingredient_details.splice(idx, 1);
};

const deleteProduct = async () => {
  ElMessageBox.confirm("確定要刪除此商品嗎？此操作無法恢復。", "刪除確認", {
    confirmButtonText: "確定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      isLoading.value = true;
      try {
        await Products.Delete(form.id);
        ElNotification({
          title: "成功",
          message: "商品已刪除",
          type: "success",
        });
        close();
        emit("update");
      } catch (err) {
        console.error("delete product error", err);
        ElMessage.error("刪除商品失敗，請稍後再試");
      } finally {
        isLoading.value = false;
      }
    })
    .catch(() => {
      // 使用者取消刪除
    });
};

defineExpose({ open, close });
</script>

<template>
  <EditCategory
    ref="editCategoryRef"
    @close="selectCategoryRef?.refresh()"
  />
  <el-dialog
    v-model="visible"
    :title="form.id ? '編輯商品' : '新增商品'"
    width="640px"
    append-to-body
  >
    <el-form
      :model="form"
      :rules="rules"
      :loading="isLoading"
      ref="formRef"
      label-width="120px"
      label-position="left"
    >
      <el-form-item label="產品名稱" prop="name">
        <el-input v-model="form.name" placeholder="產品名稱（例：原味軟法）" />
      </el-form-item>
      <el-form-item label="產品類別" prop="category_id">
        <SelectCategory
          ref="selectCategoryRef"
          v-model="form.category_id"
          @manage="editCategoryRef?.open()"
        />
      </el-form-item>
      <el-form-item label="產品定價" prop="price">
        <el-input v-model.number="form.price" style="width: 100%" />
      </el-form-item>
      <el-form-item label="產品簡介" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="產品簡短介紹"
        />
      </el-form-item>
      <el-form-item label="成分介紹" prop="ingredients">
        <el-input
          v-model="form.ingredients"
          type="textarea"
          :rows="3"
          placeholder="例如：高筋麵粉、牛奶、酵母、鹽、糖"
        />
      </el-form-item>
      <el-form-item label="可切片" prop="is_sliceable">
        <el-switch v-model="form.is_sliceable" @change="(v) => { if (v) form.slice_price = form.price; else form.slice_price = null }" />
      </el-form-item>
      <el-form-item v-if="form.is_sliceable" label="切片售價" prop="slice_price" :required="form.is_sliceable">
        <el-input v-model.number="form.slice_price" style="width: 100%" placeholder="切片售價(整份)" />
      </el-form-item>
      <el-form-item label="狀態" prop="is_active">
        <SelectProductStatus v-model="form.is_active" :placeholder="'選擇產品狀態'" />
      </el-form-item>
      <el-divider />
      <el-form-item label="商品圖片">
        <UploadPhotos
          ref="uploadPhotos"
          v-model="form.image_urls"
          :disabled="false"
          @upload="handleUpload"
        />
      </el-form-item>
    </el-form>
    <!-- <pre>{{ form }}</pre> -->
    <template #footer>
      <div
        :style="{
          display: 'flex',
          justifyContent: form.id ? 'space-between' : 'center',
          alignItems: 'center',
          width: '100%',
        }"
      >
        <el-button
          v-if="form.id"
          type="danger"
          plain
          @click="deleteProduct"
          :loading="isLoading"
        >
          刪除商品
        </el-button>
        <div>
          <el-button @click="close">取消</el-button>
          <el-button
            type="primary"
            @click="beforeSave(formRef)"
            :loading="isLoading || uploadPhotosLoading"
            >{{
              uploadPhotosLoading ? "上傳中..." : form.id ? "儲存" : "新增"
            }}</el-button
          >
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.photo-gate {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 20px;
  border: 1.5px dashed var(--el-border-color);
  border-radius: 8px;
  color: var(--el-text-color-placeholder);
  text-align: center;

  p {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  small {
    font-size: 12px;
  }
}

.ing-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
  .hint {
    color: #8c939d;
    font-size: 12px;
  }
  .delete-btn {
    cursor: pointer;
    font-size: 14px;
  }
  .ing-add {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.photo-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.image-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  .preview {
    width: 180px;
    height: 120px;
    object-fit: cover;
    display: block;
  }

  .uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 180px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
  }
}
</style>
