<template>
  <div class="min-h-screen bg-[#0d1117]">
    <!-- Header -->
    <div class="bg-[#161b22] border-b border-[#30363d] px-6 py-4">
      <div class="flex items-center justify-between max-w-6xl mx-auto">
        <div class="flex items-center gap-3">
          <router-link to="/admin/api" class="text-[#8b949e] hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </router-link>
          <div>
            <h1 class="text-xl font-bold text-white">Application API</h1>
            <p class="text-sm text-[#8b949e]">Create a new application API key.</p>
          </div>
        </div>
        <div class="text-sm text-[#8b949e]">
          <span class="text-[#58a6ff]">Admin</span>
          <span class="mx-2">&gt;</span>
          <span class="text-[#58a6ff]">Application API</span>
          <span class="mx-2">&gt;</span>
          <span class="text-white">New Credentials</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex gap-8">
        <!-- Left: Permissions -->
        <div class="flex-1">
          <div class="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            <div class="bg-[#1c2128] px-6 py-4 border-b border-[#30363d]">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-bold text-white">Select Permissions</h2>
                <button 
                  @click="selectAll"
                  class="text-xs text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
                >
                  Select All
                </button>
              </div>
            </div>
            
            <div class="divide-y divide-[#30363d]">
              <div 
                v-for="(perm, resource) in permissions" 
                :key="resource"
                class="px-6 py-4 hover:bg-[#1c2128] transition-colors"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="text-sm font-bold text-white">{{ perm.label }}</div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      :checked="isResourceSelected(resource)"
                      @change="toggleResource(resource)"
                      class="w-4 h-4 text-[#238636] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#238636]"
                    />
                    <span class="text-xs text-[#8b949e]">Select All</span>
                  </label>
                </div>
                <div class="flex flex-wrap gap-3">
                  <label 
                    v-for="action in perm.actions" 
                    :key="`${resource}:${action}`"
                    class="flex items-center gap-2 cursor-pointer bg-[#0d1117] px-3 py-2 rounded border border-[#30363d] hover:border-[#58a6ff] transition-colors"
                  >
                    <input 
                      type="checkbox"
                      :value="`${resource}:${action}`"
                      v-model="selectedPermissions"
                      class="w-4 h-4 text-[#238636] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#238636]"
                    />
                    <span class="text-sm text-[#c9d1d9]">{{ formatAction(action) }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Description & Create -->
        <div class="w-80">
          <div class="bg-[#161b22] rounded-lg border border-[#30363d] p-6 sticky top-8">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-white mb-2">
                  Description <span class="text-[#f85149]">*required</span>
                </label>
                <input 
                  v-model="form.memo" 
                  type="text" 
                  class="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  placeholder="e.g. My API Key"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-white mb-2">
                  Selected Permissions
                </label>
                <div class="bg-[#0d1117] rounded p-3 border border-[#30363d] max-h-40 overflow-y-auto">
                  <div v-if="selectedPermissions.length === 0" class="text-xs text-[#484f58]">
                    No permissions selected
                  </div>
                  <div v-else class="flex flex-wrap gap-1">
                    <span 
                      v-for="perm in selectedPermissions" 
                      :key="perm"
                      class="inline-flex items-center gap-1 bg-[#238636]/20 text-[#3fb950] px-2 py-1 rounded text-xs"
                    >
                      {{ perm }}
                      <button 
                        @click="removePermission(perm)"
                        class="hover:text-white transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <div class="bg-[#0d1117] rounded p-4 border border-[#30363d]">
                <p class="text-xs text-[#8b949e] leading-relaxed">
                  Token will be auto-generated with <code class="text-[#58a6ff]">zya_</code> prefix. 
                  Copy it immediately after creation — it won't be shown again.
                </p>
              </div>

              <button 
                @click="handleSubmit" 
                :disabled="saving || !form.memo || selectedPermissions.length === 0"
                class="w-full bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#21262d] disabled:text-[#484f58] text-white font-bold py-2.5 px-4 rounded transition-colors text-sm"
              >
                {{ saving ? 'Creating...' : 'Create Credentials' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="error" class="mt-6 p-4 bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg text-sm text-[#f85149]">
        {{ error }}
      </div>
      <div v-if="success" class="mt-6 p-4 bg-[#238636]/10 border border-[#238636]/30 rounded-lg text-sm text-[#238636]">
        {{ success }}
      </div>

      <!-- New Token Display -->
      <div v-if="newToken" class="mt-6 bg-[#161b22] border border-[#238636] rounded-lg p-6">
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-5 h-5 text-[#238636]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-sm font-bold text-[#238636]">API Key Created Successfully</span>
        </div>
        <p class="text-xs text-[#8b949e] mb-3">Copy this token now. It won't be shown again.</p>
        <div class="flex items-center gap-3">
          <code class="flex-1 p-3 bg-[#0d1117] rounded text-[#238636] font-mono text-sm break-all border border-[#30363d]">{{ newToken }}</code>
          <button @click="copyToken" class="bg-[#21262d] hover:bg-[#30363d] text-white px-4 py-2 rounded text-sm transition-colors">
            Copy
          </button>
        </div>
        
        <!-- Token Info -->
        <div class="mt-4 p-3 bg-[#0d1117] rounded border border-[#30363d]">
          <h4 class="text-xs font-bold text-[#8b949e] uppercase mb-2">How to use this token</h4>
          <div class="space-y-2 text-xs text-[#c9d1d9]">
            <p><span class="text-[#58a6ff]">Header:</span> <code class="font-mono text-[#238636]">X-API-Key: {{ newToken }}</code></p>
            <p><span class="text-[#58a6ff]">Accept:</span> Application/vnd.zyphron.v1+json</p>
          </div>
        </div>
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
const newToken = ref('')
const permissions = ref({})
const selectedPermissions = ref([])

const form = ref({
  memo: ''
})

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/api/permissions/list')
    permissions.value = data
  } catch (err) {
    console.error('Failed to load permissions:', err)
  }
})

function formatAction(action) {
  return action.charAt(0).toUpperCase() + action.slice(1)
}

function isResourceSelected(resource) {
  const perm = permissions.value[resource]
  if (!perm) return false
  return perm.actions.every(action => 
    selectedPermissions.value.includes(`${resource}:${action}`)
  )
}

function toggleResource(resource) {
  const perm = permissions.value[resource]
  if (!perm) return
  
  if (isResourceSelected(resource)) {
    // remove all permissions for this resource
    selectedPermissions.value = selectedPermissions.value.filter(
      p => !p.startsWith(`${resource}:`)
    )
  } else {
    // add all permissions for this resource
    const newPerms = perm.actions
      .map(action => `${resource}:${action}`)
      .filter(p => !selectedPermissions.value.includes(p))
    selectedPermissions.value.push(...newPerms)
  }
}

function removePermission(perm) {
  selectedPermissions.value = selectedPermissions.value.filter(p => p !== perm)
}

function selectAll() {
  selectedPermissions.value = []
  for (const [resource, perm] of Object.entries(permissions.value)) {
    for (const action of perm.actions) {
      selectedPermissions.value.push(`${resource}:${action}`)
    }
  }
}

async function handleSubmit() {
  if (!form.value.memo) {
    error.value = 'Description is required'
    return
  }
  if (selectedPermissions.value.length === 0) {
    error.value = 'Select at least one permission'
    return
  }

  saving.value = true
  error.value = ''
  success.value = ''
  newToken.value = ''

  try {
    const { data } = await client.post('/admin/api', {
      memo: form.value.memo,
      permissions: selectedPermissions.value
    })
    newToken.value = data.token || ''
    success.value = 'API key created successfully'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create API key'
  } finally {
    saving.value = false
  }
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(newToken.value)
  } catch { /* ignore */ }
}
</script>
