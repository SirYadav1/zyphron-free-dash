<template>
  <div class="max-w-3xl mx-auto space-y-10">
    <!-- Header -->
    <div class="space-y-1">
      <router-link to="/store" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Coin Shop</router-link>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Complete Your Order</h2>
      <p class="text-sm text-text-muted">Scan the QR code or use the payment details below</p>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold flex items-center gap-3">
      <span>⚠️</span> {{ error }}
    </div>
    <div v-if="success" class="card-surface p-4 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-sm font-bold flex items-center gap-3">
      <span>✅</span> {{ success }}
    </div>

    <!-- Success Toast/Popup -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="showSuccessPopup" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4">
          <div class="card-surface w-full max-w-md p-8 text-center space-y-6 shadow-2xl border border-accent/20">
            <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-text-primary">Screenshot Uploaded! 🎉</h3>
              <p class="text-sm text-text-muted mt-2">Your payment screenshot has been submitted successfully. Redirecting to your order status page...</p>
            </div>
            <div class="flex justify-center">
              <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Creating Order...</p>
    </div>

    <!-- Order Content -->
    <template v-if="order">
      <!-- Order Status Badge -->
      <div class="card-surface p-4 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-text-muted uppercase tracking-widest">Order #{{ order.id }}</p>
          <p class="text-sm text-text-primary font-bold mt-1">{{ order.package_name }}</p>
        </div>
        <span
          :class="{
            'bg-amber-500/10 text-amber-500': order.status === 'pending',
            'bg-blue-500/10 text-blue-500': order.status === 'awaiting_screenshot',
            'bg-emerald-500/10 text-emerald-500': order.status === 'approved',
            'bg-red-500/10 text-red-500': order.status === 'declined',
          }"
          class="text-xs font-bold px-3 py-1.5 rounded-full uppercase"
        >
          {{ statusLabels[order.status] || order.status }}
        </span>
      </div>

      <!-- Pending: Show QR + Payment Details -->
      <template v-if="order.status === 'pending'">
        <!-- QR Code -->
        <div class="card-surface p-8 text-center space-y-6">
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-text-primary">Scan to Pay</h3>
            <p class="text-sm text-text-muted">Use your payment app to scan this QR code</p>
          </div>

          <div class="flex justify-center">
            <div class="bg-white p-4 rounded-xl">
              <canvas ref="qrCanvas" width="200" height="200"></canvas>
            </div>
          </div>

          <!-- Payment Address -->
          <div class="space-y-2">
            <p class="text-xs font-bold text-text-muted uppercase tracking-widest">Payment Address</p>
            <div class="flex items-center justify-center gap-2">
              <code class="text-sm text-accent bg-accent/5 px-4 py-2 rounded-lg select-all">{{ paymentAddress }}</code>
              <button @click="copyAddress" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-accent transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Amount -->
          <div class="flex items-center justify-center gap-6 pt-4 border-t border-border">
            <div class="text-center">
              <p class="text-xs font-bold text-text-muted uppercase">Amount</p>
              <p class="text-2xl font-bold text-accent">{{ order.price }} {{ order.currency_code }}</p>
            </div>
            <div class="text-center">
              <p class="text-xs font-bold text-text-muted uppercase">You Get</p>
              <p class="text-2xl font-bold text-emerald-500">{{ order.coins_amount }} coins</p>
            </div>
          </div>
        </div>

        <!-- Screenshot Upload -->
        <div class="card-surface p-6 space-y-4">
          <h3 class="text-sm font-bold text-text-primary">📸 Upload Payment Screenshot</h3>
          <p class="text-xs text-text-muted">After making the payment, take a screenshot and upload it here for verification.</p>
          
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <label class="flex-1">
                <input type="file" accept="image/*" @change="handleFileSelect" class="hidden" ref="fileInput" />
                <div class="w-full px-4 py-3 border border-dashed border-border rounded-xl text-center cursor-pointer hover:border-accent/40 hover:bg-white/[0.02] transition-all">
                  <p class="text-sm text-text-muted">{{ selectedFile ? selectedFile.name : 'Click to select screenshot' }}</p>
                </div>
              </label>
            </div>

            <!-- Image Preview -->
            <div v-if="previewUrl" class="rounded-xl overflow-hidden border border-border">
              <img :src="previewUrl" alt="Screenshot preview" class="w-full max-h-64 object-contain bg-base/50" />
            </div>

            <button
              @click="uploadScreenshot"
              :disabled="!selectedFile || uploading"
              class="btn-primary w-full py-2.5 text-sm"
            >
              {{ uploading ? 'Uploading...' : 'Submit Screenshot' }}
            </button>
          </div>
        </div>
      </template>

      <!-- Awaiting Screenshot: Show waiting message -->
      <template v-if="order.status === 'awaiting_screenshot'">
        <div class="card-surface p-8 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-text-primary">Awaiting Verification</h3>
          <p class="text-sm text-text-muted">Your payment screenshot has been submitted. An admin will review it shortly.</p>
          <p class="text-xs text-text-muted">You will receive {{ order.coins_amount }} coins once approved.</p>
        </div>
      </template>

      <!-- Approved -->
      <template v-if="order.status === 'approved'">
        <div class="card-surface p-8 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-emerald-500">Payment Approved! 🎉</h3>
          <p class="text-sm text-text-muted">{{ order.coins_amount }} coins have been added to your account.</p>
          <router-link to="/store" class="btn-primary inline-block px-6 py-2 text-sm">Back to Store</router-link>
        </div>
      </template>

      <!-- Declined / Re-upload (status reset to pending with admin message) -->
      <template v-if="order.status === 'declined'">
        <div class="card-surface p-8 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-red-500">Payment Declined</h3>
          <p class="text-sm text-text-muted" v-if="order.admin_message">{{ order.admin_message }}</p>
          <p class="text-sm text-text-muted" v-else>No reason provided. Please contact support.</p>
          <div class="flex gap-3 justify-center pt-2">
            <button @click="reuploadScreenshot" class="btn-primary px-6 py-2 text-sm">Re-upload Screenshot</button>
            <router-link to="/store" class="btn-secondary px-6 py-2 text-sm">Back to Store</router-link>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import client from '../api/client'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)
const error = ref('')
const success = ref('')
const uploading = ref(false)
const selectedFile = ref(null)
const previewUrl = ref('')
const fileInput = ref(null)
const qrCanvas = ref(null)
const showSuccessPopup = ref(false)

const paymentAddress = ref('payment@zyphron.cloud')

const statusLabels = {
  pending: 'Awaiting Payment',
  awaiting_screenshot: 'Under Review',
  approved: 'Approved',
  declined: 'Declined',
}

async function generateQR(text) {
  await nextTick()
  if (qrCanvas.value) {
    try {
      await QRCode.toCanvas(qrCanvas.value, text, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    } catch (err) {
      console.error('QR generation failed:', err)
    }
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function copyAddress() {
  navigator.clipboard.writeText(paymentAddress.value)
  success.value = 'Payment address copied!'
  setTimeout(() => (success.value = ''), 3000)
}

async function uploadScreenshot() {
  if (!selectedFile.value || !order.value) return
  uploading.value = true
  error.value = ''
  success.value = ''

  try {
    const reader = new FileReader()
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(selectedFile.value)
    })

    await client.post(`/coin-orders/${order.value.id}/screenshot`, {
      screenshot_url: dataUrl,
    })

    // show success popup
    showSuccessPopup.value = true

    // reload order to get updated status
    const { data } = await client.get(`/coin-orders/${order.value.id}`)
    order.value = data

    // redirect to the order detail page after 2 seconds
    setTimeout(() => {
      showSuccessPopup.value = false
      router.push(`/store/order/${order.value.id}`)
    }, 2000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to upload screenshot'
  } finally {
    uploading.value = false
  }
}

function reuploadScreenshot() {
  // reset to pending state so user can upload new screenshot
  selectedFile.value = null
  previewUrl.value = ''
  order.value.status = 'pending'
  error.value = ''
  success.value = ''
}

onMounted(async () => {
  const orderId = route.params.orderId

  if (orderId) {
    try {
      const { data } = await client.get(`/coin-orders/${orderId}`)
      order.value = data
      await generateQR(paymentAddress.value)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load order'
    } finally {
      loading.value = false
    }
  } else {
    const pkgName = route.query.name || 'Coin Package'
    const coins = parseInt(route.query.coins || '100')
    const price = parseInt(route.query.price || '5')
    const currency = route.query.currency || 'USD'

    try {
      const { data } = await client.post('/coin-orders', {
        package_name: pkgName,
        coins_amount: coins,
        price: price,
        currency_code: currency,
        payment_address: paymentAddress.value,
      })
      order.value = data
      router.replace({ params: { orderId: data.id } })
      await generateQR(paymentAddress.value)
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create order'
    } finally {
      loading.value = false
    }
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
