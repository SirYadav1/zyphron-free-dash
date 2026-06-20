<template>
  <div class="min-h-screen bg-[#0a0f1a] relative overflow-hidden">
    <!-- Background Decorations -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/[0.03] rounded-full blur-3xl"></div>

    <div class="relative z-10 app-container py-8 space-y-8">
      <!-- Header -->
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Services</h2>
        <p class="text-sm text-text-muted">Browse available hosting categories and plans.</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 flex items-center gap-3">
        <AlertTriangle :size="16" /> {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading services...</p>
      </div>

      <!-- Categories Grid -->
      <div v-else class="space-y-8">
        <!-- Search -->
        <div class="relative max-w-md">
          <Search :size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400/50" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search services..."
            class="w-full bg-[#0f1729] border border-white/5 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/40 transition-colors"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X :size="16" />
          </button>
        </div>

        <!-- Category Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <router-link
            v-for="(cat, index) in filteredCategories"
            :key="cat.id"
            :to="`/services/${cat.id}`"
            class="group bg-[#0f1729] border border-blue-500/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1"
          >
            <!-- Banner -->
            <div class="relative h-48 overflow-hidden">
              <img v-if="cat.image_url" :src="cat.image_url" :alt="cat.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div v-else class="w-full h-full bg-gradient-to-br from-blue-500/20 to-[#0f1729] flex items-center justify-center">
                <Package :size="48" class="text-blue-400/40" />
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-[#0f1729] via-[#0f1729]/20 to-transparent"></div>
              <!-- Plan Count Badge -->
              <div class="absolute top-4 right-4 bg-blue-900/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-500/20">
                <span class="text-[10px] font-bold text-gray-400 uppercase">{{ cat.product_count || 0 }} Plans</span>
              </div>
            </div>

            <!-- Content -->
            <div class="p-6 -mt-8 relative">
              <h3 class="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{{ cat.name }}</h3>
              <p class="text-sm text-gray-400 leading-relaxed line-clamp-2">{{ cat.description || 'Browse available hosting plans' }}</p>
              <div class="mt-4 flex items-center gap-2 text-blue-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                View Plans
                <ChevronRight :size="16" class="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </router-link>

          <!-- Empty -->
          <div v-if="filteredCategories.length === 0" class="col-span-full py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <SearchX :size="28" class="text-blue-400/50" />
            </div>
            <p class="text-gray-400">No services found{{ searchQuery ? ` for "${searchQuery}"` : '' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../api/client'
import {
  Search, X, SearchX, Package, ChevronRight, AlertTriangle,
} from 'lucide-vue-next'

const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const categories = ref([])

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(c => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
})

onMounted(async () => {
  try {
    const { data } = await client.get('/categories')
    categories.value = Array.isArray(data) ? data : []
  } catch {
    error.value = 'Failed to load services.'
  } finally {
    loading.value = false
  }
})
</script>
