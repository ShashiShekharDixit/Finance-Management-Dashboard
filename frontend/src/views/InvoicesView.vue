<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInvoiceStore } from '@/stores/invoice'
import { formatCurrency, formatDate } from '@/utils/format'

const store   = useInvoiceStore()
const filter  = ref({ status: '', from: '', to: '' })
const confirm = ref<string|null>(null)

onMounted(() => store.fetch())

function applyFilter() { store.fetch(filter.value) }
function clearFilter()  { filter.value = { status:'', from:'', to:'' }; store.fetch() }
async function remove(id: string) {
  if (confirm.value !== id) { confirm.value = id; return }
  await store.remove(id); confirm.value = null
}
</script>

<template>
  <div class="fade-in">
    <!-- Header -->
    <div class="flex-between" style="margin-bottom:24px;">
      <div>
        <h2 style="margin-bottom:4px;">Invoices</h2>
        <p style="font-size:13px;">{{ store.total }} total records</p>
      </div>
      <div class="flex gap-3">
        <router-link to="/invoices/new" class="btn btn-primary">+ New Invoice</router-link>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-sm flex gap-3" style="margin-bottom:20px;flex-wrap:wrap;">
      <select v-model="filter.status" class="form-control" style="width:160px;">
        <option value="">All Statuses</option>
        <option v-for="s in ['draft','sent','paid','partial','overdue','cancelled']" :key="s" :value="s">{{ s }}</option>
      </select>
      <input v-model="filter.from" type="date" class="form-control" style="width:160px;" placeholder="From" />
      <input v-model="filter.to"   type="date" class="form-control" style="width:160px;" placeholder="To" />
      <button class="btn btn-primary btn-sm" @click="applyFilter">Filter</button>
      <button class="btn btn-ghost btn-sm" @click="clearFilter">Clear</button>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0;overflow:hidden;">
      <div v-if="store.loading" class="loading-overlay"><div class="spinner"></div></div>
      <div v-else-if="!store.invoices.length" class="empty-state">
        <div class="icon">🧾</div>
        <h3>No invoices yet</h3>
        <p>Create your first invoice to get started</p>
        <router-link to="/invoices/new" class="btn btn-primary" style="margin-top:16px;">+ Create Invoice</router-link>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Invoice #</th><th>Client</th><th>Date</th><th>Due Date</th>
            <th>Amount</th><th>GST</th><th>Grand Total</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in store.invoices" :key="inv._id">
            <td class="bold" style="font-family:var(--mono);color:var(--blue2);">{{ inv.invoiceNumber }}</td>
            <td class="bold">{{ (inv.client as any)?.name || '—' }}</td>
            <td>{{ formatDate(inv.invoiceDate) }}</td>
            <td :style="{color: inv.status==='overdue' ? 'var(--red)' : ''}">{{ formatDate(inv.dueDate) }}</td>
            <td style="font-family:var(--mono);">{{ formatCurrency(inv.subtotal) }}</td>
            <td style="font-family:var(--mono);color:var(--amber);">{{ formatCurrency(inv.totalGST) }}</td>
            <td style="font-family:var(--mono);font-weight:700;color:var(--paper);">{{ formatCurrency(inv.grandTotal) }}</td>
            <td><span class="badge" :class="`badge-${inv.status}`">{{ inv.status }}</span></td>
            <td>
              <div class="flex gap-2">
                <router-link :to="`/invoices/${inv._id}`" class="btn btn-ghost btn-icon" title="View">👁</router-link>
                <router-link :to="`/invoices/${inv._id}/edit`" class="btn btn-ghost btn-icon" title="Edit">✏️</router-link>
                <button
                  class="btn btn-icon"
                  :class="confirm===inv._id ? 'btn-danger' : 'btn-ghost'"
                  @click="remove(inv._id)"
                  :title="confirm===inv._id ? 'Confirm delete' : 'Delete'"
                >{{ confirm===inv._id ? '✓' : '🗑' }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
