<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <div class="text-center space-y-2">
        <div class="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-text-primary tracking-tight">Verify Your Email</h1>
        <p class="text-sm text-text-muted">
          We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.
        </p>
      </div>

      <div class="auth-card">
        <div class="space-y-6">
          <!-- Success Message -->
          <div v-if="resent" class="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-bold text-green-500 flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ resentMessage }}
          </div>

          <!-- Error Message -->
          <div v-if="resendError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ resendError }}
          </div>

          <!-- Email Input -->
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="email" class="text-label ml-0.5">Email Address</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="your-email@example.com"
                class="input-field"
                @keyup.enter="handleResend"
              />
            </div>
            
            <button
              @click="handleResend"
              :disabled="loading || cooldown > 0 || !email"
              class="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              <svg v-if="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Link' }}
            </button>
          </div>

          <!-- Tips -->
          <div class="p-3 bg-surface/50 rounded-md text-xs text-text-muted space-y-1.5">
            <p class="font-bold text-text-secondary">Can't find the email?</p>
            <ul class="list-disc list-inside space-y-1 ml-1">
              <li>Check your <strong>Spam/Junk</strong> folder</li>
              <li>Check your <strong>Promotions</strong> tab (Gmail)</li>
              <li>Make sure <strong>{{ email || 'your email' }}</strong> is correct</li>
              <li>The email is sent from <strong>noreply@your-domain.com</strong></li>
            </ul>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-border text-center">
          <p class="text-sm text-text-muted font-medium">
            Already verified?
            <router-link to="/login" class="text-accent font-bold hover:underline">Sign In</router-link>
          </p>
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
import { useRoute } from 'vue-router'
import client from '../api/client'

const route = useRoute()

const email = ref('')
const loading = ref(false)
const resent = ref(false)
const resentMessage = ref('')
const resendError = ref('')
const cooldown = ref(0)
let cooldownInterval = null

// pre-fill email from query parameter
onMounted(() => {
  if (route.query.email) {
    email.value = route.query.email
  } else {
    const storedEmail = sessionStorage.getItem('verify_email')
    if (storedEmail) {
      email.value = storedEmail
    }
  }
})

async function handleResend() {
  if (!email.value || loading.value || cooldown.value > 0) return
  
  loading.value = true
  resent.value = false
  resendError.value = ''
  
  try {
    const { data } = await client.post('/auth/resend-verification', { email: email.value })
    resent.value = true
    resentMessage.value = data.message || 'Verification email sent! Check your inbox and spam folder.'
    startCooldown()
  } catch (err) {
    resendError.value = err.response?.data?.message || 'Failed to send verification email. Please try again.'
  } finally {
    loading.value = false
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
