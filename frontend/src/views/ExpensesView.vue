<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useExpenseStore } from '@/stores/index'
import { useClientStore } from '@/stores/index'
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, GST_RATES, PAYMENT_METHODS } from '@/utils/format'

const store  = useExpenseStore()
const cliStore = useClientStore()
const showModal = ref(false)
const editing   = ref<any>(null)
const confirm   = ref<string|null>(null)
const loading   = ref(false)
const filter    = ref({ category: '', from: '', to: '' })

const blank = () => ({ title:'', category:'Office Supplies', amount:0, gstRate:0, date:new Date().toISOString().split('T')[0], paymentMethod:'bank', reference:'', notes:'', vendor:'' })
const form  = ref(blank())

onMounted(async () => { await store.fetch(); await cliStore.fetch({ type:'vendor', limit:200 }) })

function openNew()  { editing.value=null; form.value=blank(); showModal.value=true }
function openEdit(e:any) {
  editing.value = e
  form.value = { title:e.title, category:e.category, amount:e.amount, gstRate:e.gstRate, date:e.date.split('T')[0], paymentMethod:e.paymentMethod, reference:e.reference||'', notes:e.notes||'', vendor: typeof e.vendor==='string'?e.vendor:(e.vendor?._id||'') }
  showModal.value = true
}
async function save() {
  loading.value=true
  try {
    if (editing.value) await store.update(editing.value._id, form.value)
    else await store.create(form.value)
    showModal.value=false
  } finally { loading.value=false }
}
async function remove(id:string) {
  if (confirm.value!==id) { confirm.value=id; return }
  await store.remove(id); confirm.value=null
}
function applyFilter() { store.fetch(filter.value) }
</script>

<template>
  <div class="fade-in">
    <div class="flex-between" style="margin-bottom:24px;">
      <div><h2>Expenses</h2><p>{{ store.total }} records</p></div>
      <button class="btn btn-primary" @click="openNew">+ Add Expense</button>
    </div>

    <!-- Summary cards -->
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
      <div v-for="cat in store.summary.slice(0,4)" :key="cat._id" class="card card-sm" style="flex:1;min-width:140px;">
        <div style="font-size:11px;color:var(--faint);text-transform:uppercase;margin-bottom:6px;">{{ cat._id }}</div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--red2);font-family:var(--mono);">{{ formatCurrency(cat.total) }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card card-sm flex gap-3" style="margin-bottom:16px;flex-wrap:wrap;">
      <select v-model="filter.category" class="form-control" style="width:180px;">
        <option value="">All Categories</option>
        <option v-for="c in EXPENSE_CATEGORIES" :key="c" :value="c">{{ c }}</option>
      </select>
      <input v-model="filter.from" type="date" class="form-control" style="width:160px;" />
      <input v-model="filter.to"   type="date" class="form-control" style="width:160px;" />
      <button class="btn btn-primary btn-sm" @click="applyFilter">Filter</button>
      <button class="btn btn-ghost btn-sm" @click="filter={category:'',from:'',to:''};store.fetch()">Clear</button>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0;overflow:hidden;">
      <div v-if="store.loading" class="loading-overlay"><div class="spinner"></div></div>
      <div v-else-if="!store.expenses.length" class="empty-state">
        <div class="icon">💸</div><h3>No expenses yet</h3>
        <button class="btn btn-primary" style="margin-top:12px;" @click="openNew">+ Add Expense</button>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr><th>Title</th><th>Category</th><th>Date</th><th>Amount</th><th>GST</th><th>Total</th><th>Payment</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="e in store.expenses" :key="e._id">
            <td class="bold">{{ e.title }}</td>
            <td><span class="badge badge-draft">{{ e.category }}</span></td>
            <td>{{ formatDate(e.date) }}</td>
            <td style="font-family:var(--mono);">{{ formatCurrency(e.amount) }}</td>
            <td style="font-family:var(--mono);color:var(--amber);">{{ formatCurrency(e.gstAmount) }}</td>
            <td style="font-family:var(--mono);font-weight:700;color:var(--paper);">{{ formatCurrency(e.totalAmount) }}</td>
            <td style="text-transform:uppercase;font-size:11px;color:var(--mid);">{{ e.paymentMethod }}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-icon" @click="openEdit(e)">✏️</button>
                <button class="btn btn-icon" :class="confirm===e._id?'btn-danger':'btn-ghost'" @click="remove(e._id)">{{ confirm===e._id?'✓':'🗑' }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal=false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editing ? 'Edit Expense' : 'Add Expense' }}</h3>
          <button class="modal-close" @click="showModal=false">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group"><label class="form-label">Title *</label><input v-model="form.title" class="form-control" placeholder="Expense title" /></div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Category *</label>
              <select v-model="form.category" class="form-control">
                <option v-for="c in EXPENSE_CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Date</label><input v-model="form.date" type="date" class="form-control" /></div>
          </div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Amount (₹)</label><input v-model.number="form.amount" type="number" class="form-control" /></div>
            <div class="form-group"><label class="form-label">GST Rate</label>
              <select v-model.number="form.gstRate" class="form-control">
                <option v-for="r in GST_RATES" :key="r" :value="r">{{ r }}%</option>
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Payment Method</label>
              <select v-model="form.paymentMethod" class="form-control">
                <option v-for="m in PAYMENT_METHODS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Vendor</label>
              <select v-model="form.vendor" class="form-control">
                <option value="">No vendor</option>
                <option v-for="v in cliStore.clients" :key="v._id" :value="v._id">{{ v.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Reference</label><input v-model="form.reference" class="form-control" placeholder="Bill / receipt no." /></div>
          <div class="form-group"><label class="form-label">Notes</label><textarea v-model="form.notes" class="form-control"></textarea></div>
          <!-- Live total -->
          <div class="grand-total">
            <span class="label">Total (incl. GST)</span>
            <span class="amount">{{ formatCurrency(form.amount * (1 + form.gstRate/100)) }}</span>
          </div>
          <div class="flex-end">
            <button class="btn btn-ghost" @click="showModal=false">Cancel</button>
            <button class="btn btn-primary" @click="save" :disabled="loading">
              <div v-if="loading" class="spinner" style="width:14px;height:14px;"></div>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
