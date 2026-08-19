<template>
  <footer class="footer">
    <span class="footer__copy">© {{ year }} Prelo 鋪樂</span>
    <nav class="footer__links">
      <RouterLink to="/">回到首頁</RouterLink>
      <span class="footer__sep" />
      <RouterLink to="/terms">服務條款</RouterLink>
      <span class="footer__sep" />
      <RouterLink to="/privacy">隱私權政策</RouterLink>
      <span class="footer__sep" />
      <a href="https://lin.ee/7cl17b6" target="_blank" rel="noopener" class="footer__line">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.03 2 11c0 3.07 1.6 5.8 4.1 7.57V22l3.27-1.8A11.1 11.1 0 0 0 12 20.5c5.52 0 10-4.03 10-9S17.52 2 12 2Z"/>
        </svg>
        聯繫客服
      </a>
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

.footer__line {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #00b300 !important;

  &:hover {
    color: #009900 !important;
  }

  svg {
    flex-shrink: 0;
  }
}
</style>
