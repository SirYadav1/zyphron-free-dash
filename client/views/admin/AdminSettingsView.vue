<template>
  <div class="space-y-10">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Settings</h2>
      <p class="text-sm text-text-muted">System Configuration & Key-Value Store</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
      <AlertTriangle :size="14" :stroke-width="2.5" /> {{ error }}
    </div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent flex items-center gap-2">
      <CheckCircle :size="14" :stroke-width="2.5" /> {{ success }}
    </div>

    <!-- Custom AFK Rates Config Section -->
    <div class="card-surface p-6 space-y-6 border border-accent/10 relative overflow-hidden">
      <div class="absolute inset-0 bg-accent/[0.02] pointer-events-none"></div>
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <svg class="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            AFK Earning Rates
          </h3>
          <p class="text-sm text-text-muted">Configure how many compute credits users earn from active sessions.</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3 bg-base p-2 rounded-lg border border-border">
            <input 
              v-model="afkCoins" 
              type="number" 
              class="w-20 bg-transparent border-none focus:ring-0 text-accent font-bold tabular-nums text-center p-0" 
            />
            <span class="text-[10px] font-bold text-text-muted uppercase tracking-widest">CR Every</span>
            <input 
              v-model="afkInterval" 
              type="number" 
              class="w-16 bg-transparent border-none focus:ring-0 text-text-primary font-bold tabular-nums text-center p-0" 
            />
            <span class="text-[10px] font-bold text-text-muted uppercase tracking-widest pr-2">MIN</span>
          </div>

          <button 
            @click="saveAfkRates" 
            :disabled="savingAfk"
            class="btn-primary px-6 py-2 text-xs"
          >
            {{ savingAfk ? 'Saving...' : 'Apply Rates' }}
          </button>
        </div>
      </div>
      <div class="relative bg-base/50 p-3 rounded border border-border text-xs text-text-muted font-medium flex items-center gap-2">
        <span class="text-blue-400">ℹ️</span> 
        Live Preview: Users will earn <span class="text-accent font-bold">{{ afkCoins || 0 }} CR</span> for every <span class="text-text-primary font-bold">{{ afkInterval || 0 }} {{ afkInterval == 1 ? 'minute' : 'minutes' }}</span> of continuous active focus.
      </div>
    </div>

    <!-- Default Server Node Section -->
    <div class="card-surface p-6 space-y-6 border border-accent/10 relative overflow-hidden">
      <div class="absolute inset-0 bg-orange-500/[0.02] pointer-events-none"></div>
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <svg class="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
            </svg>
            Default Server Node
          </h3>
          <p class="text-sm text-text-muted">Choose which Pterodactyl node will be used for all new server deployments.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button 
            @click="loadNodes" 
            :disabled="loadingNodes"
            class="px-4 py-2 text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors disabled:opacity-40"
          >
            {{ loadingNodes ? 'Loading...' : 'Refresh Nodes' }}
          </button>
          <button 
            @click="saveDefaultNode" 
            :disabled="savingNode || !selectedNodeId"
            class="btn-primary px-6 py-2 text-xs"
          >
            {{ savingNode ? 'Saving...' : 'Save Node' }}
          </button>
        </div>
      </div>

      <div v-if="loadingNodes" class="flex items-center gap-3 py-4">
        <div class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></div>
        <p class="text-sm text-text-muted">Fetching available nodes from Pterodactyl...</p>
      </div>

      <div v-else-if="nodes.length === 0" class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
        <div class="flex items-center gap-2 text-yellow-400 mb-2">
          <AlertTriangle :size="16" :stroke-width="2" />
          <span class="font-bold">No Nodes Available</span>
        </div>
        <p class="text-text-muted">Configure your Pterodactyl API connection below first, then click "Refresh Nodes".</p>
      </div>

      <div v-else class="space-y-4">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Select Default Node</label>
          <select v-model="selectedNodeId" class="input-field py-2">
            <option :value="null" disabled>Choose a node...</option>
            <option v-for="node in nodes" :key="node.id" :value="node.id">
              {{ node.name }} — {{ node.fqdn }} (RAM: {{ formatRam(node.ram) }}, Disk: {{ formatDisk(node.disk) }})
            </option>
          </select>
        </div>

        <div v-if="selectedNode" class="bg-base/50 p-4 rounded-lg border border-border grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-[9px] font-bold text-text-muted uppercase mb-1">Node Name</p>
            <p class="text-sm font-bold text-text-primary">{{ selectedNode.name }}</p>
          </div>
          <div>
            <p class="text-[9px] font-bold text-text-muted uppercase mb-1">Hostname</p>
            <p class="text-sm font-bold text-text-primary">{{ selectedNode.fqdn }}</p>
          </div>
          <div>
            <p class="text-[9px] font-bold text-text-muted uppercase mb-1">RAM</p>
            <p class="text-sm font-bold text-text-primary">{{ formatRam(selectedNode.ram) }}</p>
          </div>
          <div>
            <p class="text-[9px] font-bold text-text-muted uppercase mb-1">Disk</p>
            <p class="text-sm font-bold text-text-primary">{{ formatDisk(selectedNode.disk) }}</p>
          </div>
        </div>

        <div v-if="nodeSuccess" class="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-bold text-green-500 flex items-center gap-2">
          <CheckCircle :size="14" :stroke-width="2.5" /> {{ nodeSuccess }}
        </div>
        <div v-if="nodeError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
          <AlertTriangle :size="14" :stroke-width="2.5" /> {{ nodeError }}
        </div>
      </div>
    </div>

    <!-- Default Allocation Settings Section -->
    <div class="card-surface p-6 space-y-6 border border-accent/10 relative overflow-hidden">
      <div class="absolute inset-0 bg-cyan-500/[0.02] pointer-events-none"></div>
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Default Allocation Settings
          </h3>
          <p class="text-sm text-text-muted">Configure default resource limits for all new servers. These apply when no specific product is selected.</p>
        </div>
        <button 
          @click="saveAllocationSettings" 
          :disabled="savingAllocation"
          class="btn-primary px-6 py-2 text-xs"
        >
          {{ savingAllocation ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">RAM (MB)</label>
          <input v-model.number="allocationSettings.ram_mb" type="number" class="input-field py-2" placeholder="2048" />
          <p class="text-[10px] text-text-muted">{{ formatRam(allocationSettings.ram_mb || 0) }}</p>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">CPU (%)</label>
          <input v-model.number="allocationSettings.cpu_percent" type="number" class="input-field py-2" placeholder="100" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Disk (MB)</label>
          <input v-model.number="allocationSettings.disk_mb" type="number" class="input-field py-2" placeholder="5120" />
          <p class="text-[10px] text-text-muted">{{ formatDisk(allocationSettings.disk_mb || 0) }}</p>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Swap (MB)</label>
          <input v-model.number="allocationSettings.swap_mb" type="number" class="input-field py-2" placeholder="0" />
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Databases</label>
          <input v-model.number="allocationSettings.databases_limit" type="number" class="input-field py-2" placeholder="0" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Allocations</label>
          <input v-model.number="allocationSettings.allocations_limit" type="number" class="input-field py-2" placeholder="1" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Backups</label>
          <input v-model.number="allocationSettings.backup_limit" type="number" class="input-field py-2" placeholder="0" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Docker Image</label>
          <input v-model="allocationSettings.docker_image" type="text" class="input-field py-2" placeholder="ghcr.io/pterodactyl/yolks:java_25" />
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Startup Command</label>
          <input v-model="allocationSettings.startup_command" type="text" class="input-field py-2" placeholder="java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Server JAR File</label>
          <input v-model="allocationSettings.server_jarfile" type="text" class="input-field py-2" placeholder="server.jar" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Auto Start</label>
          <select v-model="allocationSettings.auto_start" class="input-field py-2">
            <option :value="1">Yes</option>
            <option :value="0">No</option>
          </select>
        </div>
      </div>

      <div v-if="allocationSuccess" class="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-bold text-green-500 flex items-center gap-2">
        <CheckCircle :size="14" :stroke-width="2.5" /> {{ allocationSuccess }}
      </div>
      <div v-if="allocationError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
        <AlertTriangle :size="14" :stroke-width="2.5" /> {{ allocationError }}
      </div>
    </div>

    <!-- Default Blueprint Config Section -->
    <div class="card-surface p-6 space-y-6 border border-accent/10 relative overflow-hidden">
      <div class="absolute inset-0 bg-blue-500/[0.02] pointer-events-none"></div>
      <div class="relative">
        <div class="flex items-center justify-between mb-4">
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
              </svg>
              Global Server Blueprint
            </h3>
            <p class="text-sm text-text-muted">Configure the default resources and node settings for all new servers.</p>
          </div>
          <div class="flex items-center gap-3">
            <button 
              @click="loadPterodactylOptions" 
              :disabled="loadingPteroOptions"
              class="px-4 py-2 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-40"
            >
              {{ loadingPteroOptions ? 'Loading...' : 'Refresh Options' }}
            </button>
            <button 
              @click="saveBlueprint" 
              :disabled="savingBlueprint"
              class="btn-primary px-6 py-2 text-xs"
            >
              {{ savingBlueprint ? 'Saving...' : 'Apply Blueprint' }}
            </button>
          </div>
        </div>

        <div v-if="!pteroConfigured" class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
          <div class="flex items-center gap-2 text-yellow-400 mb-2">
            <AlertTriangle :size="16" :stroke-width="2" />
            <span class="font-bold">Pterodactyl Not Configured</span>
          </div>
          <p class="text-text-muted">Configure your Pterodactyl API above, then click "Load from Pterodactyl" to automatically fetch available options.</p>
        </div>

        <div v-else-if="loadingPteroOptions" class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
          <div class="flex items-center gap-2 text-blue-400">
            <span>⏳</span>
            <span>Loading Pterodactyl options...</span>
          </div>
        </div>

        <div v-else-if="pteroOptionsLoaded" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Node</label>
            <select v-model="blueprint.node_id" class="input-field py-2">
              <option v-for="node in pteroData.nodes" :key="node.id" :value="node.id">
                {{ node.name }} (ID: {{ node.id }})
              </option>
            </select>
          </div>
          
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Nest</label>
            <select v-model="blueprint.nest_id" @change="onNestChange" class="input-field py-2">
              <option v-for="nest in pteroData.nests" :key="nest.id" :value="nest.id">
                {{ nest.name }} (ID: {{ nest.id }})
              </option>
            </select>
          </div>
          
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Egg</label>
            <select v-model="blueprint.egg_id" @change="onEggChange" class="input-field py-2" :disabled="!blueprint.nest_id">
              <option v-for="egg in currentEggs" :key="egg.id" :value="egg.id">
                {{ egg.name }} (ID: {{ egg.id }})
              </option>
            </select>
          </div>
          
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Docker Image</label>
            <input v-model="blueprint.docker_image" type="text" class="input-field py-2" :placeholder="currentEgg?.docker_image || ''" />
          </div>
          
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">RAM (MB)</label>
            <input v-model="blueprint.ram_mb" type="number" class="input-field py-2" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">CPU (%)</label>
            <input v-model="blueprint.cpu_percent" type="number" class="input-field py-2" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Disk (MB)</label>
            <input v-model="blueprint.disk_mb" type="number" class="input-field py-2" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Allocation Limit</label>
            <input v-model="blueprint.allocations_limit" type="number" class="input-field py-2" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Database Limit</label>
            <input v-model="blueprint.databases_limit" type="number" class="input-field py-2" />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Backup Limit</label>
            <input v-model="blueprint.backup_limit" type="number" class="input-field py-2" />
          </div>
        </div>

        <div v-else class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
          <div class="flex items-center gap-2 text-blue-400">
            <span>ℹ️</span>
            <span>Pterodactyl configured - click "Load from Pterodactyl" to fetch available options</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pterodactyl API Configuration Section -->
    <div class="card-surface p-6 space-y-6 border border-accent/10 relative overflow-hidden">
      <div class="absolute inset-0 bg-green-500/[0.02] pointer-events-none"></div>
      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Panel API Configuration
          </h3>
          <p class="text-sm text-text-muted">Configure your panel connection for server management (supports Pterodactyl & Revactyl).</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button 
            @click="testPterodactyl" 
            :disabled="testingPtero"
            class="px-4 py-2 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-40"
          >
            {{ testingPtero ? 'Testing...' : 'Test Connection' }}
          </button>
          <button 
            @click="savePterodactylConfig" 
            :disabled="savingPtero"
            class="btn-primary px-6 py-2 text-xs"
          >
            {{ savingPtero ? 'Saving...' : 'Save Config' }}
          </button>
        </div>
      </div>

      <div class="relative grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Panel Type</label>
          <select v-model="pteroConfig.panelType" class="input-field py-2">
            <option value="pterodactyl">Pterodactyl</option>
            <option value="revactyl">Revactyl</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Panel URL</label>
          <input 
            v-model="pteroConfig.panelUrl" 
            type="text" 
            placeholder="https://panel.example.com"
            class="input-field py-2"
          />
        </div>
        <div class="space-y-1 md:col-span-2">
          <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">API Key</label>
          <div class="flex items-center gap-2">
            <input 
              v-model="pteroConfig.apiKey" 
              type="password" 
              placeholder="ptla_..."
              class="input-field py-2 flex-1"
            />
            <span v-if="pteroApiKeyConfigured && !pteroConfig.apiKey" class="flex items-center gap-1 text-green-400 text-xs font-bold whitespace-nowrap">
              <CheckCircle :size="14" :stroke-width="2.5" /> Configured
            </span>
          </div>
        </div>
      </div>

      <div v-if="pteroStatus" class="relative p-3 rounded border text-xs font-medium flex items-start gap-2"
        :class="pteroStatus.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'">
        <span class="mt-0.5" v-if="pteroStatus.success"><Check :size="14" :stroke-width="2.5" class="text-green-500" /></span>
        <span class="mt-0.5" v-else><X :size="14" :stroke-width="2.5" class="text-red-500" /></span>
        <div class="flex-1">
          <div>{{ pteroStatus.message }}</div>
          <div v-if="pteroStatus.panelType" class="mt-1 font-bold">Panel Type: {{ pteroStatus.panelType.charAt(0).toUpperCase() + pteroStatus.panelType.slice(1) }}</div>
          <div v-if="pteroStatus.guidance" class="mt-1 text-text-muted/70">{{ pteroStatus.guidance }}</div>
          <div v-if="pteroStatus.nodeCount" class="mt-1 font-bold">{{ pteroStatus.nodeCount }} nodes available</div>
        </div>
      </div>
    </div>

    <!-- Branding Section -->
    <div class="card-surface p-6 space-y-6 border border-accent/10 relative overflow-hidden">
      <div class="absolute inset-0 bg-purple-500/[0.02] pointer-events-none"></div>
      <div class="relative">
        <div class="flex items-center justify-between mb-4">
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              Branding
            </h3>
            <p class="text-sm text-text-muted">Customize the login page image and browser favicon.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Login Page Image URL</label>
            <div class="flex items-center gap-3">
              <input v-model="loginImageUrl" type="text" placeholder="https://example.com/login-bg.png" class="input-field py-2 flex-1" />
              <button @click="saveLoginImage" :disabled="savingLoginImage" class="btn-primary px-4 py-2 text-xs whitespace-nowrap">
                {{ savingLoginImage ? 'Saving...' : 'Save' }}
              </button>
            </div>
            <div v-if="loginImageUrl" class="mt-2 rounded-lg overflow-hidden border border-border max-w-[200px]">
              <img :src="loginImageUrl" @error="loginImageError = true" @load="loginImageError = false" class="w-full h-24 object-cover" />
              <p v-if="loginImageError" class="text-[10px] text-red-400 p-2 bg-red-500/5">Invalid URL — image failed to load</p>
            </div>
          </div>
          <div class="space-y-3">
            <label class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Favicon URL</label>
            <div class="flex items-center gap-3">
              <input v-model="faviconUrl" type="text" placeholder="https://example.com/favicon.ico" class="input-field py-2 flex-1" />
              <button @click="saveFavicon" :disabled="savingFavicon" class="btn-primary px-4 py-2 text-xs whitespace-nowrap">
                {{ savingFavicon ? 'Saving...' : 'Save' }}
              </button>
            </div>
            <div v-if="faviconUrl" class="flex items-center gap-3 mt-2">
              <img :src="faviconUrl" @error="faviconError = true" @load="faviconError = false" class="w-8 h-8 rounded border border-border" />
              <span v-if="faviconError" class="text-[10px] text-red-400">Invalid URL</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label w-1/3">Setting Key</th>
              <th class="px-5 py-3 text-label">Value</th>
              <th class="px-5 py-3 text-label text-right w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(value, key) in store.settings"
              :key="key"
              class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-5 py-4">
                <span class="text-text-primary text-sm font-medium">{{ key }}</span>
              </td>
              <td class="px-5 py-4">
                <div v-if="editingKey === key" class="flex items-center gap-3">
                  <input
                    v-model="editValue"
                    type="text"
                    class="input-field flex-1"
                    @keyup.enter="handleSave(key)"
                  />
                </div>
                <span v-else class="text-text-muted text-sm">{{ value }}</span>
              </td>
              <td class="px-5 py-4 text-right">
                <div v-if="editingKey === key" class="flex gap-3 justify-end">
                  <button
                    @click="handleSave(key)"
                    :disabled="saving"
                    class="text-xs font-bold text-accent hover:text-white transition-colors disabled:opacity-40"
                  >
                    Save
                  </button>
                  <button
                    @click="editingKey = null"
                    class="text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  v-else
                  @click="startEdit(key, value)"
                  class="text-xs font-bold text-accent hover:text-white transition-colors"
                >
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="Object.keys(store.settings).length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Settings Found</p>
        <p class="text-sm text-text-muted/60">No configuration settings exist yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '../../stores/admin'
import client from '../../api/client'
import { AlertTriangle, CheckCircle, Zap, Check, X, Server, HardDrive } from 'lucide-vue-next'

const store = useAdminStore()
const editingKey = ref(null)
const editValue = ref('')
const saving = ref(false)
const error = ref('')
const success = ref('')

const savingAfk = ref(false)
const afkCoins = ref(10)
const afkInterval = ref(1)

const loginImageUrl = ref('')
const faviconUrl = ref('')
const savingLoginImage = ref(false)
const savingFavicon = ref(false)
const loginImageError = ref(false)
const faviconError = ref(false)

const loadingNodes = ref(false)
const savingNode = ref(false)
const nodes = ref([])
const selectedNodeId = ref(null)
const nodeSuccess = ref('')
const nodeError = ref('')

const savingAllocation = ref(false)
const allocationSettings = ref({
  ram_mb: 2048,
  cpu_percent: 100,
  disk_mb: 5120,
  swap_mb: 0,
  databases_limit: 0,
  allocations_limit: 1,
  backup_limit: 0,
  docker_image: 'ghcr.io/pterodactyl/yolks:java_25',
  startup_command: '',
  server_jarfile: 'server.jar',
  auto_start: 1,
})
const allocationSuccess = ref('')
const allocationError = ref('')

const savingBlueprint = ref(false)
const blueprint = ref({
  node_id: 6,
  nest_id: 1,
  egg_id: 2,
  ram_mb: 2048,
  cpu_percent: 100,
  disk_mb: 5120,
  allocations_limit: 1,
  databases_limit: 0,
  backup_limit: 0,
  docker_image: 'ghcr.io/pterodactyl/yolks:java_25'
})

const savingPtero = ref(false)
const testingPtero = ref(false)
const pteroConfig = ref({
  panelType: 'pterodactyl',
  panelUrl: '',
  apiKey: ''
})
const pteroStatus = ref(null)
const pteroConfigured = ref(false)
const pteroApiKeyConfigured = ref(false)
const loadingPteroOptions = ref(false)
const pteroOptionsLoaded = ref(false)
const pteroData = ref({
  nodes: [],
  nests: [],
  eggs: {}
})

const currentEggs = computed(() => {
  if (!blueprint.value.nest_id || !pteroData.value.eggs[blueprint.value.nest_id]) {
    return []
  }
  return pteroData.value.eggs[blueprint.value.nest_id]
})

const currentEgg = computed(() => {
  if (!blueprint.value.egg_id || !currentEggs.value.length) {
    return null
  }
  return currentEggs.value.find(e => e.id === blueprint.value.egg_id)
})

const selectedNode = computed(() => {
  if (!selectedNodeId.value || !nodes.value.length) return null
  return nodes.value.find(n => n.id === selectedNodeId.value)
})

function formatRam(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
}

function formatDisk(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
}

async function loadNodes() {
  loadingNodes.value = true
  nodeError.value = ''
  nodeSuccess.value = ''
  try {
    const res = await store.fetchPterodactylNodes()
    nodes.value = res || []
    if (nodes.value.length === 0) {
      nodeError.value = 'No nodes found. Check your Pterodactyl API connection.'
    }
  } catch (err) {
    nodeError.value = err.response?.data?.message || 'Failed to load nodes from Pterodactyl'
  } finally {
    loadingNodes.value = false
  }
}

async function saveDefaultNode() {
  if (!selectedNodeId.value) return
  savingNode.value = true
  nodeError.value = ''
  nodeSuccess.value = ''
  try {
    await store.updateSetting('default_node_id', selectedNodeId.value.toString())
    nodeSuccess.value = `Default node updated to "${selectedNode.value?.name}" (ID: ${selectedNodeId.value})`
  } catch (err) {
    nodeError.value = err.response?.data?.message || 'Failed to save default node'
  } finally {
    savingNode.value = false
  }
}

async function saveAllocationSettings() {
  savingAllocation.value = true
  allocationError.value = ''
  allocationSuccess.value = ''
  try {
    const promises = Object.entries(allocationSettings.value).map(([key, val]) => {
      const settingKey = `default_${key}`
      return store.updateSetting(settingKey, val.toString())
    })
    await Promise.all(promises)
    allocationSuccess.value = 'Default allocation settings saved successfully!'
  } catch (err) {
    allocationError.value = err.response?.data?.message || 'Failed to save allocation settings'
  } finally {
    savingAllocation.value = false
  }
}

onMounted(async () => {
  await store.fetchSettings()
  if (store.settings['afk_coins_per_minute']) {
    afkCoins.value = parseInt(store.settings['afk_coins_per_minute']) || 10
  }
  if (store.settings['afk_time_interval_minutes']) {
    afkInterval.value = parseInt(store.settings['afk_time_interval_minutes']) || 1
  }

  const getSettingNum = (key, fallback) => store.settings[`default_${key}`] ? parseInt(store.settings[`default_${key}`]) : fallback
  const getSettingStr = (key, fallback) => store.settings[`default_${key}`] || fallback

  blueprint.value = {
    node_id: getSettingNum('node_id', 6),
    nest_id: getSettingNum('nest_id', 1),
    egg_id: getSettingNum('egg_id', 2),
    ram_mb: getSettingNum('ram_mb', 2048),
    cpu_percent: getSettingNum('cpu_percent', 100),
    disk_mb: getSettingNum('disk_mb', 5120),
    allocations_limit: getSettingNum('allocations_limit', 1),
    databases_limit: getSettingNum('databases_limit', 0),
    backup_limit: getSettingNum('backup_limit', 0),
    docker_image: getSettingStr('docker_image', 'ghcr.io/pterodactyl/yolks:java_25')
  }

  if (store.settings['login_image_url']) {
    loginImageUrl.value = store.settings['login_image_url']
  }
  if (store.settings['favicon_url']) {
    faviconUrl.value = store.settings['favicon_url']
  }

  // Load default node setting
  if (store.settings['default_node_id']) {
    selectedNodeId.value = parseInt(store.settings['default_node_id']) || null
  }

  // Load Pterodactyl configuration first
  await loadPterodactylConfig()

  // Auto-load nodes if Pterodactyl is configured
  if (pteroConfigured.value) {
    loadNodes().then(() => {
      if (selectedNodeId.value && nodes.value.length > 0) {
        const exists = nodes.value.find(n => n.id === selectedNodeId.value)
        if (!exists) selectedNodeId.value = null
      }
    }).catch(() => {})
    // Auto-load blueprint options (don't block page render)
    loadPterodactylOptions().catch(() => {})
  }

  // Load allocation settings
  allocationSettings.value = {
    ram_mb: getSettingNum('ram_mb', 2048),
    cpu_percent: getSettingNum('cpu_percent', 100),
    disk_mb: getSettingNum('disk_mb', 5120),
    swap_mb: getSettingNum('swap_mb', 0),
    databases_limit: getSettingNum('databases_limit', 0),
    allocations_limit: getSettingNum('allocations_limit', 1),
    backup_limit: getSettingNum('backup_limit', 0),
    docker_image: getSettingStr('docker_image', 'ghcr.io/pterodactyl/yolks:java_25'),
    startup_command: getSettingStr('startup_command', ''),
    server_jarfile: getSettingStr('server_jarfile', 'server.jar'),
    auto_start: getSettingNum('auto_start', 1),
  }
})

async function saveLoginImage() {
  savingLoginImage.value = true
  error.value = ''
  success.value = ''
  try {
    await store.updateSetting('login_image_url', loginImageUrl.value)
    success.value = 'Login page image updated'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update login image'
  } finally {
    savingLoginImage.value = false
  }
}

async function saveFavicon() {
  savingFavicon.value = true
  error.value = ''
  success.value = ''
  try {
    await store.updateSetting('favicon_url', faviconUrl.value)
    success.value = 'Favicon updated'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update favicon'
  } finally {
    savingFavicon.value = false
  }
}

async function saveAfkRates() {
  savingAfk.value = true
  error.value = ''
  success.value = ''
  try {
    await store.updateSetting('afk_coins_per_minute', afkCoins.value.toString())
    await store.updateSetting('afk_time_interval_minutes', Math.max(1, afkInterval.value).toString())
    success.value = `AFK rates successfully updated to ${afkCoins.value} CR / ${Math.max(1, afkInterval.value)} MIN`
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update AFK rates'
  } finally {
    savingAfk.value = false
  }
}

async function saveBlueprint() {
  savingBlueprint.value = true
  error.value = ''
  success.value = ''
  try {
    const promises = Object.entries(blueprint.value).map(([key, val]) =>
      store.updateSetting(`default_${key}`, val.toString())
    )
    await Promise.all(promises)
    success.value = 'Global Blueprint successfully updated!'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update blueprint'
  } finally {
    savingBlueprint.value = false
  }
}

function startEdit(key, value) {
  editingKey.value = key
  editValue.value = value
  error.value = ''
  success.value = ''
}

async function handleSave(key) {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await store.updateSetting(key, editValue.value)
    success.value = `"${key}" updated to "${editValue.value}"`
    editingKey.value = null
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update'
  } finally {
    saving.value = false
  }
}

async function loadPterodactylConfig() {
  try {
    const { data } = await client.get('/admin/pterodactyl/config')
    pteroConfig.value.panelUrl = data.panelUrl || ''
    pteroConfig.value.panelType = data.panelType || 'pterodactyl'
    pteroConfigured.value = data.configured || false
    pteroApiKeyConfigured.value = data.apiKeyConfigured || false
  } catch (err) {
    console.error('Failed to load Pterodactyl config:', err)
  }
}

async function loadPterodactylOptions() {
  loadingPteroOptions.value = true
  error.value = ''
  success.value = ''
  try {
    // Fetch nodes
    const nodesResponse = await store.fetchPterodactylNodes()
    pteroData.value.nodes = nodesResponse

    // Fetch nests
    const nestsResponse = await store.fetchPterodactylNests()
    pteroData.value.nests = nestsResponse

    // Fetch eggs for each nest
    const eggsData = {}
    for (const nest of nestsResponse) {
      const eggsResponse = await store.fetchPterodactylEggs(nest.id)
      eggsData[nest.id] = eggsResponse
    }
    pteroData.value.eggs = eggsData

    // Set defaults based on first available options
    if (nodesResponse.length > 0) {
      blueprint.value.node_id = nodesResponse[0].id
    }
    if (nestsResponse.length > 0) {
      blueprint.value.nest_id = nestsResponse[0].id
      // Load eggs for first nest
      if (eggsData[nestsResponse[0].id]?.length > 0) {
        blueprint.value.egg_id = eggsData[nestsResponse[0].id][0].id
        const firstEgg = eggsData[nestsResponse[0].id][0]
        if (firstEgg?.docker_image) {
          blueprint.value.docker_image = firstEgg.docker_image
        }
      }
    }

    pteroOptionsLoaded.value = true
    success.value = 'Pterodactyl options loaded successfully'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load Pterodactyl options'
  } finally {
    loadingPteroOptions.value = false
  }
}

function onNestChange() {
  // Reset egg selection when nest changes
  blueprint.value.egg_id = null
  blueprint.value.docker_image = ''
}

function onEggChange() {
  // Auto-fill docker image when egg changes
  if (currentEgg.value?.docker_image) {
    blueprint.value.docker_image = currentEgg.value.docker_image
  }
}

async function savePterodactylConfig() {
  savingPtero.value = true
  error.value = ''
  success.value = ''
  pteroStatus.value = null
  try {
    // Only send apiKey if user typed a new one (non-empty)
    // If empty and already configured, don't overwrite
    const apiKey = pteroConfig.value.apiKey || (pteroApiKeyConfigured.value ? undefined : '')
    await store.updatePterodactylConfig(
      pteroConfig.value.panelUrl, 
      apiKey,
      pteroConfig.value.panelType
    )
    success.value = 'Panel configuration saved successfully'
    pteroConfigured.value = true
    // Reload config to reflect actual state from backend
    await loadPterodactylConfig()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save configuration'
  } finally {
    savingPtero.value = false
  }
}

async function testPterodactyl() {
  testingPtero.value = true
  error.value = ''
  success.value = ''
  pteroStatus.value = null
  try {
    const { data } = await client.post('/admin/pterodactyl/test')
    pteroStatus.value = data
    
    if (data.success) {
      success.value = 'Pterodactyl connection successful'
      pteroConfigured.value = true
    } else {
      error.value = data.message || 'Connection failed'
      pteroConfigured.value = false
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Connection test failed'
    pteroStatus.value = { success: false, message: 'Connection test failed' }
    pteroConfigured.value = false
  } finally {
    testingPtero.value = false
  }
}
</script>
