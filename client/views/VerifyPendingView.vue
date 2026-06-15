<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <div class="text-center space-y-2">
        <div class="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
          📧
        </div>
        <h1 class="text-2xl font-bold text-text-primary tracking-tight">Verify Email</h1>
        <p class="text-sm text-text-muted">
          We've dispatched a secure verification link to your inbox. Please validate your identity to continue.
        </p>
      </div>

      <div class="auth-card">
        <div class="space-y-6">
          <div v-if="resent" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">
            ✅ Verification email successfully redistributed!
          </div>

          <div v-if="store.error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">
            ⚠️ {{ store.error }}
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label for="email" class="text-label ml-0.5">Resend to Address</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="your-email@example.com"
                class="input-field"
              />
            </div>
            <button
              @click="handleResend"
              :disabled="store.loading || !email"
              class="btn-primary w-full py-2.5"
            >
              {{ store.loading ? 'Redistributing...' : 'Resend Verification Link' }}
            </button>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-border text-center">
          <p class="text-sm text-text-muted font-medium">
            Verified already? 
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
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const store = useAuthStore()
const email = ref('')
const resent = ref(false)

async function handleResend() {
  if (!email.value) return
  try {
    await store.resendVerification(email.value)
    resent.value = true
    setTimeout(() => {
      resent.value = false
    }, 5000)
  } catch {
    // Error handled in store
  }
}
</script>
