<template>
  <div :class="compact ? 'flex items-center gap-1.5' : 'flex items-center gap-2.5'">
    <img
      src="/favicon.png"
      :alt="alt"
      :class="sizeClass"
      class="shrink-0"
    />
    <span v-if="showText && !compact" :class="textClass" class="font-bold tracking-tight">
      ZYPHRON<span class="text-accent">.</span>CLOUD
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'md' },
  showText: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
  alt: { type: String, default: 'Zyphron Cloud' },
})

const sizeClass = computed(() => ({
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}[props.size] || 'w-8 h-8'))

const textClass = computed(() => ({
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
}[props.size] || 'text-lg'))
</script>
