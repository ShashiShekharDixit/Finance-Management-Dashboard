<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { formatCurrency, formatDate } from '@/utils/format'

const loading  = ref(false)
const gstData  = ref<any>(null)
const gstr1    = ref<any[]>([])
const tab      = ref<'summary'|'gstr1'>('summary')
const filter   = ref({
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  to:   new Date().toISOString().split('T')[0]
})

async function fetchSummary() {
  loading.value = true
  try {
    const [sumRes, g1Res] = await Promise.all([
      api.get('/gst/summary', { params: filter.value }),
      api.get('/gst/gstr1',   { params: filter.value }),
    ])
    gstData.value = sumRes.data
    gstr1.value   = g1Res.data.invoices || []
  } finally { loading.value = false }
}

onMounted(fetchSummary)
</script>

<template>
  <div class="fade-in">
    <!-- Header -->
    <div class="flex-between" style="margin-bottom:24px;">
      <div><h2>GST Reports</h2><p>GSTR-1 style tax summary with input credit</p></div>
      <button class="btn btn-ghost" @click="() => window.print()">🖨 Print Report</button>
    </div>

    <!-- Date filter -->
    <div class="card card-sm flex gap-3" style="margin-bottom:20px;flex-wrap:wrap;">
      <div class="form-group" style="flex-direction:row;align-items:center;gap:10px;margin:0;">
        <label class="form-label" style="margin:0;white-space:nowrap;">From</label>
        <input v-model="filter.from" type="date" class="form-control" style="width:160px;" />
      </div>
      <div class="form-group" style="flex-direction:row;align-items:center;gap:10px;margin:0;">
        <label class="form-label" style="margin:0;white-space:nowrap;">To</label>
        <input v-model="filter.to" type="date" class="form-control" style="width:160px;" />
      </div>
      <button class="btn btn-primary btn-sm" @click="fetchSummary">Apply</button>
      <div style="margin-left:auto;display:flex;gap:0;background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:3px;">
        <button v-for="t in ['summary','gstr1']" :key="t"
          class="btn btn-sm" style="border-radius:8px;text-transform:capitalize;"
          :class="tab===t ? 'btn-primary' : 'btn-ghost'"
          @click="tab=t as any">
          {{ t==='gstr1' ? 'GSTR-1' : 'Summary' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay"><div class="spinner" style="width:36px;height:36px;"></div></div>

    <template v-else-if="gstData">

      <!-- SUMMARY TAB -->
      <template v-if="tab==='summary'">

        <!-- 3 key boxes -->
        <div class="grid-3" style="margin-bottom:24px;">
          <div class="stat-card" style="--accent-color:var(--blue);">
            <div class="icon" style="background:rgba(59,130,246,.15);">📤</div>
            <div class="label">Output GST Collected</div>
            <div class="value">{{ formatCurrency(gstData.outputGST.totalGST) }}</div>
            <div class="sub">From {{ gstData.outputGST.count }} invoices</div>
          </div>
          <div class="stat-card" style="--accent-color:var(--green);">
            <div class="icon" style="background:rgba(16,185,129,.15);">📥</div>
            <div class="label">Input GST Credit</div>
            <div class="value">{{ formatCurrency(gstData.inputCredit) }}</div>
            <div class="sub">From {{ gstData.inputGST.count }} expenses</div>
          </div>
          <div class="stat-card" :style="{'--accent-color': gstData.netGSTPayable > 0 ? 'var(--amber)' : 'var(--green)'}">
            <div class="icon" :style="{background: gstData.netGSTPayable > 0 ? 'rgba(245,158,11,.15)' : 'rgba(16,185,129,.15)'}">🏦</div>
            <div class="label">Net GST Payable</div>
            <div class="value" :style="{color: gstData.netGSTPayable > 0 ? 'var(--amber)' : 'var(--green2)'}">
              {{ formatCurrency(gstData.netGSTPayable) }}
            </div>
            <div class="sub">Output GST − Input Credit</div>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:24px;">
          <!-- Output GST breakdown -->
          <div class="card">
            <h3 style="margin-bottom:16px;">📤 Output GST (Sales)</h3>
            <div class="gst-breakdown">
              <div class="gst-row"><span class="lbl">Taxable Amount</span><span class="val">{{ formatCurrency(gstData.outputGST.subtotal) }}</span></div>
              <div class="gst-row"><span class="lbl">CGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(gstData.outputGST.totalCGST) }}</span></div>
              <div class="gst-row"><span class="lbl">SGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(gstData.outputGST.totalSGST) }}</span></div>
              <div class="gst-row"><span class="lbl">IGST</span><span class="val" style="color:var(--amber);">{{ formatCurrency(gstData.outputGST.totalIGST) }}</span></div>
              <div class="gst-row total"><span class="lbl">Total Output GST</span><span class="val" style="color:var(--blue2);font-size:15px;">{{ formatCurrency(gstData.outputGST.totalGST) }}</span></div>
              <div class="gst-row"><span class="lbl">Grand Total (Invoiced)</span><span class="val">{{ formatCurrency(gstData.outputGST.grandTotal) }}</span></div>
            </div>
          </div>

          <!-- Input GST + Net payable -->
          <div class="card">
            <h3 style="margin-bottom:16px;">📥 Input GST (Purchases)</h3>
            <div class="gst-breakdown">
              <div class="gst-row"><span class="lbl">Total Expense Amount</span><span class="val">{{ formatCurrency(gstData.inputGST.totalExpense) }}</span></div>
              <div class="gst-row total"><span class="lbl">Input GST Credit</span><span class="val" style="color:var(--green2);font-size:15px;">{{ formatCurrency(gstData.inputCredit) }}</span></div>
            </div>

            <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
              <h3 style="margin-bottom:12px;">📊 Net Calculation</h3>
              <div class="gst-breakdown">
                <div class="gst-row"><span class="lbl">Output GST</span><span class="val">{{ formatCurrency(gstData.outputGST.totalGST) }}</span></div>
                <div class="gst-row"><span class="lbl">Less: Input Credit</span><span class="val" style="color:var(--green2);">− {{ formatCurrency(gstData.inputCredit) }}</span></div>
              </div>
              <div class="grand-total" style="margin-top:12px;">
                <span class="label">Net GST Payable</span>
                <span class="amount" :style="{color: gstData.netGSTPayable > 0 ? 'var(--amber2)' : 'var(--green2)'}">
                  {{ formatCurrency(gstData.netGSTPayable) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- GST by rate slab -->
        <div class="card">
          <h3 style="margin-bottom:16px;">GST Rate-wise Breakdown</h3>
          <table class="gst-table">
            <thead>
              <tr>
                <th>GST Rate Slab</th>
                <th>Taxable Amount</th>
                <th>GST Amount</th>
                <th>No. of Items</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rb in gstData.rateBreakdown" :key="rb._id">
                <td><span class="badge" :class="rb._id===0?'badge-draft':rb._id===5?'badge-sent':rb._id===12?'badge-partial':rb._id===18?'badge-paid':'badge-overdue'">{{ rb._id }}%</span></td>
                <td style="font-family:var(--mono);">{{ formatCurrency(rb.taxableAmount) }}</td>
                <td style="font-family:var(--mono);color:var(--amber);">{{ formatCurrency(rb.gstAmount) }}</td>
                <td>{{ rb.count }}</td>
              </tr>
              <tr v-if="!gstData.rateBreakdown?.length">
                <td colspan="4" style="text-align:center;color:var(--faint);">No data for selected period</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- GSTR-1 TAB -->
      <template v-else>
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <h3>GSTR-1 Invoice Register</h3>
            <span style="font-size:13px;color:var(--mid);">{{ gstr1.length }} invoices</span>
          </div>
          <div v-if="!gstr1.length" class="empty-state"><div class="icon">📋</div><p>No invoices in selected period</p></div>
          <div v-else style="overflow-x:auto;">
            <table class="data-table" style="min-width:900px;">
              <thead>
                <tr>
                  <th>Invoice #</th><th>Date</th><th>Client</th><th>GSTIN</th>
                  <th>Taxable</th><th>CGST</th><th>SGST</th><th>IGST</th>
                  <th>Total GST</th><th>Grand Total</th><th>Type</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in gstr1" :key="inv._id">
                  <td style="font-family:var(--mono);color:var(--blue2);">{{ inv.invoiceNumber }}</td>
                  <td>{{ formatDate(inv.invoiceDate) }}</td>
                  <td class="bold">{{ inv.client?.name || '—' }}</td>
                  <td style="font-family:var(--mono);font-size:11px;">{{ inv.client?.gstin || '—' }}</td>
                  <td style="font-family:var(--mono);">{{ formatCurrency(inv.subtotal) }}</td>
                  <td style="font-family:var(--mono);color:var(--amber);">{{ formatCurrency(inv.totalCGST) }}</td>
                  <td style="font-family:var(--mono);color:var(--amber);">{{ formatCurrency(inv.totalSGST) }}</td>
                  <td style="font-family:var(--mono);color:var(--amber);">{{ formatCurrency(inv.totalIGST) }}</td>
                  <td style="font-family:var(--mono);color:var(--amber);font-weight:600;">{{ formatCurrency(inv.totalGST) }}</td>
                  <td style="font-family:var(--mono);font-weight:700;color:var(--paper);">{{ formatCurrency(inv.grandTotal) }}</td>
                  <td style="text-transform:uppercase;font-size:11px;font-family:var(--mono);">{{ inv.gstType }}</td>
                </tr>
              </tbody>
              <!-- Totals row -->
              <tfoot>
                <tr style="background:var(--bg3);">
                  <td colspan="4" style="font-weight:700;color:var(--paper);padding:12px 16px;">TOTAL</td>
                  <td style="font-family:var(--mono);font-weight:700;color:var(--paper);">{{ formatCurrency(gstr1.reduce((s,i)=>s+i.subtotal,0)) }}</td>
                  <td style="font-family:var(--mono);font-weight:700;color:var(--amber);">{{ formatCurrency(gstr1.reduce((s,i)=>s+i.totalCGST,0)) }}</td>
                  <td style="font-family:var(--mono);font-weight:700;color:var(--amber);">{{ formatCurrency(gstr1.reduce((s,i)=>s+i.totalSGST,0)) }}</td>
                  <td style="font-family:var(--mono);font-weight:700;color:var(--amber);">{{ formatCurrency(gstr1.reduce((s,i)=>s+i.totalIGST,0)) }}</td>
                  <td style="font-family:var(--mono);font-weight:700;color:var(--amber);">{{ formatCurrency(gstr1.reduce((s,i)=>s+i.totalGST,0)) }}</td>
                  <td style="font-family:var(--mono);font-weight:700;color:var(--blue2);">{{ formatCurrency(gstr1.reduce((s,i)=>s+i.grandTotal,0)) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </template>

    </template>
  </div>
</template>

<style>
@media print {
  .sidebar,.topbar,.btn,.card.card-sm{display:none!important;}
  .main-content{margin:0;padding:0;}
}
</style>
