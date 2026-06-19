<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <div class="flex justify-center mb-4">
        <img src="/login-logo.png" alt="Zyphron Cloud" class="max-h-32 max-w-full rounded-lg object-contain animate-float" />
      </div>
      <div class="text-center space-y-3" style="animation: slideUp 0.5s ease-out 0.1s both;">
        <h1 class="text-2xl font-bold text-text-primary tracking-tight">
          {{ step === 1 ? 'Forgot Password?' : step === 2 ? 'Enter Reset Code' : 'Set New Password' }}
        </h1>
        <p class="text-sm text-text-muted">
          {{ step === 1 ? 'Enter your email and we\'ll send you a reset code.' :
             step === 2 ? 'We sent a 6-digit code to your email.' :
             'Create a new password for your account.' }}
        </p>
      </div>

      <div class="auth-card" style="animation: slideUp 0.5s ease-out 0.2s both;">
        <!-- STEP 1: Enter Email -->
        <form v-if="step === 1" @submit.prevent="sendOtp" class="space-y-6">
          <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle :size="14" :stroke-width="2.5" /> {{ error }}
          </div>
          <div v-if="success" class="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-bold text-green-500 flex items-center gap-2">
            <CheckCircle :size="14" :stroke-width="2.5" /> {{ success }}
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">Email Address</label>
            <input
              v-model="email"
              type="email"
              required
              class="input-field"
              placeholder="you@example.com"
              autofocus
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            {{ loading ? 'Sending...' : 'Send Reset Code' }}
            <Mail v-if="!loading" :size="16" :stroke-width="2.5" />
            <Loader2 v-else :size="16" :stroke-width="2.5" class="animate-spin" />
          </button>
        </form>

        <!-- STEP 2: Enter OTP -->
        <form v-else-if="step === 2" @submit.prevent="verifyOtp" class="space-y-6">
          <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle :size="14" :stroke-width="2.5" /> {{ error }}
          </div>

          <div class="text-center space-y-2">
            <div class="flex justify-center mb-2">
              <div class="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center animate-pulse-glow">
                <KeyRound :size="30" :stroke-width="2" class="text-yellow-500" />
              </div>
            </div>
            <p class="text-sm text-text-muted">Code sent to <strong class="text-text-primary">{{ email }}</strong></p>
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">6-Digit Code</label>
            <input
              v-model="otp"
              type="text"
              maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              required
              class="input-field text-center text-lg tracking-[0.5em]"
              placeholder="000000"
              autofocus
            />
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              @click="goBack"
              class="flex-1 py-2.5 px-4 border border-border rounded-md text-sm font-bold text-text-muted hover:bg-surface transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              :disabled="otp.length !== 6 || loading"
              class="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {{ loading ? 'Verifying...' : 'Verify Code' }}
              <Check v-if="!loading" :size="16" :stroke-width="2.5" />
              <Loader2 v-else :size="16" :stroke-width="2.5" class="animate-spin" />
            </button>
          </div>

          <div class="text-center">
            <button
              type="button"
              @click="resendOtp"
              :disabled="resendCooldown > 0"
              class="text-[11px] font-bold text-accent hover:underline disabled:text-text-muted disabled:no-underline"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code' }}
            </button>
          </div>
        </form>

        <!-- STEP 3: New Password -->
        <form v-else @submit.prevent="resetPassword" class="space-y-6">
          <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle :size="14" :stroke-width="2.5" /> {{ error }}
          </div>
          <div v-if="success" class="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-bold text-green-500 flex items-center gap-2">
            <CheckCircle :size="14" :stroke-width="2.5" /> {{ success }}
          </div>

          <div class="text-center space-y-2">
            <div class="flex justify-center mb-2">
              <div class="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <ShieldCheck :size="30" :stroke-width="2" class="text-green-500" />
              </div>
            </div>
            <p class="text-sm text-text-muted">Create a strong new password for <strong class="text-text-primary">{{ email }}</strong></p>
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">New Password</label>
            <div class="relative">
              <input
                v-model="newPassword"
                :type="showPass ? 'text' : 'password'"
                required
                minlength="6"
                class="input-field pr-10"
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                @click="showPass = !showPass"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <Eye v-if="!showPass" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              class="input-field"
              placeholder="Repeat password"
            />
            <p v-if="confirmPassword && newPassword !== confirmPassword" class="text-[11px] text-red-500 font-bold ml-0.5">
              Passwords don't match
            </p>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              @click="goBack"
              class="flex-1 py-2.5 px-4 border border-border rounded-md text-sm font-bold text-text-muted hover:bg-surface transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              :disabled="!newPassword || newPassword.length < 6 || newPassword !== confirmPassword || loading"
              class="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {{ loading ? 'Updating...' : 'Reset Password' }}
              <Check v-if="!loading" :size="16" :stroke-width="2.5" />
              <Loader2 v-else :size="16" :stroke-width="2.5" class="animate-spin" />
            </button>
          </div>
        </form>

        <div class="mt-8 pt-6 border-t border-border text-center">
          <p class="text-sm text-text-muted font-medium">
            Remember your password?
            <router-link to="/login" class="text-accent font-bold hover:underline">Sign in</router-link>
          </p>
        </div>
      </div>

      <div class="text-center" style="animation: fadeIn 0.6s ease-out 0.5s both;">
        <p class="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">Zyphron Cloud • Client Area</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import client from '../api/client'
import {
  AlertTriangle,
  CheckCircle,
  Mail,
  Loader2,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
} from 'lucide-vue-next'

const router = useRouter()

const step = ref(1)
const email = ref('')
const otp = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPass = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')
const resendCooldown = ref(0)
let cooldownTimer = null

function startCooldown() {
  resendCooldown.value = 60
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownTimer)
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

async function sendOtp() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await client.post('/auth/forgot-password', { email: email.value })
    success.value = data.message || 'Reset code sent! Check your email.'
    startCooldown()
    step.value = 2
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to send reset code. Try again.'
  } finally {
    loading.value = false
  }
}

async function verifyOtp() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await client.post('/auth/verify-reset-otp', {
      email: email.value,
      otp: otp.value,
    })
    resetToken.value = data.reset_token
    step.value = 3
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid code. Try again.'
  } finally {
    loading.value = false
  }
}

async function resetPassword() {
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords don\'t match'
    return
  }
  if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await client.post('/auth/reset-password', {
      email: email.value,
      reset_token: resetToken.value,
      new_password: newPassword.value,
    })
    success.value = data.message || 'Password updated successfully!'
    // show success for 2 seconds then redirect to login
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to reset password. Try again.'
  } finally {
    loading.value = false
  }
}

async function resendOtp() {
  if (resendCooldown.value > 0) return
  loading.value = true
  error.value = ''
  try {
    const { data } = await client.post('/auth/forgot-password', { email: email.value })
    success.value = data.message || 'New code sent!'
    startCooldown()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to resend code.'
  } finally {
    loading.value = false
  }
}

function goBack() {
  error.value = ''
  success.value = ''
  if (step.value > 1) step.value--
}
</script>
