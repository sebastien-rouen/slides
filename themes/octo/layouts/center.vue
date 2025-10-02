<template>
  <div class="slidev-layout center">
    <slot />
  </div>
</template>

<style scoped>
.slidev-layout.center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  min-height: 100vh;
  background: var(--octo-background);
}

:deep(h1) {
  color: var(--octo-primary) !important;
  font-size: 3rem !important;
  font-weight: 700 !important;
  margin-bottom: 1.5rem !important;
}

:deep(h2) {
  color: var(--octo-secondary) !important;
  font-size: 2rem !important;
  font-weight: 500 !important;
  margin-bottom: 1rem !important;
}

:deep(p) {
  color: var(--octo-text-light) !important;
  font-size: 1.25rem !important;
  max-width: 80% !important;
  margin: 0 auto 1rem auto !important;
}

:deep(ul), :deep(ol) {
  text-align: left !important;
  max-width: 80% !important;
  margin: 1rem auto !important;
}
</style>