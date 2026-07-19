<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import { formatCurrency, formatDate, GST_RATES } from '@/utils/format'
import { useClientStore } from '@/stores/index'

const router    = useRouter()
const cliStore  = useClientStore()
const estimates = ref<any[]>([])
const total     = ref(0)
const loading   = ref(false)
const showModal = ref(false)
const showDetail= ref(false)
const current   = ref<any>(null)
const editing   = ref<any>(null)
const saving    = ref(false)
const confirm   = ref<string|null>(null)
const converting= ref<string|null>(null)

const PROJECT_TYPES = [
  'Residential Construction','Commercial Construction','Interior Work',
  'Renovation','Road Work','Plumbing','Electrical','Painting',
  'Flooring','Roofing','Landscaping','Other'
]

const WORK_CATEGORIES = [
  'Civil Work','Masonry','Concrete','Steel / Structural',
  'Roofing','Flooring','Plumbing','Electrical',
  'Carpentry','Painting','Tiling','Waterproofing',
  'HVAC','Landscaping','Labour','Materials','Other'
]

const UNITS = ['sqft','sqm','rft','nos','kg','ton','bag','ltr','m','day','hr','ls']

const blankItem = () => ({ category:'Civil Work', description:'', unit:'sqft', quantity:0, rate:0, gstRate:18, remarks:'' })

const form = ref({
  client:'', title:'', projectType:'Residential Construction',
  projectAddress:'', estimateDate: new Date().toISOString().split('T')[0],
  validUntil:'', status:'draft', contingency:5, overhead:10, discount:0,
  notes:'', terms:'This estimate is valid for 30 days from the date of issue.',
  items: [blankItem()]
})

// Live calculation
const calc = computed(() => {
  let subtotal = 0, totalGST = 0
  const items = form.value.items.map(item => {
    const amount    = Number(item.quantity) * Number(item.rate)
    const gstAmount = amount * Number(item.gstRate) / 100
    subtotal  += amount
    totalGST  += gstAmount
    return { ...item, amount, gstAmount, totalAmount: amount + gstAmount }
  })
  const base         = subtotal + totalGST
  const contingencyAmt = base * Number(form.value.contingency) / 100
  const overheadAmt    = base * Number(form.value.overhead) / 100
  const beforeDiscount = base + contingencyAmt + overheadAmt
  const grandTotal     = Math.max(0, beforeDiscount - Number(form.value.discount))
  return { items, subtotal, totalGST, contingencyAmt, overheadAmt, grandTotal }
})

// Category subtotals
const categoryTotals = computed(() => {
  const map: Record<string, number> = {}
  calc.value.items.forEach(it => {
    map[it.category] = (map[it.category] || 0) + it.amount
  })
  return Object.entries(map).map(([cat, total]) => ({ cat, total })).sort((a,b)=>b.total-a.total)
})

import { computed } from 'vue'

async function fetchEstimates() {
  loading.value = true
  try {
    const { data } = await api.get('/estimates')
    estimates.value = data.estimates
    total.value     = data.total
  } finally { loading.value = false }
}

onMounted(async () => {
  await fetchEstimates()
  await cliStore.fetch({ type:'client', limit:200 })
})

function openNew() {
  editing.value = null
  form.value = {
    client:'', title:'', projectType:'Residential Construction',
    projectAddress:'', estimateDate: new Date().toISOString().split('T')[0],
    validUntil:'', status:'draft', contingency:5, overhead:10, discount:0,
    notes:'', terms:'This estimate is valid for 30 days from the date of issue.',
    items: [blankItem()]
  }
  showModal.value = true
}

function openEdit(est: any) {
  editing.value = est
  form.value = {
    client: typeof est.client==='string' ? est.client : est.client?._id || '',
    title: est.title, projectType: est.projectType,
    projectAddress: est.projectAddress,
    estimateDate: est.estimateDate?.split('T')[0] || '',
    validUntil: est.validUntil?.split('T')[0] || '',
    status: est.status, contingency: est.contingency,
    overhead: est.overhead, discount: est.discount,
    notes: est.notes, terms: est.terms,
    items: est.items.map((it:any) => ({
      category: it.category, description: it.description,
      unit: it.unit, quantity: it.quantity, rate: it.rate,
      gstRate: it.gstRate, remarks: it.remarks || ''
    }))
  }
  showModal.value = true
}

async function openDetail(id: string) {
  const { data } = await api.get(`/estimates/${id}`)
  current.value = data.estimate
  showDetail.value = true
}

function addItem() { form.value.items.push(blankItem()) }
function removeItem(i: number) { if (form.value.items.length > 1) form.value.items.splice(i, 1) }

function addCategory(cat: string) {
  form.value.items.push({ ...blankItem(), category: cat })
}

async function save() {
  if (!form.value.title) return
  saving.value = true
  try {
    if (editing.value) await api.put(`/estimates/${editing.value._id}`, form.value)
    else await api.post('/estimates', form.value)
    showModal.value = false
    await fetchEstimates()
  } finally { saving.value = false }
}

async function remove(id: string) {
  if (confirm.value !== id) { confirm.value = id; return }
  await api.delete(`/estimates/${id}`)
  confirm.value = null
  await fetchEstimates()
}

async function convertToInvoice(id: string) {
  converting.value = id
  try {
    const { data } = await api.post(`/estimates/${id}/convert`)
    alert(`✅ Converted! Invoice ${data.invoice.invoiceNumber} created.`)
    await fetchEstimates()
    router.push('/invoices')
  } catch(e: any) {
    alert(e.response?.data?.message || 'Conversion failed')
  } finally { converting.value = null }
}

const statusColors: Record<string,string> = {
  draft:'badge-draft', sent:'badge-sent', approved:'badge-paid',
  rejected:'badge-overdue', converted:'badge-partial'
}
</script>

<template>
  <div class="fade-in">
    <!-- Header -->
    <div class="flex-between" style="margin-bottom:24px;">
      <div>
        <h2>Construction Estimates</h2>
        <p>{{ total }} estimates — create, manage and convert to invoices</p>
      </div>
      <button class="btn btn-primary" @click="openNew">+ New Estimate</button>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px;">
      <div v-for="s in ['draft','sent','approved','rejected','converted']" :key="s"
        class="card card-sm" style="text-align:center;">
        <div style="font-size:22px;font-weight:700;font-family:var(--mono);"
          :style="{color: s==='approved'?'var(--green)':s==='rejected'?'var(--red)':s==='converted'?'var(--amber)':s==='sent'?'var(--blue)':'var(--faint)'}">
          {{ estimates.filter(e=>e.status===s).length }}
        </div>
        <div style="font-size:11px;text-transform:uppercase;color:var(--faint);margin-top:4px;">{{ s }}</div>
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0;overflow:hidden;">
      <div v-if="loading" class="loading-overlay"><div class="spinner"></div></div>
      <div v-else-if="!estimates.length" class="empty-state">
        <div class="icon">🏗️</div>
        <h3>No estimates yet</h3>
        <p>Create your first construction estimate</p>
        <button class="btn btn-primary" style="margin-top:16px;" @click="openNew">+ New Estimate</button>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Estimate #</th><th>Title</th><th>Client</th><th>Type</th>
            <th>Date</th><th>Grand Total</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="est in estimates" :key="est._id">
            <td style="font-family:var(--mono);color:var(--blue2);">{{ est.estimateNumber }}</td>
            <td class="bold">{{ est.title }}</td>
            <td>{{ est.client?.name || '—' }}</td>
            <td style="font-size:12px;color:var(--mid);">{{ est.projectType }}</td>
            <td>{{ formatDate(est.estimateDate) }}</td>
            <td style="font-family:var(--mono);font-weight:700;color:var(--paper);">{{ formatCurrency(est.grandTotal) }}</td>
            <td><span class="badge" :class="statusColors[est.status]">{{ est.status }}</span></td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-icon" title="View" @click="openDetail(est._id)">👁</button>
                <button class="btn btn-ghost btn-icon" title="Edit" @click="openEdit(est)">✏️</button>
                <button
                  v-if="est.status==='approved'"
                  class="btn btn-ghost btn-icon"
                  title="Convert to Invoice"
                  @click="convertToInvoice(est._id)"
                  :disabled="converting===est._id"
                  style="color:var(--green);"
                >{{ converting===est._id ? '⏳' : '🔄' }}</button>
                <button class="btn btn-icon" :class="confirm===est._id?'btn-danger':'btn-ghost'" @click="remove(est._id)">
                  {{ confirm===est._id ? '✓' : '🗑' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══ CREATE/EDIT MODAL ══ -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal=false">
      <div class="modal" style="max-width:1000px;width:95vw;max-height:92vh;overflow-y:auto;">
        <div class="modal-header">
          <h3>{{ editing ? 'Edit Estimate' : 'New Construction Estimate' }}</h3>
          <button class="modal-close" @click="showModal=false">✕</button>
        </div>

        <!-- Info grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">
          <div class="form-group">
            <label class="form-label">Project Title *</label>
            <input v-model="form.title" class="form-control" placeholder="e.g. 2BHK Construction" />
          </div>
          <div class="form-group">
            <label class="form-label">Client</label>
            <select v-model="form.client" class="form-control">
              <option value="">No client</option>
              <option v-for="c in cliStore.clients" :key="c._id" :value="c._id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Project Type</label>
            <select v-model="form.projectType" class="form-control">
              <option v-for="pt in PROJECT_TYPES" :key="pt" :value="pt">{{ pt }}</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Project Address</label>
            <input v-model="form.projectAddress" class="form-control" placeholder="Site address" />
          </div>
          <div class="form-group">
            <label class="form-label">Estimate Date</label>
            <input v-model="form.estimateDate" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Valid Until</label>
            <input v-model="form.validUntil" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select v-model="form.status" class="form-control">
              <option v-for="s in ['draft','sent','approved','rejected']" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- Quick add category buttons -->
        <div style="margin-bottom:12px;">
          <div style="font-size:11px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Quick Add Work Category</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <button
              v-for="cat in WORK_CATEGORIES" :key="cat"
              type="button"
              class="btn btn-ghost btn-sm"
              style="font-size:11px;padding:4px 10px;"
              @click="addCategory(cat)"
            >+ {{ cat }}</button>
          </div>
        </div>

        <!-- Line items -->
        <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:16px;">
          <div style="padding:12px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:600;color:var(--paper);">Bill of Quantities (BOQ)</span>
            <button type="button" class="btn btn-ghost btn-sm" @click="addItem">+ Add Row</button>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;min-width:900px;">
              <thead>
                <tr style="background:var(--bg3);">
                  <th style="padding:8px 10px;text-align:left;font-size:10px;color:var(--faint);font-weight:600;text-transform:uppercase;width:120px;">Category</th>
                  <th style="padding:8px 10px;text-align:left;font-size:10px;color:var(--faint);font-weight:600;text-transform:uppercase;">Description</th>
                  <th style="padding:8px 6px;font-size:10px;color:var(--faint);font-weight:600;text-transform:uppercase;width:60px;">Unit</th>
                  <th style="padding:8px 6px;font-size:10px;color:var(--faint);font-weight:600;text-transform:uppercase;width:70px;">Qty</th>
                  <th style="padding:8px 6px;font-size:10px;color:var(--faint);font-weight:600;text-transform:uppercase;width:100px;">Rate (₹)</th>
                  <th style="padding:8px 6px;font-size:10px;color:var(--faint);font-weight:600;text-transform:uppercase;width:70px;">GST %</th>
                  <th style="padding:8px 6px;font-size:10px;color:var(--faint);font-weight:600;text-transform:uppercase;width:110px;">Amount</th>
                  <th style="padding:8px 6px;font-size:10px;color:var(--faint);font-weight:600;text-transform:uppercase;width:110px;">Total+GST</th>
                  <th style="width:32px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in form.items" :key="i"
                  style="border-bottom:1px solid var(--border);"
                  :style="{background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.01)'}">
                  <td style="padding:6px;">
                    <select v-model="item.category" class="form-control" style="font-size:11px;padding:6px 8px;">
                      <option v-for="c in WORK_CATEGORIES" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </td>
                  <td style="padding:6px;">
                    <input v-model="item.description" class="form-control" placeholder="Work description" style="min-width:160px;" />
                  </td>
                  <td style="padding:6px;">
                    <select v-model="item.unit" class="form-control" style="font-size:11px;padding:6px 8px;">
                      <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
                    </select>
                  </td>
                  <td style="padding:6px;"><input v-model.number="item.quantity" type="number" class="form-control" min="0" /></td>
                  <td style="padding:6px;"><input v-model.number="item.rate" type="number" class="form-control" min="0" /></td>
                  <td style="padding:6px;">
                    <select v-model.number="item.gstRate" class="form-control" style="font-size:11px;">
                      <option v-for="r in GST_RATES" :key="r" :value="r">{{ r }}%</option>
                    </select>
                  </td>
                  <td style="padding:6px;font-family:var(--mono);font-size:12px;color:var(--mid);text-align:right;padding-right:10px;">
                    {{ formatCurrency(calc.items[i]?.amount || 0) }}
                  </td>
                  <td style="padding:6px;font-family:var(--mono);font-size:12px;color:var(--paper);font-weight:600;text-align:right;padding-right:10px;">
                    {{ formatCurrency(calc.items[i]?.totalAmount || 0) }}
                  </td>
                  <td style="padding:6px;">
                    <button type="button" class="btn btn-ghost btn-icon" @click="removeItem(i)" style="color:var(--red);width:28px;height:28px;">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Category breakdown -->
        <div v-if="categoryTotals.length" style="margin-bottom:16px;">
          <div style="font-size:12px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Category Breakdown</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <div v-for="ct in categoryTotals" :key="ct.cat"
              style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px 12px;display:flex;flex-direction:column;gap:3px;">
              <div style="font-size:11px;color:var(--mid);">{{ ct.cat }}</div>
              <div style="font-size:13px;font-weight:600;color:var(--paper);font-family:var(--mono);">{{ formatCurrency(ct.total) }}</div>
            </div>
          </div>
        </div>

        <!-- Adjustments + Grand Total -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div class="card card-sm">
            <div style="font-weight:600;color:var(--paper);margin-bottom:12px;">Adjustments</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div class="form-group" style="flex-direction:row;align-items:center;justify-content:space-between;">
                <label class="form-label" style="margin:0;">Contingency %</label>
                <input v-model.number="form.contingency" type="number" class="form-control" style="width:80px;" min="0" max="50" />
              </div>
              <div class="form-group" style="flex-direction:row;align-items:center;justify-content:space-between;">
                <label class="form-label" style="margin:0;">Overhead %</label>
                <input v-model.number="form.overhead" type="number" class="form-control" style="width:80px;" min="0" max="50" />
              </div>
              <div class="form-group" style="flex-direction:row;align-items:center;justify-content:space-between;">
                <label class="form-label" style="margin:0;">Discount (₹)</label>
                <input v-model.number="form.discount" type="number" class="form-control" style="width:80px;" min="0" />
              </div>
            </div>
          </div>

          <div class="card card-sm">
            <div style="font-weight:600;color:var(--paper);margin-bottom:12px;">Cost Summary</div>
            <div class="gst-breakdown">
              <div class="gst-row"><span class="lbl">Base Cost</span><span class="val">{{ formatCurrency(calc.subtotal) }}</span></div>
              <div class="gst-row"><span class="lbl">GST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(calc.totalGST) }}</span></div>
              <div class="gst-row"><span class="lbl">Contingency ({{ form.contingency }}%)</span><span class="val">{{ formatCurrency(calc.contingencyAmt) }}</span></div>
              <div class="gst-row"><span class="lbl">Overhead ({{ form.overhead }}%)</span><span class="val">{{ formatCurrency(calc.overheadAmt) }}</span></div>
              <div v-if="form.discount>0" class="gst-row"><span class="lbl">Discount</span><span class="val" style="color:var(--red);">− {{ formatCurrency(form.discount) }}</span></div>
            </div>
            <div class="grand-total" style="margin-top:10px;">
              <span class="label">Grand Total</span>
              <span class="amount">{{ formatCurrency(calc.grandTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Notes & Terms -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div class="form-group">
            <label class="form-label">Notes / Scope of Work</label>
            <textarea v-model="form.notes" class="form-control" rows="4" placeholder="Describe scope, inclusions, exclusions..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Terms & Conditions</label>
            <textarea v-model="form.terms" class="form-control" rows="4"></textarea>
          </div>
        </div>

        <div class="flex-end">
          <button class="btn btn-ghost" @click="showModal=false">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">
            <div v-if="saving" class="spinner" style="width:14px;height:14px;"></div>
            <span v-else>{{ editing ? 'Update Estimate' : 'Save Estimate' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ══ DETAIL VIEW MODAL ══ -->
    <div v-if="showDetail && current" class="modal-backdrop" @click.self="showDetail=false">
      <div class="modal" style="max-width:900px;width:95vw;max-height:92vh;overflow-y:auto;" id="est-print">
        <div class="modal-header">
          <h3>{{ current.estimateNumber }} — {{ current.title }}</h3>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" @click="() => window.print()">🖨 Print</button>
            <button class="modal-close" @click="showDetail=false">✕</button>
          </div>
        </div>

        <!-- Project info -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;padding:16px;background:var(--bg3);border-radius:12px;">
          <div>
            <div style="font-size:11px;color:var(--faint);text-transform:uppercase;margin-bottom:6px;">Project Details</div>
            <div style="font-size:16px;font-weight:700;color:var(--paper);">{{ current.title }}</div>
            <div style="font-size:13px;color:var(--mid);margin-top:2px;">{{ current.projectType }}</div>
            <div v-if="current.projectAddress" style="font-size:12px;color:var(--faint);margin-top:4px;">📍 {{ current.projectAddress }}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--faint);text-transform:uppercase;margin-bottom:6px;">Client & Dates</div>
            <div style="font-size:14px;color:var(--paper);">{{ current.client?.name || '—' }}</div>
            <div style="font-size:12px;color:var(--mid);">Date: {{ formatDate(current.estimateDate) }}</div>
            <div style="font-size:12px;color:var(--mid);">Valid: {{ current.validUntil ? formatDate(current.validUntil) : '—' }}</div>
          </div>
        </div>

        <!-- BOQ table -->
        <div style="font-size:13px;font-weight:600;color:var(--paper);margin-bottom:10px;">Bill of Quantities</div>
        <table class="gst-table" style="margin-bottom:20px;font-size:12px;">
          <thead>
            <tr>
              <th>#</th><th>Category</th><th>Description</th><th>Unit</th>
              <th>Qty</th><th>Rate</th><th>Amount</th><th>GST</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in current.items" :key="i">
              <td>{{ i+1 }}</td>
              <td><span class="badge badge-draft" style="font-size:10px;">{{ item.category }}</span></td>
              <td>{{ item.description }}</td>
              <td>{{ item.unit }}</td>
              <td style="font-family:var(--mono);">{{ item.quantity }}</td>
              <td style="font-family:var(--mono);">{{ formatCurrency(item.rate) }}</td>
              <td style="font-family:var(--mono);">{{ formatCurrency(item.amount) }}</td>
              <td style="font-family:var(--mono);color:var(--amber);">{{ formatCurrency(item.gstAmount) }} ({{ item.gstRate }}%)</td>
              <td style="font-family:var(--mono);font-weight:600;">{{ formatCurrency(item.totalAmount) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:20px;">
          <div style="width:320px;">
            <div class="gst-breakdown">
              <div class="gst-row"><span class="lbl">Base Cost</span><span class="val">{{ formatCurrency(current.subtotal) }}</span></div>
              <div class="gst-row"><span class="lbl">Total GST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(current.totalGST) }}</span></div>
              <div class="gst-row"><span class="lbl">Contingency ({{ current.contingency }}%)</span><span class="val">{{ formatCurrency(current.contingencyAmt) }}</span></div>
              <div class="gst-row"><span class="lbl">Overhead ({{ current.overhead }}%)</span><span class="val">{{ formatCurrency(current.overheadAmt) }}</span></div>
              <div v-if="current.discount>0" class="gst-row"><span class="lbl">Discount</span><span class="val" style="color:var(--red);">− {{ formatCurrency(current.discount) }}</span></div>
            </div>
            <div class="grand-total" style="margin-top:10px;">
              <span class="label">Grand Total Estimate</span>
              <span class="amount">{{ formatCurrency(current.grandTotal) }}</span>
            </div>
          </div>
        </div>

        <div v-if="current.notes" style="margin-bottom:12px;">
          <div style="font-size:11px;color:var(--faint);text-transform:uppercase;margin-bottom:6px;">Notes</div>
          <p style="font-size:13px;">{{ current.notes }}</p>
        </div>
        <div v-if="current.terms">
          <div style="font-size:11px;color:var(--faint);text-transform:uppercase;margin-bottom:6px;">Terms</div>
          <p style="font-size:13px;">{{ current.terms }}</p>
        </div>

        <div class="flex-end" style="margin-top:20px;">
          <button class="btn btn-ghost" @click="openEdit(current);showDetail=false">✏️ Edit</button>
          <button v-if="current.status==='approved'" class="btn btn-success" @click="convertToInvoice(current._id);showDetail=false">
            🔄 Convert to Invoice
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  .sidebar,.topbar,.modal-backdrop > *:not(#est-print){display:none!important;}
  #est-print{position:fixed;inset:0;max-width:100%;max-height:100%;border-radius:0;}
}
</style>
