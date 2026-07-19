<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInvoiceStore } from '@/stores/invoice'
import { useClientStore } from '@/stores/index'
import { formatCurrency, formatDateInput, GST_RATES } from '@/utils/format'

const route  = useRoute()
const router = useRouter()
const invStore = useInvoiceStore()
const cliStore = useClientStore()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const error   = ref('')

const form = ref({
  client: '', invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '', status: 'draft', type: 'invoice', gstType: 'intra',
  discount: 0, discountType: 'flat', notes: '', terms: 'Payment due within 30 days.',
  items: [{ description:'', hsn:'', quantity:1, unit:'pcs', rate:0, gstRate:18 }]
})

// Live GST calculation
const calc = computed(() => {
  let subtotal=0, totalCGST=0, totalSGST=0, totalIGST=0
  const items = form.value.items.map(item => {
    const taxable = Number(item.quantity) * Number(item.rate)
    const gst     = Number(item.gstRate)
    let cgst=0, sgst=0, igst=0
    if (form.value.gstType === 'intra') { cgst = taxable*gst/2/100; sgst = taxable*gst/2/100 }
    else igst = taxable*gst/100
    subtotal += taxable; totalCGST += cgst; totalSGST += sgst; totalIGST += igst
    return { ...item, taxableAmount:taxable, cgst, sgst, igst, totalAmount: taxable+cgst+sgst+igst }
  })
  const totalGST = totalCGST+totalSGST+totalIGST
  const pre = subtotal + totalGST
  let disc = 0
  if (form.value.discountType === 'percent') disc = pre * form.value.discount / 100
  else disc = Number(form.value.discount) || 0
  const grandTotal = Math.max(0, pre - disc)
  return { items, subtotal, totalCGST, totalSGST, totalIGST, totalGST, grandTotal }
})

function addItem() { form.value.items.push({ description:'', hsn:'', quantity:1, unit:'pcs', rate:0, gstRate:18 }) }
function removeItem(i:number) { if (form.value.items.length > 1) form.value.items.splice(i,1) }

onMounted(async () => {
  await cliStore.fetch({ type:'client', limit:200 })
  if (isEdit.value) {
    await invStore.fetchOne(route.params.id as string)
    const inv = invStore.current
    if (inv) {
      form.value = {
        client: typeof inv.client === 'string' ? inv.client : inv.client._id,
        invoiceNumber: inv.invoiceNumber, invoiceDate: formatDateInput(inv.invoiceDate),
        dueDate: formatDateInput(inv.dueDate), status: inv.status, type: inv.type,
        gstType: inv.gstType, discount: inv.discount, discountType: inv.discountType,
        notes: inv.notes, terms: inv.terms,
        items: inv.items.map(it => ({ description:it.description, hsn:it.hsn, quantity:it.quantity, unit:it.unit, rate:it.rate, gstRate:it.gstRate }))
      }
    }
  }
})

async function submit() {
  if (!form.value.client) { error.value='Please select a client'; return }
  if (!form.value.dueDate){ error.value='Please set a due date'; return }
  error.value=''; loading.value=true
  try {
    const payload = { ...form.value, items: form.value.items }
    if (isEdit.value) await invStore.update(route.params.id as string, payload)
    else await invStore.create(payload)
    router.push('/invoices')
  } catch(e:any) { error.value = e.response?.data?.message || 'Save failed' }
  finally { loading.value=false }
}
</script>

<template>
  <div class="fade-in" style="max-width:960px;">
    <div class="flex-between" style="margin-bottom:24px;">
      <div>
        <h2>{{ isEdit ? 'Edit Invoice' : 'New Invoice' }}</h2>
        <p>Fill in the details below</p>
      </div>
      <button class="btn btn-ghost" @click="router.push('/invoices')">← Back</button>
    </div>

    <div v-if="error" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--red2);border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:20px;">{{ error }}</div>

    <form @submit.prevent="submit">
      <!-- Top info -->
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-bottom:16px;">Invoice Details</h3>
        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">Client *</label>
            <select v-model="form.client" class="form-control">
              <option value="">Select client</option>
              <option v-for="c in cliStore.clients" :key="c._id" :value="c._id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Invoice #</label>
            <input v-model="form.invoiceNumber" class="form-control" placeholder="Auto-generated" />
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select v-model="form.type" class="form-control">
              <option value="invoice">Invoice</option>
              <option value="proforma">Proforma</option>
              <option value="credit_note">Credit Note</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Invoice Date *</label>
            <input v-model="form.invoiceDate" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Due Date *</label>
            <input v-model="form.dueDate" type="date" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select v-model="form.status" class="form-control">
              <option v-for="s in ['draft','sent','paid','partial','overdue','cancelled']" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">GST Type</label>
            <select v-model="form.gstType" class="form-control">
              <option value="intra">Intra-state (CGST+SGST)</option>
              <option value="inter">Inter-state (IGST)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Discount</label>
            <input v-model="form.discount" type="number" class="form-control" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Discount Type</label>
            <select v-model="form.discountType" class="form-control">
              <option value="flat">Flat (₹)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Line items -->
      <div class="card" style="margin-bottom:16px;padding:0;overflow:hidden;">
        <div class="flex-between" style="padding:16px 20px;border-bottom:1px solid var(--border);">
          <h3>Line Items</h3>
          <button type="button" class="btn btn-ghost btn-sm" @click="addItem">+ Add Item</button>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;min-width:800px;">
            <thead>
              <tr style="background:var(--bg3);">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:var(--faint);font-weight:600;text-transform:uppercase;">Description</th>
                <th style="padding:10px 8px;font-size:11px;color:var(--faint);font-weight:600;text-transform:uppercase;width:80px;">HSN</th>
                <th style="padding:10px 8px;font-size:11px;color:var(--faint);font-weight:600;text-transform:uppercase;width:70px;">Qty</th>
                <th style="padding:10px 8px;font-size:11px;color:var(--faint);font-weight:600;text-transform:uppercase;width:60px;">Unit</th>
                <th style="padding:10px 8px;font-size:11px;color:var(--faint);font-weight:600;text-transform:uppercase;width:110px;">Rate (₹)</th>
                <th style="padding:10px 8px;font-size:11px;color:var(--faint);font-weight:600;text-transform:uppercase;width:80px;">GST %</th>
                <th style="padding:10px 8px;font-size:11px;color:var(--faint);font-weight:600;text-transform:uppercase;width:120px;">Total</th>
                <th style="width:36px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in form.value?.items || form.items" :key="i" style="border-bottom:1px solid var(--border);">
                <td style="padding:8px 12px;">
                  <input v-model="item.description" class="form-control" placeholder="Item description" style="min-width:180px;" />
                </td>
                <td style="padding:8px;"><input v-model="item.hsn" class="form-control" placeholder="HSN" /></td>
                <td style="padding:8px;"><input v-model.number="item.quantity" type="number" class="form-control" min="0" /></td>
                <td style="padding:8px;">
                  <select v-model="item.unit" class="form-control">
                    <option v-for="u in ['pcs','kg','l','m','sqft','hr','day','nos']" :key="u" :value="u">{{ u }}</option>
                  </select>
                </td>
                <td style="padding:8px;"><input v-model.number="item.rate" type="number" class="form-control" min="0" /></td>
                <td style="padding:8px;">
                  <select v-model.number="item.gstRate" class="form-control">
                    <option v-for="r in GST_RATES" :key="r" :value="r">{{ r }}%</option>
                  </select>
                </td>
                <td style="padding:8px;font-family:var(--mono);font-size:13px;color:var(--paper);text-align:right;padding-right:16px;">
                  {{ formatCurrency(calc.items[i]?.totalAmount || 0) }}
                </td>
                <td style="padding:8px;">
                  <button type="button" class="btn btn-ghost btn-icon" @click="removeItem(i)" style="color:var(--red);">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- GST Summary + Grand Total -->
      <div class="grid-2" style="margin-bottom:16px;">
        <div class="card">
          <h3 style="margin-bottom:14px;">Notes & Terms</h3>
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">Notes</label>
            <textarea v-model="form.notes" class="form-control" placeholder="Additional notes..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Terms</label>
            <textarea v-model="form.terms" class="form-control"></textarea>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:14px;">GST Summary</h3>
          <div class="gst-breakdown">
            <div class="gst-row"><span class="lbl">Subtotal (Taxable)</span><span class="val">{{ formatCurrency(calc.subtotal) }}</span></div>
            <template v-if="form.gstType==='intra'">
              <div class="gst-row"><span class="lbl">CGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(calc.totalCGST) }}</span></div>
              <div class="gst-row"><span class="lbl">SGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(calc.totalSGST) }}</span></div>
            </template>
            <div v-else class="gst-row"><span class="lbl">IGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(calc.totalIGST) }}</span></div>
            <div class="gst-row"><span class="lbl">Total GST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(calc.totalGST) }}</span></div>
            <div v-if="form.discount>0" class="gst-row">
              <span class="lbl">Discount</span>
              <span class="val" style="color:var(--red);">- {{ formatCurrency(form.discountType==='percent' ? (calc.subtotal+calc.totalGST)*form.discount/100 : form.discount) }}</span>
            </div>
          </div>
          <!-- Grand Total -->
          <div class="grand-total" style="margin-top:14px;">
            <span class="label">Grand Total</span>
            <span class="amount">{{ formatCurrency(calc.grandTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex-end">
        <button type="button" class="btn btn-ghost" @click="router.push('/invoices')">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          <div v-if="loading" class="spinner" style="width:16px;height:16px;"></div>
          <span v-else>{{ isEdit ? 'Update Invoice' : 'Create Invoice' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
