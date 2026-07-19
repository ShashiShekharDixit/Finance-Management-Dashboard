<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIncomeStore, useClientStore } from '@/stores/index'
import { formatCurrency, formatDate, INCOME_CATEGORIES, GST_RATES, PAYMENT_METHODS } from '@/utils/format'

const store    = useIncomeStore()
const cliStore = useClientStore()
const showModal = ref(false)
const editing   = ref<any>(null)
const confirm   = ref<string|null>(null)
const loading   = ref(false)

const blank = () => ({ title:'', category:'Sales', amount:0, gstRate:18, date:new Date().toISOString().split('T')[0], paymentMethod:'bank', reference:'', notes:'', client:'' })
const form = ref(blank())

onMounted(async () => { await store.fetch(); await cliStore.fetch({ type:'client', limit:200 }) })

function openNew()  { editing.value=null; form.value=blank(); showModal.value=true }
function openEdit(i:any) {
  editing.value=i
  form.value = { title:i.title, category:i.category, amount:i.amount, gstRate:i.gstRate, date:i.date.split('T')[0], paymentMethod:i.paymentMethod, reference:i.reference||'', notes:i.notes||'', client: typeof i.client==='string'?i.client:(i.client?._id||'') }
  showModal.value=true
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
</script>

<template>
  <div class="fade-in">
    <div class="flex-between" style="margin-bottom:24px;">
      <div><h2>Income</h2><p>{{ store.total }} records</p></div>
      <button class="btn btn-success" @click="openNew">+ Add Income</button>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
      <div v-for="cat in store.summary.slice(0,4)" :key="cat._id" class="card card-sm" style="flex:1;min-width:140px;">
        <div style="font-size:11px;color:var(--faint);text-transform:uppercase;margin-bottom:6px;">{{ cat._id }}</div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--green2);font-family:var(--mono);">{{ formatCurrency(cat.total) }}</div>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;">
      <div v-if="store.loading" class="loading-overlay"><div class="spinner"></div></div>
      <div v-else-if="!store.income.length" class="empty-state">
        <div class="icon">💰</div><h3>No income records yet</h3>
        <button class="btn btn-success" style="margin-top:12px;" @click="openNew">+ Add Income</button>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr><th>Title</th><th>Category</th><th>Client</th><th>Date</th><th>Amount</th><th>GST</th><th>Total</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="i in store.income" :key="i._id">
            <td class="bold">{{ i.title }}</td>
            <td><span class="badge badge-sent">{{ i.category }}</span></td>
            <td>{{ (i.client as any)?.name || '—' }}</td>
            <td>{{ formatDate(i.date) }}</td>
            <td style="font-family:var(--mono);">{{ formatCurrency(i.amount) }}</td>
            <td style="font-family:var(--mono);color:var(--amber);">{{ formatCurrency(i.gstAmount) }}</td>
            <td style="font-family:var(--mono);font-weight:700;color:var(--green2);">{{ formatCurrency(i.totalAmount) }}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-icon" @click="openEdit(i)">✏️</button>
                <button class="btn btn-icon" :class="confirm===i._id?'btn-danger':'btn-ghost'" @click="remove(i._id)">{{ confirm===i._id?'✓':'🗑' }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal=false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editing ? 'Edit Income' : 'Add Income' }}</h3>
          <button class="modal-close" @click="showModal=false">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group"><label class="form-label">Title *</label><input v-model="form.title" class="form-control" placeholder="Income title" /></div>
          <div class="grid-2">
            <div class="form-group"><label class="form-label">Category</label>
              <select v-model="form.category" class="form-control">
                <option v-for="c in INCOME_CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Client</label>
              <select v-model="form.client" class="form-control">
                <option value="">No client</option>
                <option v-for="c in cliStore.clients" :key="c._id" :value="c._id">{{ c.name }}</option>
              </select>
            </div>
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
            <div class="form-group"><label class="form-label">Date</label><input v-model="form.date" type="date" class="form-control" /></div>
            <div class="form-group"><label class="form-label">Payment Method</label>
              <select v-model="form.paymentMethod" class="form-control">
                <option v-for="m in PAYMENT_METHODS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Reference</label><input v-model="form.reference" class="form-control" /></div>
          <div class="grand-total">
            <span class="label">Total (incl. GST)</span>
            <span class="amount" style="color:var(--green2);">{{ formatCurrency(form.amount * (1 + form.gstRate/100)) }}</span>
          </div>
          <div class="flex-end">
            <button class="btn btn-ghost" @click="showModal=false">Cancel</button>
            <button class="btn btn-success" @click="save" :disabled="loading">
              <div v-if="loading" class="spinner" style="width:14px;height:14px;"></div>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
