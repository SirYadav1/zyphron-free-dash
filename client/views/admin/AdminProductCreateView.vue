<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/services" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Services</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create Service</h2>
      <p class="text-sm text-text-muted">Add a new server product</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1 col-span-2">
          <label class="text-label">Name</label>
          <input v-model="form.name" type="text" class="input-field w-full" placeholder="e.g. Minecraft Paper Server" />
        </div>
        <div class="space-y-1 col-span-2">
          <label class="text-label">Description</label>
          <textarea v-model="form.description" class="input-field w-full" rows="3" placeholder="Server description for users"></textarea>
        </div>

        <!-- Category -->
        <div class="space-y-1 col-span-2">
          <label class="text-label">Category</label>
          <select v-model="form.category_id" class="input-field w-full">
            <option :value="null">No Category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <!-- Pterodactyl Selection -->
        <div class="col-span-2 space-y-4 p-4 bg-base/50 border border-border rounded-xl">
          <h3 class="text-sm font-bold text-text-primary">🎮 Pterodactyl Configuration</h3>
          
          <div class="space-y-1">
            <label class="text-label">Nest (Game Type)</label>
            <select v-model="selectedNestId" @change="onNestChange" class="input-field w-full">
              <option value="">Select Nest...</option>
              <option v-for="nest in nests" :key="getNestId(nest)" :value="getNestId(nest)">
                {{ getNestName(nest) }}
              </option>
            </select>
          </div>

          <div class="space-y-1" v-if="selectedNestId">
            <label class="text-label">Egg (Server Type)</label>
            <select v-model="selectedEggId" @change="onEggChange" class="input-field w-full">
              <option value="">Select Egg...</option>
              <option v-for="egg in eggs" :key="getEggId(egg)" :value="getEggId(egg)">
                {{ getEggName(egg) }}
              </option>
            </select>
          </div>

          <div v-if="form.egg_name" class="text-xs text-text-muted">
            Selected: <span class="text-accent">{{ form.nest_name }}</span> → <span class="text-accent">{{ form.egg_name }}</span>
          </div>
        </div>

        <!-- Pricing -->
        <div class="space-y-1">
          <label class="text-label">Coin Price (for Store)</label>
          <input v-model.number="form.coin_price" type="number" class="input-field w-full" placeholder="1000" />
          <p class="text-[10px] text-text-muted">Users will pay this many coins</p>
        </div>
        <div class="space-y-1">
          <label class="text-label">Duration (Days)</label>
          <input v-model.number="form.duration_days" type="number" class="input-field w-full" placeholder="7" />
          <p class="text-[10px] text-text-muted">Server expires after N days</p>
        </div>

        <!-- Server Specs -->
        <div class="col-span-2 pt-2 border-t border-border">
          <h3 class="text-sm font-bold text-text-primary mb-3">📊 Server Specifications</h3>
        </div>

        <div class="space-y-1">
          <label class="text-label">CPU (%)</label>
          <input v-model.number="form.cpu" type="number" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">RAM (MB)</label>
          <input v-model.number="form.ram" type="number" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Swap (MB)</label>
          <input v-model.number="form.swap" type="number" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Disk (MB)</label>
          <input v-model.number="form.disk" type="number" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Databases</label>
          <input v-model.number="form.databases" type="number" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Backups</label>
          <input v-model.number="form.backups" type="number" class="input-field w-full" />
        </div>
      </div>

      <div class="flex gap-3 pt-4 border-t border-border">
        <button @click="handleSubmit" :disabled="saving" class="btn-primary px-6 py-2">
          {{ saving ? 'Creating...' : 'Create Service' }}
        </button>
        <router-link to="/admin/services" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import client from '../../api/client'

const router = useRouter()
const saving = ref(false)
const error = ref('')
const success = ref('')
const nests = ref([])
const eggs = ref([])
const categories = ref([])
const loadingNests = ref(false)
const selectedNestId = ref('')
const selectedEggId = ref('')

const form = ref({
  name: '',
  description: '',
  price: 0,
  billing_priority: 'monthly',
  cpu: 100,
  ram: 1024,
  swap: 0,
  disk: 5120,
  databases: 1,
  backups: 1,
  nest_id: null,
  egg_id: null,
  duration_days: 7,
  egg_name: '',
  nest_name: '',
  coin_price: 1000,
  category_id: null
})

// helper functions for Pterodactyl API response format
function getNestId(nest) {
  return nest.attributes?.id || nest.id
}
function getNestName(nest) {
  return nest.attributes?.name || nest.name || 'Nest #' + getNestId(nest)
}
function getEggId(egg) {
  return egg.attributes?.id || egg.id
}
function getEggName(egg) {
  return egg.attributes?.name || egg.name || 'Egg #' + getEggId(egg)
}

onMounted(async () => {
  loadingNests.value = true
  try {
    const [nestRes, catRes] = await Promise.all([
      client.get('/admin/pterodactyl/nests'),
      client.get('/admin/categories').catch(() => ({ data: [] }))
    ])
    nests.value = Array.isArray(nestRes.data) ? nestRes.data : []
    categories.value = Array.isArray(catRes.data) ? catRes.data : []
  } catch (err) {
    console.error('Failed to load nests:', err)
  } finally {
    loadingNests.value = false
  }
})

async function onNestChange() {
  selectedEggId.value = ''
  form.value.egg_id = null
  form.value.egg_name = ''
  eggs.value = []
  if (!selectedNestId.value) return

  const nest = nests.value.find(n => getNestId(n) == selectedNestId.value)
  form.value.nest_id = parseInt(selectedNestId.value)
  form.value.nest_name = getNestName(nest)

  try {
    const { data } = await client.get(`/admin/pterodactyl/nests/${selectedNestId.value}/eggs`)
    eggs.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load eggs:', err)
  }
}

function onEggChange() {
  const egg = eggs.value.find(e => getEggId(e) == selectedEggId.value)
  form.value.egg_id = parseInt(selectedEggId.value)
  form.value.egg_name = getEggName(egg)
}

async function handleSubmit() {
  if (!form.value.name) {
    error.value = 'Service name is required'
    return
  }
  if (!form.value.nest_id || !form.value.egg_id) {
    error.value = 'Please select a Nest and Egg'
    return
  }

  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post('/admin/products', form.value)
    success.value = 'Service created successfully'
    setTimeout(() => router.push('/admin/services'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create product'
  } finally {
    saving.value = false
  }
}
</script>
