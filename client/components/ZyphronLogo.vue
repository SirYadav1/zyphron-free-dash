<template>
  <div :class="compact ? 'flex items-center gap-1.5' : 'flex items-center gap-2.5'">
    <img
      :src="logoSrc"
      :alt="alt"
      :class="sizeClass"
      class="shrink-0"
    />
    <span v-if="showText && !compact" :class="textClass" class="font-bold tracking-tight whitespace-nowrap">
      <template v-if="nameParts.length > 1">{{ nameParts[0] }}<span class="text-accent">.</span>{{ nameParts.slice(1).join(' ') }}</template>
      <template v-else>{{ brand.name }}<span class="text-accent">.</span></template>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBrandingStore } from '../stores/branding'

const props = defineProps({
  size: { type: String, default: 'md' },
  showText: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
  alt: { type: String, default: '' },
})

const brand = useBrandingStore()

const nameParts = computed(() => brand.name.trim().toUpperCase().split(/\s+/).filter(Boolean))
// custom logo only when admin uploaded one via Branding settings
const logoSrc = computed(() => brand.loginImage || '/favicon.png')
const alt = computed(() => props.alt || brand.name)

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
