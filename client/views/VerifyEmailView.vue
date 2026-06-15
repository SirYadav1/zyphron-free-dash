<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <div v-if="verifying" class="auth-card text-center space-y-6">
        <div class="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-text-primary tracking-tight">Verifying Email</h1>
          <p class="text-sm text-text-muted">Please wait while we validate your credentials...</p>
        </div>
      </div>

      <div v-if="verified" class="auth-card text-center space-y-6 animate-fade-in">
        <div class="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✨
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-text-primary tracking-tight">Success!</h1>
          <p class="text-sm text-text-muted">Your email has been successfully verified. Welcome to Zyphron.</p>
        </div>
        <div class="space-y-4 pt-4 border-t border-border">
          <p class="text-label opacity-70">Redirecting to Dashboard...</p>
          <router-link
            to="/home"
            class="btn-primary w-full py-2.5 flex items-center justify-center"
          >
            Access Dashboard
          </router-link>
        </div>
      </div>

      <div v-if="error" class="auth-card text-center space-y-6">
        <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
          ⚠️
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-text-primary tracking-tight">Verification Failed</h1>
          <p class="text-sm text-text-muted">{{ errorMessage }}</p>
        </div>
        <div class="pt-4 border-t border-border">
          <router-link
            to="/login"
            class="btn-secondary w-full py-2.5 flex items-center justify-center"
          >
            Return to Login
          </router-link>
        </div>
      </div>
      
      <div class="text-center">
        <p class="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">Protected by Zyphron Security • v4.3.0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'

const route = useRoute()
const router = useRouter()
const store = useAuthStore()

const verifying = ref(true)
const verified = ref(false)
const error = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    error.value = true
    errorMessage.value = 'No verification token provided.'
    verifying.value = false
    return
  }
  try {
    await client.post('/auth/verify-email', { token })
    verified.value = true
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err) {
    error.value = true
    errorMessage.value = err.response?.data?.message || 'Verification failed. The token may be expired.'
  } finally {
    verifying.value = false
  }
})
</script>
