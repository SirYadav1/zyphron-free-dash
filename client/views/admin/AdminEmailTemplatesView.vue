<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Email Templates</h2>
        <p class="text-sm text-text-muted">{{ templates.length }} templates configured</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="showPrebuiltModal = true" class="btn-secondary px-4 py-2 text-xs inline-flex items-center gap-2">
          <Layers :size="14" :stroke-width="2" />
          Pre-built Templates
        </button>
        <router-link to="/admin/email-templates/create" class="btn-primary px-4 py-2 text-xs inline-flex items-center gap-2">
          <Plus :size="14" :stroke-width="2" />
          Create Template
        </router-link>
      </div>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2"><AlertTriangle :size="14" :stroke-width="2.5" /> {{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent flex items-center gap-2"><CheckCircle :size="14" :stroke-width="2.5" /> {{ success }}</div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Name</th>
              <th class="px-5 py-3 text-label">Type</th>
              <th class="px-5 py-3 text-label">Subject</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="template in templates"
              :key="template.id"
              class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ template.name }}</td>
              <td class="px-5 py-3">
                <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  :class="getTypeBadgeClass(template.type)">
                  {{ formatType(template.type) }}
                </span>
              </td>
              <td class="px-5 py-3 max-w-[300px] truncate text-text-muted text-sm">{{ template.subject }}</td>
              <td class="px-5 py-3">
                <span
                  class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="template.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'"
                >
                  {{ template.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex gap-3 justify-end">
                  <button
                    @click="openTestModal(template)"
                    class="text-xs font-bold text-green-400 hover:text-green-300 transition-colors"
                  >Test</button>
                  <router-link
                    :to="`/admin/email-templates/${template.id}/edit`"
                    class="text-xs font-bold text-accent hover:text-white transition-colors"
                  >Edit</router-link>
                  <button
                    @click="handleDelete(template)"
                    class="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                  >Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="templates.length === 0 && !loading" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Templates Found</p>
        <p class="text-sm text-text-muted/60">Create your first email template or use pre-built templates.</p>
      </div>
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- Pre-built Templates Modal -->
    <Teleport to="body">
      <div v-if="showPrebuiltModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" @click.self="showPrebuiltModal = false">
        <div class="bg-base border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h3 class="text-lg font-bold text-text-primary">Pre-built Email Templates</h3>
              <p class="text-xs text-text-muted mt-0.5">Professional templates ready to use — click to install</p>
            </div>
            <button @click="showPrebuiltModal = false" class="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
              <X :size="18" :stroke-width="2" />
            </button>
          </div>

          <!-- Templates Grid -->
          <div class="flex-1 overflow-y-auto p-6 space-y-3">
            <div v-if="installing" class="flex items-center justify-center py-8">
              <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
            <template v-else>
              <div
                v-for="(tpl, index) in prebuiltTemplates"
                :key="tpl.name"
                class="bg-surface border border-border rounded-xl p-4 hover:border-accent/30 transition-all"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        :class="getTypeBadgeClass(tpl.type)">
                        {{ formatType(tpl.type) }}
                      </span>
                      <span v-if="isInstalled(tpl.name)" class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400">
                        Installed
                      </span>
                    </div>
                    <p class="text-sm font-bold text-text-primary">{{ tpl.name }}</p>
                    <p class="text-xs text-text-muted mt-0.5">Subject: {{ tpl.subject }}</p>
                  </div>
                  <button
                    v-if="!isInstalled(tpl.name)"
                    @click="installTemplate(tpl)"
                    class="btn-primary px-4 py-1.5 text-xs shrink-0"
                  >
                    Install
                  </button>
                  <span v-else class="text-xs text-green-400 font-bold shrink-0">✓ Installed</span>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-border">
            <button @click="showPrebuiltModal = false" class="btn-secondary px-6 py-2 text-xs w-full">Close</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Test Email Modal -->
    <Teleport to="body">
      <div v-if="showTestModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" @click.self="closeTestModal">
        <div class="bg-base border border-border rounded-2xl shadow-2xl w-full max-w-md">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h3 class="text-lg font-bold text-text-primary">Test Email Template</h3>
              <p class="text-xs text-text-muted mt-0.5">Send a test email to verify the template</p>
            </div>
            <button @click="closeTestModal" class="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
              <X :size="18" :stroke-width="2" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-text-muted mb-1.5">Template</label>
              <div class="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary font-bold">
                {{ testTemplateName }}
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-text-muted mb-1.5">Send Test To</label>
              <input
                v-model="testEmail"
                type="email"
                placeholder="receiver@example.com"
                class="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div v-if="testError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-400">
              {{ testError }}
            </div>
            <div v-if="testSuccess" class="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-bold text-green-400">
              {{ testSuccess }}
            </div>
          </div>
          <div class="px-6 py-4 border-t border-border flex gap-3">
            <button @click="closeTestModal" class="btn-secondary px-4 py-2 text-xs flex-1">Cancel</button>
            <button
              @click="sendTestEmail"
              :disabled="!testEmail || testSending"
              class="btn-primary px-4 py-2 text-xs flex-1 inline-flex items-center justify-center gap-2"
            >
              <div v-if="testSending" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <Send v-else :size="14" :stroke-width="2" />
              {{ testSending ? 'Sending...' : 'Send Test' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'
import { AlertTriangle, CheckCircle, Layers, Plus, X, Send } from 'lucide-vue-next'

const templates = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const showPrebuiltModal = ref(false)
const installing = ref(false)

// Test email state
const showTestModal = ref(false)
const testTemplateId = ref(null)
const testTemplateName = ref('')
const testEmail = ref('')
const testSending = ref(false)
const testError = ref('')
const testSuccess = ref('')

const templateTypes = [
  'welcome',
  'password_reset',
  'server_suspended',
  'server_renewed',
  'payment_received',
  'ticket_created',
  'ticket_replied',
  'invoice_generated',
  '2fa_enabled',
  'account_banned',
  'account_unbanned',
  'server_deployed',
  'server_expiring',
  'credit_purchase',
  'newsletter',
]

const prebuiltTemplates = [
  {
    name: 'Welcome Email',
    type: 'welcome',
    subject: 'Welcome to {{company_name}}! 🎉',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0;">
  <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Welcome to {{company_name}}!</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px;">Your account has been created successfully</p>
  </div>
  <div style="padding: 40px 30px; background: #12121a; border-radius: 0 0 16px 16px;">
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Hi <strong style="color: #e2e8f0;">{{user_name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Welcome aboard! Your account is now ready. Here's what you can do:</p>
    <div style="background: #0a0a0f; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 8px 0; color: #94a3b8;">🖥️ Deploy free servers instantly</p>
      <p style="margin: 8px 0; color: #94a3b8;">💰 Earn coins by being active</p>
      <p style="margin: 8px 0; color: #94a3b8;">⚡ Upgrade your server resources</p>
      <p style="margin: 8px 0; color: #94a3b8;">🎫 Get support via tickets</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: #10b981; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Go to Dashboard</a>
    </div>
    <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
  </div>
</div>`,
  },
  {
    name: 'Password Reset',
    type: 'password_reset',
    subject: 'Reset your password — {{company_name}}',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0;">
  <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Password Reset</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px;">We received a request to reset your password</p>
  </div>
  <div style="padding: 40px 30px; background: #12121a; border-radius: 0 0 16px 16px;">
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Hi <strong style="color: #e2e8f0;">{{user_name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_url}}" style="background: #f59e0b; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Reset Password</a>
    </div>
    <div style="background: #0a0a0f; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #64748b;">⏰ This link expires in 1 hour</p>
      <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">🔒 If you didn't request this, ignore this email</p>
    </div>
  </div>
</div>`,
  },
  {
    name: 'Server Suspended',
    type: 'server_suspended',
    subject: 'Your server "{{server_name}}" has been suspended',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0;">
  <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Server Suspended</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px;">Action required to restore your server</p>
  </div>
  <div style="padding: 40px 30px; background: #12121a; border-radius: 0 0 16px 16px;">
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Hi <strong style="color: #e2e8f0;">{{user_name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Your server <strong style="color: #e2e8f0;">{{server_name}}</strong> has been suspended.</p>
    <div style="background: #0a0a0f; border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">📋 <strong>Server Details</strong></p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Name: {{server_name}}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Reason: {{reason}}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Date: {{date}}</p>
    </div>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">To restore your server, please contact our support team or renew your subscription.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: #ef4444; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Server</a>
    </div>
  </div>
</div>`,
  },
  {
    name: 'Server Deployed',
    type: 'server_deployed',
    subject: 'Your server "{{server_name}}" is ready! 🚀',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0;">
  <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Server Ready! 🚀</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px;">Your server has been successfully deployed</p>
  </div>
  <div style="padding: 40px 30px; background: #12121a; border-radius: 0 0 16px 16px;">
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Hi <strong style="color: #e2e8f0;">{{user_name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Great news! Your server <strong style="color: #e2e8f0;">{{server_name}}</strong> is now live and ready to use.</p>
    <div style="background: #0a0a0f; border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 12px; font-size: 13px; color: #64748b;">📋 <strong>Server Specs</strong></p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">🖥️ RAM: {{ram}}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">⚡ CPU: {{cpu}}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">💾 Disk: {{disk}}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">📅 Expires: {{expires_at}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{panel_url}}" style="background: #10b981; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Open Server Panel</a>
    </div>
  </div>
</div>`,
  },
  {
    name: 'Server Expiring Soon',
    type: 'server_expiring',
    subject: 'Your server "{{server_name}}" expires in {{days_left}} days',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0;">
  <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Server Expiring Soon</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px;">Renew before it's too late</p>
  </div>
  <div style="padding: 40px 30px; background: #12121a; border-radius: 0 0 16px 16px;">
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Hi <strong style="color: #e2e8f0;">{{user_name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Your server <strong style="color: #e2e8f0;">{{server_name}}</strong> will expire in <strong style="color: #f59e0b;">{{days_left}} days</strong>.</p>
    <div style="background: #0a0a0f; border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 12px; font-size: 13px; color: #64748b;">📋 <strong>Renewal Details</strong></p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">💰 Cost: {{renewal_price}} coins</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">📅 Expires: {{expires_at}}</p>
    </div>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Renew now to keep your server running. If not renewed, your server will be suspended and data may be lost.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{renew_url}}" style="background: #f59e0b; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Renew Server</a>
    </div>
  </div>
</div>`,
  },
  {
    name: 'Payment Received',
    type: 'payment_received',
    subject: 'Payment confirmed — {{amount}} coins added',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0;">
  <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Payment Confirmed! 💰</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px;">Your coins have been added</p>
  </div>
  <div style="padding: 40px 30px; background: #12121a; border-radius: 0 0 16px 16px;">
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Hi <strong style="color: #e2e8f0;">{{user_name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Your payment has been confirmed and <strong style="color: #10b981;">{{amount}} coins</strong> have been added to your account.</p>
    <div style="background: #0a0a0f; border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">💰 <strong>Amount Added</strong></p>
      <p style="margin: 0; font-size: 32px; font-weight: 800; color: #10b981;">{{amount}} coins</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_url}}" style="background: #10b981; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Balance</a>
    </div>
  </div>
</div>`,
  },
  {
    name: 'Ticket Created',
    type: 'ticket_created',
    subject: 'Ticket #{{ticket_id}} — We received your request',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0;">
  <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Ticket Received</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 14px;">We'll get back to you soon</p>
  </div>
  <div style="padding: 40px 30px; background: #12121a; border-radius: 0 0 16px 16px;">
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Hi <strong style="color: #e2e8f0;">{{user_name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">We've received your support ticket and our team will review it shortly.</p>
    <div style="background: #0a0a0f; border: 1px solid rgba(139,92,246,0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 12px; font-size: 13px; color: #64748b;">🎫 <strong>Ticket Details</strong></p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">ID: #{{ticket_id}}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Subject: {{subject}}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">Priority: {{priority}}</p>
    </div>
    <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 20px;">Average response time: 1-2 hours</p>
  </div>
</div>`,
  },
  {
    name: 'Account Banned',
    type: 'account_banned',
    subject: 'Your account has been suspended',
    body: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0;">
  <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Account Suspended</h1>
  </div>
  <div style="padding: 40px 30px; background: #12121a; border-radius: 0 0 16px 16px;">
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Hi <strong style="color: #e2e8f0;">{{user_name}}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.7; color: #94a3b8;">Your account has been suspended due to a violation of our terms of service.</p>
    <div style="background: #0a0a0f; border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">📋 Reason: {{reason}}</p>
      <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">📅 Date: {{date}}</p>
    </div>
    <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 20px;">If you believe this is an error, please contact support.</p>
  </div>
</div>`,
  },
]

function formatType(type) {
  return type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''
}

function getTypeBadgeClass(type) {
  const map = {
    welcome: 'bg-green-500/15 text-green-400',
    password_reset: 'bg-yellow-500/15 text-yellow-400',
    server_suspended: 'bg-red-500/15 text-red-400',
    server_renewed: 'bg-blue-500/15 text-blue-400',
    payment_received: 'bg-emerald-500/15 text-emerald-400',
    ticket_created: 'bg-purple-500/15 text-purple-400',
    ticket_replied: 'bg-indigo-500/15 text-indigo-400',
    invoice_generated: 'bg-cyan-500/15 text-cyan-400',
    '2fa_enabled': 'bg-orange-500/15 text-orange-400',
    account_banned: 'bg-red-600/15 text-red-300',
    account_unbanned: 'bg-green-600/15 text-green-300',
    server_deployed: 'bg-emerald-500/15 text-emerald-400',
    server_expiring: 'bg-amber-500/15 text-amber-400',
    credit_purchase: 'bg-yellow-500/15 text-yellow-400',
    newsletter: 'bg-cyan-500/15 text-cyan-400',
  }
  return map[type] || 'bg-gray-500/15 text-gray-400'
}

function isInstalled(name) {
  return templates.value.some(t => t.name === name)
}

async function loadTemplates() {
  loading.value = true
  try {
    const { data } = await client.get('/admin/email-templates')
    templates.value = Array.isArray(data) ? data : data.templates || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load templates'
  } finally {
    loading.value = false
  }
}

async function installTemplate(tpl) {
  installing.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post('/admin/email-templates', {
      name: tpl.name,
      subject: tpl.subject,
      body: tpl.body,
      type: tpl.type,
      is_active: true,
    })
    success.value = `"${tpl.name}" template installed successfully!`
    await loadTemplates()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to install template'
  } finally {
    installing.value = false
  }
}

async function handleDelete(template) {
  if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return
  error.value = ''
  success.value = ''
  try {
    await client.delete(`/admin/email-templates/${template.id}`)
    success.value = 'Template deleted'
    await loadTemplates()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete template'
  }
}

function openTestModal(template) {
  testTemplateId.value = template.id
  testTemplateName.value = template.name
  testEmail.value = ''
  testError.value = ''
  testSuccess.value = ''
  showTestModal.value = true
}

function closeTestModal() {
  showTestModal.value = false
  testTemplateId.value = null
  testTemplateName.value = ''
  testEmail.value = ''
  testError.value = ''
  testSuccess.value = ''
}

async function sendTestEmail() {
  if (!testEmail.value || !testTemplateId.value) return
  testSending.value = true
  testError.value = ''
  testSuccess.value = ''
  try {
    const { data } = await client.post(`/admin/email-templates/${testTemplateId.value}/test`, {
      email: testEmail.value,
    })
    if (data.error) {
      testError.value = data.message
    } else {
      testSuccess.value = data.message
    }
  } catch (err) {
    testError.value = err.response?.data?.message || 'Failed to send test email'
  } finally {
    testSending.value = false
  }
}

onMounted(() => loadTemplates())
</script>
