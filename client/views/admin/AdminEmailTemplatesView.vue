<template>
  <div class="space-y-6">
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
        <table class="w-full text-sm min-w-[640px]">
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
              class="border-b border-border/50 hover:bg-surface-hover transition-colors"
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
                    class="text-xs font-bold text-accent hover:text-text-primary transition-colors"
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
      <div v-if="loading" class="py-10 px-6 space-y-4" aria-busy="true" aria-live="polite">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4">
          <div class="skeleton w-40 h-4"></div>
          <div class="skeleton w-20 h-4 hidden sm:block"></div>
          <div class="skeleton h-4 flex-1 hidden sm:block"></div>
          <div class="skeleton w-24 h-6 shrink-0"></div>
        </div>
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
                  <span v-else class="text-xs text-green-400 font-bold shrink-0">Installed</span>
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

// test email state
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

// ── Pre-built templates: shared professional email shell ─────────────
// Table-based layout, solid colors only (no gradients — Gmail/Outlook safe),
// light body with brand-blue accent. Renders correctly in all major clients.
const EMAIL_ACCENT = '#2563eb'
const SUCCESS = '#059669'
const WARNING = '#d97706'
const DANGER = '#dc2626'

function emailShell({ accent = EMAIL_ACCENT, tagline, body }) {
  return `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border-collapse:separate;border-spacing:0;">
    <tr>
      <td style="background:${accent};padding:26px 32px;border-radius:12px 12px 0 0;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">{{company_name}}</p>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.78);">${tagline}</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
${body}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 8px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">You are receiving this email because of activity on your {{company_name}} account.</p>
        <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">&copy; {{company_name}} &middot; <a href="{{dashboard_url}}" style="color:${EMAIL_ACCENT};text-decoration:none;">Open Dashboard</a></p>
      </td>
    </tr>
  </table>
</div>`
}

function ep(html) { return `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">${html}</p>` }
function est(t) { return `<strong style="color:#0f172a;">${t}</strong>` }
function ecenter(html) { return `<div style="text-align:center;margin:28px 0;">${html}</div>` }
function ebtn(url, label, color = EMAIL_ACCENT) {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>`
}
function ebox(title, rows, color = EMAIL_ACCENT) {
  const rowsHtml = rows.map(([k, v]) =>
    `<p style="margin:6px 0;font-size:13px;color:#334155;"><span style="color:#64748b;">${k}:</span> <strong style="color:#0f172a;">${v}</strong></p>`
  ).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:20px 0;border-collapse:separate;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${color};">${title}</p>
          ${rowsHtml}
        </td></tr>
      </table>`
}

const prebuiltTemplates = [
  {
    name: 'Welcome Email',
    type: 'welcome',
    subject: 'Welcome to {{company_name}}',
    body: emailShell({
      tagline: 'Your account is ready',
      body: ep(`Hi ${est('{{user_name}}')},`) +
        ep('Welcome aboard! Your account has been created successfully. Here is what you can do:') +
        `<ul style="margin:0 0 16px;padding:0 0 0 20px;">
            <li style="font-size:14px;line-height:1.8;color:#475569;">Deploy free game servers instantly</li>
            <li style="font-size:14px;line-height:1.8;color:#475569;">Earn coins through daily activity and AFK sessions</li>
            <li style="font-size:14px;line-height:1.8;color:#475569;">Upgrade server resources as you grow</li>
            <li style="font-size:14px;line-height:1.8;color:#475569;">Get support through the ticket system</li>
          </ul>` +
        ecenter(ebtn('{{dashboard_url}}', 'Go to Dashboard')) +
        ep('If you have any questions, our support team is always ready to help.')
    }),
  },
  {
    name: 'Password Reset',
    type: 'password_reset',
    subject: 'Reset your password — {{company_name}}',
    body: emailShell({
      tagline: 'Password reset request',
      body: ep(`Hi ${est('{{user_name}}')},`) +
        ep('We received a request to reset the password for your account. Click the button below to choose a new password:') +
        ecenter(ebtn('{{reset_url}}', 'Reset Password')) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:20px 0;border-collapse:separate;">
        <tr><td style="padding:14px 20px;">
          <p style="margin:0;font-size:13px;color:#475569;">This link <strong style="color:#0f172a;">expires in 1 hour</strong>.</p>
          <p style="margin:8px 0 0;font-size:13px;color:#475569;">If you did not request a password reset, you can safely ignore this email — your current password will keep working.</p>
        </td></tr>
      </table>`
    }),
  },
  {
    name: 'Server Suspended',
    type: 'server_suspended',
    subject: 'Your server "{{server_name}}" has been suspended',
    body: emailShell({
      accent: DANGER,
      tagline: 'Action required',
      body: ep(`Hi ${est('{{user_name}}')},`) +
        ep(`Your server ${est('{{server_name}}')} has been suspended.`) +
        ebox('Server Details', [['Server', '{{server_name}}'], ['Reason', '{{reason}}'], ['Date', '{{date}}']], DANGER) +
        ep('To restore your server, renew it from the dashboard or contact our support team if you believe this was a mistake.') +
        ecenter(ebtn('{{dashboard_url}}', 'View Server', DANGER))
    }),
  },
  {
    name: 'Server Deployed',
    type: 'server_deployed',
    subject: 'Your server "{{server_name}}" is ready',
    body: emailShell({
      accent: SUCCESS,
      tagline: 'Deployment successful',
      body: ep(`Hi ${est('{{user_name}}')},`) +
        ep(`Great news — your server ${est('{{server_name}}')} is now live and ready to use.`) +
        ebox('Server Specifications', [['RAM', '{{ram}}'], ['CPU', '{{cpu}}'], ['Disk', '{{disk}}'], ['Expires', '{{expires_at}}']], SUCCESS) +
        ecenter(ebtn('{{panel_url}}', 'Open Server Panel', SUCCESS))
    }),
  },
  {
    name: 'Server Expiring Soon',
    type: 'server_expiring',
    subject: 'Your server "{{server_name}}" expires in {{days_left}} days',
    body: emailShell({
      accent: WARNING,
      tagline: 'Renewal required',
      body: ep(`Hi ${est('{{user_name}}')},`) +
        ep(`Your server ${est('{{server_name}}')} will expire in <strong style="color:${WARNING};">{{days_left}} days</strong>.`) +
        ebox('Renewal Details', [['Renewal cost', '{{renewal_price}} coins'], ['Expires', '{{expires_at}}']], WARNING) +
        ep('Renew now to keep your server running. If the server expires, it will be suspended and data may be lost.') +
        ecenter(ebtn('{{renew_url}}', 'Renew Server', WARNING))
    }),
  },
  {
    name: 'Payment Received',
    type: 'payment_received',
    subject: 'Payment confirmed — {{amount}} coins added',
    body: emailShell({
      accent: SUCCESS,
      tagline: 'Payment received',
      body: ep(`Hi ${est('{{user_name}}')},`) +
        ep('Your payment has been confirmed and the following amount has been added to your account.') +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:20px 0;border-collapse:separate;">
        <tr><td style="padding:24px 20px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${SUCCESS};">Amount Added</p>
          <p style="margin:0;font-size:30px;font-weight:700;color:${SUCCESS};">{{amount}} coins</p>
        </td></tr>
      </table>` +
        ecenter(ebtn('{{dashboard_url}}', 'View Balance', SUCCESS))
    }),
  },
  {
    name: 'Ticket Created',
    type: 'ticket_created',
    subject: 'Ticket #{{ticket_id}} — we received your request',
    body: emailShell({
      tagline: 'Support ticket received',
      body: ep(`Hi ${est('{{user_name}}')},`) +
        ep('We have received your support ticket. Our team will review it and get back to you shortly.') +
        ebox('Ticket Details', [['Ticket', '#{{ticket_id}}'], ['Subject', '{{subject}}'], ['Priority', '{{priority}}']]) +
        ep('Average first response time is 1–2 hours.')
    }),
  },
  {
    name: 'Account Banned',
    type: 'account_banned',
    subject: 'Your account has been suspended',
    body: emailShell({
      accent: DANGER,
      tagline: 'Account suspended',
      body: ep(`Hi ${est('{{user_name}}')},`) +
        ep('Your account has been suspended due to a violation of our terms of service.') +
        ebox('Details', [['Reason', '{{reason}}'], ['Date', '{{date}}']], DANGER) +
        ep('If you believe this is an error, please contact our support team to appeal this decision.')
    }),
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
    ticket_created: 'bg-blue-500/15 text-blue-400',
    ticket_replied: 'bg-sky-500/15 text-sky-400',
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
