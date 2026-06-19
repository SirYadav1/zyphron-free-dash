<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <div class="text-center space-y-3">
        <div class="flex justify-center mb-2">
          <ZyphronLogo size="lg" />
        </div>
        <h1 class="text-2xl font-bold text-text-primary tracking-tight">Create your account</h1>
        <p class="text-sm text-text-muted">Get free server hosting on Zyphron Cloud.</p>
      </div>

      <div class="auth-card">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div v-if="store.error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <span>⚠️</span> {{ store.error }}
          </div>

          <div v-if="success" class="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-bold text-green-400 flex items-center gap-2">
            <span>✅</span> {{ success }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="firstName" class="text-label ml-0.5">First Name</label>
              <input
                id="firstName"
                v-model="firstName"
                type="text"
                class="input-field"
                placeholder="John"
              />
            </div>
            <div class="space-y-1.5">
              <label for="lastName" class="text-label ml-0.5">Last Name</label>
              <input
                id="lastName"
                v-model="lastName"
                type="text"
                class="input-field"
                placeholder="Doe"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="username" class="text-label ml-0.5">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="input-field"
              placeholder="Pick a username"
            />
          </div>

          <div class="space-y-1.5">
            <label for="email" class="text-label ml-0.5">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div class="space-y-1.5">
            <label for="password" class="text-label ml-0.5">Password</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="input-field w-full pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="confirmPassword" class="text-label ml-0.5">Confirm Password</label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                class="input-field w-full pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <svg v-if="!showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
            <p v-if="passwordMismatch" class="text-[10px] font-bold text-red-400 mt-1 ml-1 uppercase">Passwords do not match</p>
          </div>

          <button
            type="submit"
            :disabled="store.loading || passwordMismatch"
            class="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            {{ store.loading ? 'Creating Account...' : 'Initialize Account' }}
            <svg v-if="!store.loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-border text-center">
          <p class="text-sm text-text-muted font-medium">
            Already have an account? 
            <router-link to="/login" class="text-accent font-bold hover:underline">Sign In</router-link>
          </p>
        </div>
      </div>
      
      <div class="text-center">
        <p class="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">Zyphron Cloud • Client Area</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ZyphronLogo from '../components/ZyphronLogo.vue'

const router = useRouter()
const store = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const success = ref('')

const passwordMismatch = computed(() => {
  return confirmPassword.value.length > 0 && password.value !== confirmPassword.value
})

async function handleRegister() {
  if (passwordMismatch.value) return
  try {
    const result = await store.register(username.value, email.value, password.value, firstName.value, lastName.value)
    if (result.access_token) {
      localStorage.setItem('access_token', result.access_token)
    }
    await store.fetchProfile()
    router.push('/home')
  } catch {
    // Error is handled in the store
  }
}
</script>
