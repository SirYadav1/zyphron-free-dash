<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Roles</h2>
        <p class="text-sm text-text-muted">{{ roles.length }} defined roles</p>
      </div>
      <router-link to="/admin/roles/create" class="btn-primary px-4 py-2 text-xs">Create Role</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">ID</th>
              <th class="px-5 py-3 text-label">Name</th>
              <th class="px-5 py-3 text-label">Permissions</th>
              <th class="px-5 py-3 text-label">Users</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in roles" :key="r.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-xs">{{ r.id }}</td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ r.name }}</td>
              <td class="px-5 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-for="perm in (r.permissions || []).slice(0, 4)" :key="perm" class="px-1.5 py-0.5 rounded bg-accent/5 text-accent text-[10px] font-mono">{{ perm }}</span>
                  <span v-if="(r.permissions || []).length > 4" class="text-xs text-text-muted">+{{ r.permissions.length - 4 }} more</span>
                  <span v-if="!r.permissions || r.permissions.length === 0" class="text-xs text-text-muted/40">None</span>
                </div>
              </td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ r.userCount || 0 }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-3">
                  <router-link :to="`/admin/roles/${r.id}/users`" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Users</router-link>
                  <router-link :to="`/admin/roles/${r.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="roles.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Roles Found</p>
        <p class="text-sm text-text-muted/60">Create your first role.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const roles = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/roles')
    roles.value = Array.isArray(data) ? data : data.roles || []
  } catch { /* ignore */ }
})
</script>
