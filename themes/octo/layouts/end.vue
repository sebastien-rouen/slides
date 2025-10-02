<template>
  <div class="slidev-layout end">
    <div class="end-content">
      <slot />
    </div>
    <div class="contact-info">
      <div class="company">OCTO Technology</div>
      <div class="website">octo.com</div>
    </div>
  </div>
</template>

<style scoped>
.slidev-layout.end {
  background: var(--octo-secondary);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  min-height: 100vh;
  position: relative;
}

.end-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.contact-info {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.company {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--octo-primary);
  margin-bottom: 0.5rem;
}

.website {
  font-size: 1rem;
  opacity: 0.8;
}

:deep(h1) {
  color: var(--octo-primary) !important;
  font-size: 3rem !important;
  margin-bottom: 1rem !important;
  font-weight: 700 !important;
}

:deep(h2) {
  color: white !important;
  font-size: 1.5rem !important;
  margin-bottom: 2rem !important;
  opacity: 0.9 !important;
}

:deep(.thank-you) {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}
</style>