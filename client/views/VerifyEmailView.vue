<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <!-- Verifying State -->
      <div v-if="verifying" class="auth-card text-center space-y-6">
        <div class="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-text-primary tracking-tight">Verifying Email</h1>
          <p class="text-sm text-text-muted">Please wait while we validate your credentials...</p>
        </div>
      </div>

      <!-- Success State -->
      <div v-if="verified" class="auth-card text-center space-y-6 animate-fade-in">
        <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-text-primary tracking-tight">Email Verified!</h1>
          <p class="text-sm text-text-muted">Your email has been successfully verified. Welcome to Zyphron Cloud.</p>
        </div>
        <div class="space-y-4 pt-4 border-t border-border">
          <p class="text-label opacity-70">Redirecting to Login...</p>
          <router-link
            to="/login"
            class="btn-primary w-full py-2.5 flex items-center justify-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            Sign In
          </router-link>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="auth-card text-center space-y-6">
        <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-text-primary tracking-tight">Verification Failed</h1>
          <p class="text-sm text-text-muted">{{ errorMessage }}</p>
        </div>
        
        <!-- Resend Section -->
        <div class="pt-4 border-t border-border space-y-4">
          <p class="text-sm text-text-muted">Need a new verification link?</p>
          <div class="space-y-3">
            <input
              v-model="resendEmail"
              type="email"
              placeholder="your-email@example.com"
              class="input-field w-full"
            />
            <button
              @click="handleResend"
              :disabled="resendLoading || cooldown > 0 || !resendEmail"
              class="btn-secondary w-full py-2.5 flex items-center justify-center"
            >
              <svg v-if="!resendLoading" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ resendLoading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Link' }}
            </button>
          </div>
          <p v-if="resendSuccess" class="text-xs text-green-500 font-medium">{{ resendSuccess }}</p>
          <p v-if="resendError" class="text-xs text-red-500 font-medium">{{ resendError }}</p>
        </div>

        <div class="pt-4 border-t border-border">
          <router-link
            to="/login"
            class="btn-primary w-full py-2.5 flex items-center justify-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import client from '../api/client'

const route = useRoute()
const router = useRouter()

const verifying = ref(true)
const verified = ref(false)
const error = ref(false)
const errorMessage = ref('')

// Resend state
const resendEmail = ref('')
const resendLoading = ref(false)
const resendSuccess = ref('')
const resendError = ref('')
const cooldown = ref(0)
let cooldownInterval = null

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    error.value = true
    errorMessage.value = 'No verification token provided. Please click the link from your email.'
    verifying.value = false
    return
  }
  try {
    // Support both GET (query) and POST (body) token passing
    const { data } = await client.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
    if (data.success) {
      verified.value = true
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      error.value = true
      errorMessage.value = data.message || 'Verification failed. The token may be expired.'
    }
  } catch (err) {
    error.value = true
    errorMessage.value = err.response?.data?.message || 'Verification failed. The token may be expired or invalid.'
  } finally {
    verifying.value = false
  }
})

async function handleResend() {
  if (!resendEmail.value || resendLoading.value || cooldown.value > 0) return
  
  resendLoading.value = true
  resendSuccess.value = ''
  resendError.value = ''
  
  try {
    const { data } = await client.post('/auth/resend-verification', { email: resendEmail.value })
    resendSuccess.value = data.message || 'Verification email sent! Check your inbox and spam folder.'
    startCooldown()
  } catch (err) {
    resendError.value = err.response?.data?.message || 'Failed to send verification email. Please try again.'
  } finally {
    resendLoading.value = false
  }
}

function startCooldown() {
  cooldown.value = 60
  cooldownInterval = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})
</script>
