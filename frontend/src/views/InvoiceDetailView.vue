<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInvoiceStore } from '@/stores/invoice'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency, formatDate } from '@/utils/format'

const route  = useRoute()
const router = useRouter()
const store  = useInvoiceStore()
const auth   = useAuthStore()

const showPayModal = ref(false)
const payment = ref({ amountPaid: 0, paymentMethod: 'bank', paymentDate: new Date().toISOString().split('T')[0], paymentRef: '' })
const payLoading = ref(false)

onMounted(() => store.fetchOne(route.params.id as string))
const inv = computed(() => store.current)
const client = computed(() => inv.value?.client as any)
const user   = computed(() => auth.user)

async function submitPayment() {
  payLoading.value = true
  try {
    await store.recordPayment(route.params.id as string, payment.value)
    showPayModal.value = false
    await store.fetchOne(route.params.id as string)
  } finally { payLoading.value = false }
}
function printInvoice() { window.print() }
</script>

<template>
  <div class="fade-in">
    <div v-if="store.loading" class="loading-overlay"><div class="spinner" style="width:36px;height:36px;"></div></div>
    <template v-else-if="inv">
      <!-- Actions bar -->
      <div class="flex-between" style="margin-bottom:24px;" class="no-print">
        <button class="btn btn-ghost" @click="router.push('/invoices')">← Back</button>
        <div class="flex gap-3">
          <button class="btn btn-ghost" @click="printInvoice">🖨 Print</button>
          <button v-if="inv.status!=='paid'" class="btn btn-success" @click="showPayModal=true">💳 Record Payment</button>
          <router-link :to="`/invoices/${inv._id}/edit`" class="btn btn-primary">✏️ Edit</router-link>
        </div>
      </div>

      <!-- Invoice paper -->
      <div class="card" id="invoice-paper" style="max-width:820px;margin:0 auto;padding:40px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
          <div>
            <div style="font-size:28px;font-weight:800;color:var(--paper);letter-spacing:-.02em;">{{ user?.businessName || user?.name }}</div>
            <div style="font-size:13px;color:var(--mid);margin-top:4px;">{{ user?.address }}</div>
            <div style="font-size:13px;color:var(--mid);">{{ user?.email }}</div>
            <div v-if="user?.gstin" style="font-size:12px;color:var(--faint);font-family:var(--mono);margin-top:4px;">GSTIN: {{ user.gstin }}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:36px;font-weight:800;color:var(--blue2);letter-spacing:.05em;text-transform:uppercase;">{{ inv.type }}</div>
            <div style="font-size:15px;font-family:var(--mono);color:var(--paper);margin-top:4px;"># {{ inv.invoiceNumber }}</div>
            <span class="badge" :class="`badge-${inv.status}`" style="margin-top:8px;">{{ inv.status }}</span>
          </div>
        </div>

        <!-- Bill to / Dates -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;padding:20px;background:var(--bg3);border-radius:12px;">
          <div>
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-bottom:8px;">Bill To</div>
            <div style="font-size:16px;font-weight:600;color:var(--paper);">{{ client?.name }}</div>
            <div style="font-size:13px;color:var(--mid);">{{ client?.email }}</div>
            <div style="font-size:13px;color:var(--mid);">{{ client?.address }}</div>
            <div v-if="client?.gstin" style="font-size:12px;color:var(--faint);font-family:var(--mono);margin-top:4px;">GSTIN: {{ client.gstin }}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-bottom:8px;">Invoice Details</div>
            <table style="width:100%;font-size:13px;">
              <tr><td style="color:var(--mid);padding:3px 0;">Invoice Date</td><td style="color:var(--paper);text-align:right;">{{ formatDate(inv.invoiceDate) }}</td></tr>
              <tr><td style="color:var(--mid);padding:3px 0;">Due Date</td><td style="color:var(--paper);text-align:right;">{{ formatDate(inv.dueDate) }}</td></tr>
              <tr><td style="color:var(--mid);padding:3px 0;">GST Type</td><td style="color:var(--paper);text-align:right;text-transform:uppercase;">{{ inv.gstType }}</td></tr>
            </table>
          </div>
        </div>

        <!-- Line items table -->
        <table class="gst-table" style="margin-bottom:24px;">
          <thead>
            <tr>
              <th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th>
              <th>Taxable Amt</th>
              <th v-if="inv.gstType==='intra'">CGST</th>
              <th v-if="inv.gstType==='intra'">SGST</th>
              <th v-else>IGST</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in inv.items" :key="i">
              <td>{{ i+1 }}</td>
              <td>{{ item.description }}</td>
              <td style="font-family:var(--mono);">{{ item.hsn || '—' }}</td>
              <td>{{ item.quantity }} {{ item.unit }}</td>
              <td style="font-family:var(--mono);">{{ formatCurrency(item.rate) }}</td>
              <td style="font-family:var(--mono);">{{ formatCurrency(item.taxableAmount) }}</td>
              <td v-if="inv.gstType==='intra'" style="font-family:var(--mono);">{{ formatCurrency(item.cgst) }} ({{ item.gstRate/2 }}%)</td>
              <td v-if="inv.gstType==='intra'" style="font-family:var(--mono);">{{ formatCurrency(item.sgst) }} ({{ item.gstRate/2 }}%)</td>
              <td v-else style="font-family:var(--mono);">{{ formatCurrency(item.igst) }} ({{ item.gstRate }}%)</td>
              <td style="font-family:var(--mono);font-weight:600;">{{ formatCurrency(item.totalAmount) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-end;">
          <div style="width:300px;">
            <div class="gst-breakdown">
              <div class="gst-row"><span class="lbl">Subtotal</span><span class="val">{{ formatCurrency(inv.subtotal) }}</span></div>
              <template v-if="inv.gstType==='intra'">
                <div class="gst-row"><span class="lbl">CGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(inv.totalCGST) }}</span></div>
                <div class="gst-row"><span class="lbl">SGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(inv.totalSGST) }}</span></div>
              </template>
              <div v-else class="gst-row"><span class="lbl">IGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(inv.totalIGST) }}</span></div>
              <div class="gst-row"><span class="lbl">Total GST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(inv.totalGST) }}</span></div>
              <div v-if="inv.discount" class="gst-row"><span class="lbl">Discount</span><span class="val" style="color:var(--red);">- {{ formatCurrency(inv.discount) }}</span></div>
            </div>
            <div class="grand-total" style="margin-top:12px;">
              <span class="label">Grand Total</span>
              <span class="amount">{{ formatCurrency(inv.grandTotal) }}</span>
            </div>
            <div v-if="inv.amountPaid>0" style="margin-top:10px;">
              <div class="gst-row" style="padding:8px 0;"><span class="lbl" style="color:var(--green);">Amount Paid</span><span class="val" style="color:var(--green);">{{ formatCurrency(inv.amountPaid) }}</span></div>
              <div class="gst-row" style="padding:8px 0;"><span class="lbl" style="color:var(--red);">Balance Due</span><span class="val" style="color:var(--red);font-size:16px;font-weight:700;">{{ formatCurrency(inv.balanceDue) }}</span></div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="inv.notes || inv.terms" style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border);">
          <div v-if="inv.notes" style="margin-bottom:12px;"><div style="font-size:12px;color:var(--faint);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Notes</div><p style="font-size:13px;">{{ inv.notes }}</p></div>
          <div v-if="inv.terms"><div style="font-size:12px;color:var(--faint);text-transform:uppercase;font-weight:600;margin-bottom:4px;">Terms & Conditions</div><p style="font-size:13px;">{{ inv.terms }}</p></div>
        </div>
      </div>

      <!-- Payment Modal -->
      <div v-if="showPayModal" class="modal-backdrop" @click.self="showPayModal=false">
        <div class="modal">
          <div class="modal-header">
            <h3>Record Payment</h3>
            <button class="modal-close" @click="showPayModal=false">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="form-group">
              <label class="form-label">Amount Paid (₹)</label>
              <input v-model.number="payment.amountPaid" type="number" class="form-control" :placeholder="`Balance: ${formatCurrency(inv.balanceDue)}`" />
            </div>
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select v-model="payment.paymentMethod" class="form-control">
                <option v-for="m in ['cash','bank','upi','card','cheque']" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Date</label>
              <input v-model="payment.paymentDate" type="date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Reference / UTR</label>
              <input v-model="payment.paymentRef" class="form-control" placeholder="Transaction reference" />
            </div>
            <div class="flex-end">
              <button class="btn btn-ghost" @click="showPayModal=false">Cancel</button>
              <button class="btn btn-success" @click="submitPayment" :disabled="payLoading">
                <div v-if="payLoading" class="spinner" style="width:14px;height:14px;"></div>
                <span v-else>Confirm Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
@media print {
  .sidebar,.topbar,.no-print,button,a.btn{display:none!important;}
  .main-content{margin:0;padding:0;}
  #invoice-paper{box-shadow:none;border:none;}
}
</style>
