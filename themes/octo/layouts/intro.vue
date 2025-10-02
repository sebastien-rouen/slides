<template>
  <div class="slidev-layout intro">
    <slot />
  </div>
</template>

<style scoped>
.slidev-layout.intro {
  background: var(--octo-surface);
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
}

:deep(h1) {
  font-size: 3.5rem !important;
  color: var(--octo-primary) !important;
  margin-bottom: 1.5rem !important;
  font-weight: 700 !important;
}

:deep(h2) {
  font-size: 1.5rem !important;
  color: var(--octo-text-light) !important;
  margin-bottom: 2rem !important;
  font-weight: 400 !important;
}

:deep(h3) {
  font-size: 1.25rem !important;
  color: var(--octo-accent) !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}

:deep(.subtitle) {
  font-size: 1.25rem;
  color: var(--octo-text-light);
  margin-bottom: 2rem;
  font-weight: 300;
}
</style>