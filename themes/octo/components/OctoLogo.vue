<template>
  <div class="octo-logo" :class="{ dark: isDark }">
    <svg 
      :width="size" 
      :height="size" 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Logo OCTO simplifié -->
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        :fill="isDark ? '#ECEFF4' : '#FF6B35'" 
        stroke="none"
      />
      <text 
        x="50" 
        y="58" 
        text-anchor="middle" 
        :fill="isDark ? '#2E3440' : 'white'" 
        font-family="Outfit, sans-serif" 
        font-weight="700" 
        font-size="24"
      >
        O
      </text>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: [String, Number],
    default: 60
  },
  isDark: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.octo-logo {
  display: inline-block;
  transition: transform 0.2s ease;
}

.octo-logo:hover {
  transform: scale(1.05);
}
</style>