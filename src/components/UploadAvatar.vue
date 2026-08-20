<script setup>
import { ref, watch } from "vue";
import { Users } from "@/api/auth";
import imageCompression from "browser-image-compression";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  disabled: Boolean,
});

const emits = defineEmits(["upload", "delete", "update:modelValue"]);
const isLoading = ref(false);
const image = ref(props.modelValue || "");

const handleImageUpload = async (event) => {
  const imageFile = event.target.files?.[0];
  if (!imageFile) return;

  const options = {
    maxSizeMB: 0.2,
  };
  
  isLoading.value = true;
  try {
    const compressedFile = await imageCompression(imageFile, options);
    const formData = new FormData();
    formData.append("file", compressedFile);
    const res = await Users.UploadAvatar(formData);
    const url = res.data.url;

    if (url) {
      image.value = url;
      emits("update:modelValue", url);
      emits("upload", url);
    }
  } catch (error) {
    console.error("upload avatar error", error);
  } finally {
    isLoading.value = false;
    // 清空 input 以便重複上傳
    event.target.value = "";
  }
};

const handleDelete = () => {
  image.value = "";
  emits("delete", 0);
  emits("update:modelValue", "");
};

// 監聽 props 變化
watch(
  () => props.modelValue,
  (newVal) => {
    image.value = newVal || "";
  },
  { deep: true }
);
</script>

<template>
  <div class="images-uploader">
    <div class="gallery" :class="{ 'has-image': !!image }" v-loading="isLoading">
      <div v-if="image" class="image-item">
        <img :src="image" alt="已上傳圖片" />
        <el-icon class="delete-btn" @click="handleDelete">
          <Delete />
        </el-icon>
      </div>

      <label
        v-else
        for="image-upload"
        :class="{ disabled: isLoading || disabled }"
        class="upload-box"
      >
        <div class="upload-text">
          {{ isLoading ? "上傳中..." : "上傳圖片" }}
        </div>
      </label>
    </div>
    <small class="hint">建議尺寸 600x400，檔案小於 1MB</small>
    <input
      type="file"
      id="image-upload"
      accept=".png,.jpg,.jpeg,.webp"
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
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    .image-item {
      border: 1px solid #e7e7e7;
      position: relative;
      border-radius: 4px;
      overflow: hidden;
      aspect-ratio: 1;
      width: 100%;
      max-width: 220px;
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
      width: 100%;
      max-width: 280px;

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
  }

  .hint {
    text-align: center;
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
      align-items: stretch;
      gap: 10px;

      .image-item,
      .upload-box {
        max-width: 100%;
      }
    }
  }
}
</style>
