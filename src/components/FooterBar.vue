<template>
  <footer class="footer">
    <span class="footer__copy">© {{ year }} Prelo 鋪樂</span>
    <nav class="footer__links">
      <RouterLink to="/">回到首頁</RouterLink>
      <span class="footer__sep" />
      <RouterLink to="/terms">服務條款</RouterLink>
      <span class="footer__sep" />
      <RouterLink to="/privacy">隱私權政策</RouterLink>
    </nav>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear();
</script>

<style scoped lang="scss">
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  // background: #FFF0EC;
  border-top: 1px solid #E8E3DE;
  gap: 12px;
  flex-wrap: wrap;
}

.footer__copy {
  font-size: 12px;
  color: #A0A0A0 !important;
}

.footer__links {
  display: flex;
  align-items: center;
  gap: 10px;

  a {
    font-size: 12px;
    color: #A0A0A0 !important;
    text-decoration: none;
    transition: color 0.15s;

    &:hover {
      color: var(--color-primary) !important;
    }
  }
}

.footer__sep {
  width: 1px;
  height: 12px;
  background: #E8E3DE;
}
</style>
