<template>
  <span class="octo-badge" :class="[variant, size]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'accent', 'success', 'warning', 'error'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})
</script>

<style scoped>
.octo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* Variants */
.octo-badge.primary {
  background: var(--octo-primary);
  color: white;
}

.octo-badge.secondary {
  background: var(--octo-secondary);
  color: white;
}

.octo-badge.accent {
  background: var(--octo-accent);
  color: white;
}

.octo-badge.success {
  background: var(--octo-success);
  color: white;
}

.octo-badge.warning {
  background: var(--octo-warning);
  color: var(--octo-text);
}

.octo-badge.error {
  background: var(--octo-error);
  color: white;
}

/* Sizes */
.octo-badge.sm {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
}

.octo-badge.md {
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.octo-badge.lg {
  padding: 0.375rem 1rem;
  font-size: 1rem;
}

.octo-badge:hover {
  transform: translateY(-1px);
  box-shadow: var(--octo-shadow);
}
</style>