<script setup>
import { UploadFile } from "@/api/products";
import imageCompression from "browser-image-compression";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  disabled: Boolean,
  max: {
    type: Number,
    default: 3,
  },
});

const emits = defineEmits(["upload", "delete", "update:modelValue"]);
const isLoading = ref(false);
const images = ref([...props.modelValue]);

const preview = async (e) => {
  const files = Array.from(e.target.files);
  const currentCount = images.value.length;
  const canAdd = Math.min(files.length, props.max - currentCount);

  if (canAdd === 0) {
    ElMessage.warning(`最多只能上傳 ${props.max} 張圖片`);
    return;
  }

  const newFiles = files.slice(0, canAdd);

  newFiles.forEach((file) => {
    const previewUrl = URL.createObjectURL(file);
    images.value.push(previewUrl);
    emits("upload", previewUrl);
  });

  // 更新 v-model
  emits("update:modelValue", images.value);

  // 清空 input 以便重複上傳
  e.target.value = "";

  if (canAdd < files.length) {
    ElMessage.info(`已達上傳上限，共上傳 ${canAdd} 張`);
  }
};

const handleImageUpload = async (event) => {
  const imageFile = event.target.files[0];
  const options = {
    maxSizeMB: 0.2,
  };
  isLoading.value = true;
  try {
    const compressedFile = await imageCompression(imageFile, options);
    const formData = new FormData();
    formData.append("file", compressedFile);
    const res = await UploadFile.Upload(formData);
    const url = res.data.url;
    if (url) {
      images.value.push(url);
      emits("update:modelValue", images.value);
      emits("upload", images.value);
    }
  } catch (error) {
    console.error("upload photo error", error);
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = (index) => {
  images.value.splice(index, 1);
  emits("delete", index);
  emits("update:modelValue", images.value);
};

// 監聽 props 變化
watch(
  () => props.modelValue,
  (newVal) => {
    images.value = [...newVal];
  },
  { deep: true },
);

const canUpload = computed(() => images.value.length < props.max);

defineExpose({
  isLoading,
});
</script>

<template>
  <div class="images-uploader">
    <div
      class="gallery"
      :class="{ 'has-images': images.length > 0 }"
      v-loading="isLoading"
    >
      <div v-for="(url, index) in images" :key="index" class="image-item">
        <img :src="url" :alt="`圖片 ${index + 1}`" />

        <el-icon class="delete-btn" @click="handleDelete(index)">
          <Delete />
        </el-icon>
      </div>

      <label
        v-if="canUpload"
        for="image-upload"
        :class="{ disabled: isLoading || disabled }"
        class="upload-box"
      >
        <div class="upload-text">
          {{ isLoading ? "上傳中..." : "上傳圖片" }}
        </div>
        <small>{{ images.length }}/{{ max }}</small>
      </label>
    </div>
    <small class="hint"
      >第一張圖片即為封面圖；建議尺寸 600x400，檔案小於 1MB，最多 {{ max }} 張</small
    >
    <input
      type="file"
      id="image-upload"
      accept=".png,.jpg,.jpeg,.webp"
      multiple
      @change="handleImageUpload"
    />
  </div>
</template>

<style lang="scss" scoped>
.images-uploader {
  input {
    display: none;
  }
  .gallery {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .image-item {
    border: 1px solid #e7e7e7;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    aspect-ratio: 1;
    background-color: #f0f0f0;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn {
      cursor: pointer;
      background-color: rgba(white, 0.7);
      font-size: 24px;
      padding: 4px;
      border-radius: 3px;
      position: absolute;
      z-index: 1;
      bottom: 0;
      right: 5px;
      top: 5px;
      color: rgb(255, 68, 43);
      &:hover {
        background-color: rgba(white, 0.9);
      }
    }
  }

  .upload-box {
    aspect-ratio: 1;
    display: flex;
    line-height: 1.4rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: #fafafa;

    &:hover:not(.disabled) {
      border-color: var(--el-color-primary);
      background-color: #f5f7fa;
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .upload-text {
      color: #999;
      font-weight: 500;
    }

    small {
      font-size: 10px;
      color: #ccc;
    }
  }
  .hint {
    display: block;
    line-height: 1rem;
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}
@media (max-width: 640px) {
  .images-uploader {
    .gallery {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
  }
}
</style>
