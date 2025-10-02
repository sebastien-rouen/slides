<template>
  <div class="slidev-layout cover-gradient">
    <div class="cover-content">
      <slot />
    </div>
    <div class="cover-footer">
      <div class="date-info">
        {{ formatDate() }}
      </div>
      <div class="company-info">
        OCTO TECHNOLOGY
      </div>
    </div>
  </div>
</template>

<script setup>
const formatDate = () => {
  return new Date().toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit' 
  }).replace(/\//g, '.')
}
</script>

<style scoped>
.slidev-layout.cover-gradient {
  background: linear-gradient(135deg, var(--octo-primary) 0%, var(--octo-accent) 100%);
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

.cover-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 2;
}

.cover-footer {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 2;
}

.date-info {
  font-size: 1.25rem;
  font-weight: 700;
  opacity: 0.9;
}

.company-info {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.8;
  letter-spacing: 0.1em;
}

:deep(h1) {
  color: white !important;
  font-size: 4rem !important;
  font-weight: 700 !important;
  margin-bottom: 1rem !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
}

:deep(h2) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 1.5rem !important;
  font-weight: 400 !important;
  margin-bottom: 2rem !important;
}

:deep(h3) {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 1.25rem !important;
  font-weight: 300 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
}
</style>