<template>
  <div class="slidev-layout section">
    <slot />
  </div>
</template>

<style scoped>
.slidev-layout.section {
  background: linear-gradient(45deg, var(--octo-secondary) 0%, var(--octo-primary) 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  min-height: 100vh;
}

:deep(h1) {
  color: white !important;
  font-size: 3rem !important;
  font-weight: 600 !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
  margin-bottom: 1rem !important;
}

:deep(h2) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 1.5rem !important;
  font-weight: 400 !important;
  margin-bottom: 2rem !important;
}

:deep(p) {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 1.125rem !important;
  max-width: 80% !important;
  margin: 0 auto !important;
}
</style>