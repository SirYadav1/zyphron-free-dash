<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <div class="flex items-center gap-3">
      <router-link to="/ticket" class="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create Ticket</h2>
        <p class="text-sm text-text-muted">Submit a support request to our team.</p>
      </div>
    </div>

    <div v-if="error" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold">
      {{ error }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-8">
      <div class="card-surface p-8 space-y-6">
        <div class="space-y-1.5">
          <label for="title" class="text-label">Title</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            maxlength="255"
            class="input-field"
            placeholder="Brief description of your issue"
          />
        </div>

        <div class="space-y-1.5">
          <label for="priority" class="text-label">Priority</label>
          <div class="flex items-center gap-4 flex-wrap">
            <label
              v-for="p in ['low', 'medium', 'high', 'critical']"
              :key="p"
              class="flex items-center gap-2 cursor-pointer group"
            >
              <input type="radio" v-model="form.priority" :value="p" class="hidden" />
              <div
                :class="form.priority === p ? priorityRadioActive(p) : 'bg-base border-border group-hover:border-border-bright'"
                class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
              >
                <div v-if="form.priority === p" class="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
              <span class="text-sm font-medium capitalize" :class="form.priority === p ? priorityTextClass(p) : 'text-text-muted'">{{ p }}</span>
            </label>
          </div>
          <p class="text-[11px] text-text-muted mt-2">Select how urgent your issue is.</p>
        </div>

        <div class="space-y-1.5">
          <label for="server" class="text-label">Related Server (optional)</label>
          <select id="server" v-model="form.serverId" class="input-field">
            <option :value="null">No specific server</option>
            <option v-for="s in servers" :key="s.id" :value="s.id">{{ s.serverName }}</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label for="message" class="text-label">Message</label>
          <textarea
            id="message"
            v-model="form.message"
            required
            rows="8"
            class="input-field resize-y min-h-[160px] text-sm leading-relaxed"
            placeholder="Describe your issue in detail..."
          ></textarea>
          <p class="text-[11px] text-text-muted mt-2">Include any relevant details like error messages, steps to reproduce, or screenshots.</p>
        </div>
      </div>

      <div class="pt-6 border-t border-border flex items-center justify-between">
        <p class="text-xs text-text-muted font-medium">Our team typically responds within 24 hours.</p>
        <div class="flex items-center gap-3">
          <router-link to="/ticket" class="btn-secondary">Cancel</router-link>
          <button type="submit" :disabled="submitting" class="btn-primary px-10">
            {{ submitting ? 'Submitting...' : 'Submit Ticket' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServersStore } from '../stores/servers'
import client from '../api/client'

const router = useRouter()

const servers = ref([])
const submitting = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  priority: 'medium',
  serverId: null,
  message: '',
})

onMounted(async () => {
  try {
    const serversStore = useServersStore()
    await serversStore.fetchServers()
    servers.value = serversStore.servers
  } catch {
    // servers are optional
  }
})

async function handleSubmit() {
  if (!form.title.trim() || !form.message.trim()) return
  submitting.value = true
  error.value = ''
  try {
    const payload = {
      title: form.title.trim(),
      priority: form.priority,
      message: form.message.trim(),
    }
    if (form.serverId) {
      payload.server = String(form.serverId)
    }
    await client.post('/tickets', payload)
    router.push('/ticket')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create ticket'
  } finally {
    submitting.value = false
  }
}

function priorityRadioActive(p) {
  return {
    low: 'bg-green-500 border-green-500',
    medium: 'bg-yellow-500 border-yellow-500',
    high: 'bg-red-500 border-red-500',
    critical: 'bg-purple-500 border-purple-500',
  }[p] || 'bg-accent border-accent'
}

function priorityTextClass(p) {
  return {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
    critical: 'text-purple-400',
  }[p] || 'text-text-primary'
}
</script>
