<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Two-Factor Authentication</h2>
      <p class="text-sm text-text-muted">Add an extra layer of security to your account with 2FA.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading...</p>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMsg" class="p-4 bg-green-500/10 border border-green-500/20 rounded-md text-sm font-bold text-green-500">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm font-bold text-red-500">
      {{ errorMsg }}
    </div>

    <!-- 2FA Status Card -->
    <div class="card-surface p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary">
            {{ twoFactorEnabled ? '2FA is Enabled' : '2FA is Disabled' }}
          </h3>
          <p class="text-sm text-text-muted">
            {{ twoFactorEnabled ? 'Your account is protected with two-factor authentication.' : 'Enable 2FA to add extra security to your account.' }}
          </p>
        </div>
        <div :class="twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'" class="w-3 h-3 rounded-full"></div>
      </div>
    </div>

    <!-- Enable 2FA Section -->
    <div v-if="!twoFactorEnabled && !loading" class="card-surface p-6 space-y-6">
      <div class="space-y-1">
        <h3 class="text-lg font-bold text-text-primary">Enable Two-Factor Authentication</h3>
        <p class="text-sm text-text-muted">Follow these steps to enable 2FA on your account.</p>
      </div>

      <!-- Step 1: Generate Secret -->
      <div v-if="!qrCodeUrl" class="space-y-4">
        <p class="text-sm text-text-muted">
          Click the button below to generate a QR code for your authenticator app.
        </p>
        <button
          @click="generateSecret"
          :disabled="generating"
          class="btn-primary px-6 py-2.5"
        >
          {{ generating ? 'Generating...' : 'Generate QR Code' }}
        </button>
      </div>

      <!-- Step 2: Show QR Code and Verify -->
      <div v-else class="space-y-6">
        <div class="space-y-2">
          <p class="text-sm font-bold text-text-primary">Step 1: Scan QR Code</p>
          <p class="text-xs text-text-muted">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div class="flex justify-center p-4 bg-white rounded-lg">
            <img :src="qrCodeUrl" alt="2FA QR Code" class="w-48 h-48" />
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-bold text-text-primary">Step 2: Enter Verification Code</p>
          <p class="text-xs text-text-muted">
            Enter the 6-digit code from your authenticator app to verify setup.
          </p>
          <div class="flex gap-3">
            <input
              v-model="verifyCode"
              type="text"
              maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              class="input-field flex-1"
              placeholder="000000"
              @keyup.enter="enable2FA"
            />
            <button
              @click="enable2FA"
              :disabled="verifyCode.length !== 6 || enabling"
              class="btn-primary px-6"
            >
              {{ enabling ? 'Verifying...' : 'Verify & Enable' }}
            </button>
          </div>
        </div>

        <div class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-xs text-yellow-500">
          <strong>Important:</strong> Save your secret key in a safe place. You'll need it if you lose access to your authenticator app.
        </div>
      </div>
    </div>

    <!-- Disable 2FA Section -->
    <div v-if="twoFactorEnabled && !loading" class="card-surface p-6 space-y-6">
      <div class="space-y-1">
        <h3 class="text-lg font-bold text-text-primary">Disable Two-Factor Authentication</h3>
        <p class="text-sm text-text-muted">Enter your 2FA code to disable authentication.</p>
      </div>

      <div class="space-y-4">
        <div class="flex gap-3">
          <input
            v-model="disableCode"
            type="text"
            maxlength="6"
            pattern="[0-9]*"
            inputmode="numeric"
            class="input-field flex-1"
            placeholder="000000"
            @keyup.enter="disable2FA"
          />
          <button
            @click="disable2FA"
            :disabled="disableCode.length !== 6 || disabling"
            class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ disabling ? 'Disabling...' : 'Disable 2FA' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../api/client'

const loading = ref(true)
const generating = ref(false)
const enabling = ref(false)
const disabling = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const twoFactorEnabled = ref(false)
const qrCodeUrl = ref('')
const verifyCode = ref('')
const disableCode = ref('')

onMounted(async () => {
  await checkStatus()
})

async function checkStatus() {
  loading.value = true
  try {
    const { data } = await client.post('/auth/2fa/status')
    twoFactorEnabled.value = data.enabled
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to check 2FA status'
  } finally {
    loading.value = false
  }
}

async function generateSecret() {
  generating.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const { data } = await client.post('/auth/2fa/generate')
    qrCodeUrl.value = data.otpauthUrl
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to generate QR code'
  } finally {
    generating.value = false
  }
}

async function enable2FA() {
  if (verifyCode.value.length !== 6) return
  enabling.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await client.post('/auth/2fa/enable', { code: verifyCode.value })
    successMsg.value = 'Two-factor authentication enabled successfully!'
    twoFactorEnabled.value = true
    qrCodeUrl.value = ''
    verifyCode.value = ''
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to enable 2FA'
  } finally {
    enabling.value = false
  }
}

async function disable2FA() {
  if (disableCode.value.length !== 6) return
  disabling.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await client.post('/auth/2fa/disable', { code: disableCode.value })
    successMsg.value = 'Two-factor authentication disabled successfully.'
    twoFactorEnabled.value = false
    disableCode.value = ''
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to disable 2FA'
  } finally {
    disabling.value = false
  }
}
</script>
