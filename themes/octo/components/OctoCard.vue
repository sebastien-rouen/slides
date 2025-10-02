<template>
  <div class="octo-card" :class="{ elevated: elevated, bordered: bordered }">
    <div v-if="$slots.header" class="octo-card-header">
      <slot name="header" />
    </div>
    <div class="octo-card-content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="octo-card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  elevated: {
    type: Boolean,
    default: false
  },
  bordered: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.octo-card {
  background: var(--octo-surface);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.2s ease;
}

.octo-card.bordered {
  border: 1px solid var(--octo-border);
}

.octo-card.elevated {
  box-shadow: var(--octo-shadow-lg);
}

.octo-card:hover.elevated {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(46, 52, 64, 0.1);
}

.octo-card-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid var(--octo-border-light);
}

.octo-card-content {
  padding: 1.5rem;
}

.octo-card-footer {
  padding: 0 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid var(--octo-border-light);
}

:deep(h3) {
  color: var(--octo-text) !important;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  margin-bottom: 0.5rem !important;
}

:deep(p) {
  color: var(--octo-text-light) !important;
  margin-bottom: 1rem !important;
}

:deep(p:last-child) {
  margin-bottom: 0 !important;
}
</style>