<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useDashboardStore } from '@/stores/index'
import { formatCurrency, formatDate, getMonthName } from '@/utils/format'

const store = useDashboardStore()
onMounted(() => store.fetch())

const summary = computed(() => store.data?.summary)
const trend   = computed(() => store.data?.monthlyTrend || [])
const recent  = computed(() => store.data?.recentInvoices || [])
const overdue = computed(() => store.data?.overdueInvoices || [])
const expCat  = computed(() => store.data?.expenseByCategory || [])

const statusColor: Record<string,string> = {
  paid:'var(--green)', partial:'var(--amber)', sent:'var(--blue)',
  draft:'var(--faint)', overdue:'var(--red)', cancelled:'var(--faint)'
}

const statCards = computed(() => {
  const s = summary.value
  if (!s) return []
  return [
    { label:'Total Revenue', value: formatCurrency(s.totalRevenue), sub:`This month: ${formatCurrency(s.monthRevenue)}`, icon:'💰', color:'var(--blue)' },
    { label:'Net Profit',    value: formatCurrency(s.netProfit),    sub:'Revenue minus expenses',                       icon:'📈', color:'var(--green)' },
    { label:'Pending',       value: formatCurrency(s.pendingAmount),sub:'Outstanding dues',                             icon:'⏳', color:'var(--amber)' },
    { label:'Total Expenses',value: formatCurrency(s.totalExpenses),sub:`This month: ${formatCurrency(s.monthExpenses)}`,icon:'💸', color:'var(--red)' },
  ]
})

// Build bar chart data from monthly trend
const chartBars = computed(() => {
  if (!trend.value.length) return []
  const max = Math.max(...trend.value.map(t => t.revenue), 1)
  return trend.value.map(t => ({
    label: getMonthName(t._id.month),
    value: t.revenue,
    height: Math.round((t.revenue / max) * 100),
  }))
})

// Max expense category for bar width
const maxCat = computed(() => Math.max(...expCat.value.map(c => c.total), 1))
</script>

<template>
  <div class="fade-in">

    <!-- Loading -->
    <div v-if="store.loading" class="loading-overlay"><div class="spinner" style="width:36px;height:36px;"></div></div>

    <template v-else>
      <!-- Stat cards -->
      <div class="grid-4" style="margin-bottom:24px;">
        <div
          v-for="card in statCards" :key="card.label"
          class="stat-card"
          :style="{'--accent-color': card.color}"
        >
          <div class="icon" :style="{background: card.color+'22'}">{{ card.icon }}</div>
          <div class="label">{{ card.label }}</div>
          <div class="value">{{ card.value }}</div>
          <div class="sub">{{ card.sub }}</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid-2" style="margin-bottom:24px;">

        <!-- Monthly Revenue Bar Chart -->
        <div class="card">
          <div class="flex-between" style="margin-bottom:20px;">
            <h3>Monthly Revenue</h3>
            <span style="font-size:12px;color:var(--faint);font-family:var(--mono);">Last 6 months</span>
          </div>
          <div v-if="!chartBars.length" class="empty-state" style="padding:30px;">
            <div class="icon">📊</div>
            <p>No data yet</p>
          </div>
          <div v-else style="display:flex;align-items:flex-end;gap:8px;height:160px;">
            <div
              v-for="bar in chartBars" :key="bar.label"
              style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;"
            >
              <span style="font-size:10px;color:var(--faint);font-family:var(--mono);">{{ formatCurrency(bar.value).replace('₹','') }}</span>
              <div style="flex:1;width:100%;display:flex;align-items:flex-end;">
                <div
                  :style="{
                    width:'100%',
                    height: bar.height + '%',
                    minHeight:'4px',
                    background:'linear-gradient(to top, var(--blue), var(--violet))',
                    borderRadius:'6px 6px 0 0',
                    transition:'height .8s cubic-bezier(.4,0,.2,1)',
                  }"
                ></div>
              </div>
              <span style="font-size:10px;color:var(--mid);">{{ bar.label }}</span>
            </div>
          </div>
        </div>

        <!-- Expense by Category -->
        <div class="card">
          <div class="flex-between" style="margin-bottom:20px;">
            <h3>Top Expenses</h3>
            <span style="font-size:12px;color:var(--faint);font-family:var(--mono);">This year</span>
          </div>
          <div v-if="!expCat.length" class="empty-state" style="padding:30px;">
            <div class="icon">💸</div><p>No expenses yet</p>
          </div>
          <div v-else style="display:flex;flex-direction:column;gap:12px;">
            <div v-for="cat in expCat" :key="cat._id">
              <div class="flex-between" style="margin-bottom:5px;">
                <span style="font-size:13px;color:var(--paper);">{{ cat._id }}</span>
                <span style="font-size:12px;font-family:var(--mono);color:var(--mid);">{{ formatCurrency(cat.total) }}</span>
              </div>
              <div style="height:5px;background:var(--border);border-radius:4px;overflow:hidden;">
                <div :style="{width:(cat.total/maxCat*100)+'%',height:'100%',background:'linear-gradient(90deg,var(--red),var(--amber))',borderRadius:'4px',transition:'width .8s ease'}"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice summary strip -->
      <div class="card" style="margin-bottom:24px;">
        <div class="flex-between" style="margin-bottom:16px;">
          <h3>Invoice Overview</h3>
          <router-link to="/invoices" style="font-size:13px;color:var(--blue);">View all →</router-link>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <div
            v-for="stat in (store.data?.invoiceStats || [])" :key="stat._id"
            style="flex:1;min-width:100px;background:var(--bg3);border-radius:12px;padding:16px;text-align:center;"
          >
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:8px;">{{ stat._id }}</div>
            <div style="font-size:1.4rem;font-weight:700;font-family:var(--mono);margin-bottom:4px;"
              :style="{color: statusColor[stat._id] || 'var(--paper)'}">
              {{ stat.count }}
            </div>
            <div style="font-size:11px;color:var(--mid);">{{ formatCurrency(stat.amount) }}</div>
          </div>
        </div>
      </div>

      <!-- Bottom row: recent + overdue -->
      <div class="grid-2">

        <!-- Recent Invoices -->
        <div class="card">
          <div class="flex-between" style="margin-bottom:16px;">
            <h3>Recent Invoices</h3>
            <router-link to="/invoices" style="font-size:13px;color:var(--blue);">See all →</router-link>
          </div>
          <div v-if="!recent.length" class="empty-state" style="padding:24px;"><div class="icon">🧾</div><p>No invoices yet</p></div>
          <div v-else style="display:flex;flex-direction:column;gap:0;">
            <div
              v-for="inv in recent" :key="inv._id"
              style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);"
            >
              <div>
                <div style="font-size:13.5px;font-weight:500;color:var(--paper);">{{ (inv.client as any)?.name || '—' }}</div>
                <div style="font-size:11px;color:var(--faint);font-family:var(--mono);">{{ inv.invoiceNumber }}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:13px;font-weight:600;color:var(--paper);font-family:var(--mono);">{{ formatCurrency(inv.grandTotal) }}</div>
                <span class="badge" :class="`badge-${inv.status}`">{{ inv.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Overdue Invoices -->
        <div class="card">
          <div class="flex-between" style="margin-bottom:16px;">
            <h3>⚠️ Overdue</h3>
            <span style="font-size:12px;color:var(--red);font-family:var(--mono);">{{ overdue.length }} invoices</span>
          </div>
          <div v-if="!overdue.length" style="text-align:center;padding:24px;color:var(--green);">
            <div style="font-size:32px;margin-bottom:8px;">✅</div>
            <p>No overdue invoices</p>
          </div>
          <div v-else style="display:flex;flex-direction:column;gap:0;">
            <div
              v-for="inv in overdue" :key="inv._id"
              style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);"
            >
              <div>
                <div style="font-size:13.5px;font-weight:500;color:var(--paper);">{{ (inv.client as any)?.name || '—' }}</div>
                <div style="font-size:11px;color:var(--red);font-family:var(--mono);">Due {{ formatDate(inv.dueDate) }}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:13px;font-weight:600;color:var(--red);font-family:var(--mono);">{{ formatCurrency(inv.balanceDue) }}</div>
                <div style="font-size:11px;color:var(--faint);">Balance due</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>
