<template>
  <div class="slidev-layout two-cols">
    <div class="col-left">
      <slot name="left" />
    </div>
    <div class="col-right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.two-cols {
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
  min-height: 100vh;
  background: var(--octo-background);
}

.col-left,
.col-right {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

:deep(h1) {
  color: var(--octo-primary) !important;
  font-size: 2.5rem !important;
  margin-bottom: 1.5rem !important;
}

:deep(h2) {
  color: var(--octo-secondary) !important;
  font-size: 2rem !important;
  margin-bottom: 1rem !important;
}

:deep(h3) {
  color: var(--octo-accent) !important;
  font-size: 1.5rem !important;
  margin-bottom: 0.75rem !important;
}

@media (max-width: 768px) {
  .slidev-layout.two-cols {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>