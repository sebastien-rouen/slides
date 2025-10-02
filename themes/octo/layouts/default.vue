<template>
  <div class="slidev-layout default">
    <slot />
  </div>
</template>

<style scoped>
.slidev-layout.default {
  padding: 2rem;
  background: var(--octo-background);
  color: var(--octo-text);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
}
</style>