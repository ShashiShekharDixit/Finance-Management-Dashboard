<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useClientStore } from '@/stores/index'
import { formatCurrency } from '@/utils/format'

const store = useClientStore()
const tab   = ref<'client'|'vendor'>('client')
const showModal = ref(false)
const editing   = ref<any>(null)
const confirm   = ref<string|null>(null)
const loading   = ref(false)
const search    = ref('')

const blank = () => ({ type:'client' as 'client'|'vendor', name:'', email:'', phone:'', gstin:'', pan:'', address:'', city:'', state:'', company:'', notes:'' })
const form  = ref(blank())

onMounted(() => store.fetch())

const filtered = computed(() =>
  store.clients.filter(c => c.type===tab.value && (!search.value || c.name.toLowerCase().includes(search.value.toLowerCase())))
)

function openNew()  { editing.value=null; form.value={...blank(),type:tab.value}; showModal.value=true }
function openEdit(c:any) { editing.value=c; form.value={...c}; showModal.value=true }
async function save() {
  loading.value=true
  try {
    if (editing.value) await store.update(editing.value._id, form.value)
    else await store.create(form.value)
    showModal.value=false; store.fetch()
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
      <div><h2>Clients & Vendors</h2><p>{{ store.total }} total</p></div>
      <button class="btn btn-primary" @click="openNew">+ Add {{ tab==='client'?'Client':'Vendor' }}</button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:0;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:4px;width:fit-content;margin-bottom:20px;">
      <button v-for="t in ['client','vendor']" :key="t" @click="tab=t as any;store.fetch({type:t})"
        class="btn" :class="tab===t ? 'btn-primary' : 'btn-ghost'"
        style="border-radius:9px;min-width:100px;">
        {{ t==='client' ? '👥 Clients' : '🏭 Vendors' }}
      </button>
    </div>

    <!-- Search -->
    <div style="margin-bottom:16px;">
      <input v-model="search" class="form-control" placeholder="Search by name..." style="max-width:320px;" />
    </div>

    <!-- Grid -->
    <div v-if="store.loading" class="loading-overlay"><div class="spinner"></div></div>
    <div v-else-if="!filtered.length" class="empty-state">
      <div class="icon">{{ tab==='client'?'👥':'🏭' }}</div>
      <h3>No {{ tab }}s yet</h3>
      <button class="btn btn-primary" style="margin-top:12px;" @click="openNew">+ Add {{ tab }}</button>
    </div>
    <div v-else style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
      <div v-for="c in filtered" :key="c._id" class="card" style="position:relative;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
          <div>
            <div style="font-size:16px;font-weight:600;color:var(--paper);margin-bottom:2px;">{{ c.name }}</div>
            <div style="font-size:12px;color:var(--mid);">{{ c.company || c.email }}</div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-icon" @click="openEdit(c)">✏️</button>
            <button class="btn btn-icon" :class="confirm===c._id?'btn-danger':'btn-ghost'" @click="remove(c._id)">{{ confirm===c._id?'✓':'🗑' }}</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--mid);">
          <div v-if="c.phone">📞 {{ c.phone }}</div>
          <div v-if="c.gstin" style="font-family:var(--mono);">GSTIN: {{ c.gstin }}</div>
          <div v-if="c.city">📍 {{ c.city }}, {{ c.state }}</div>
        </div>
        <div style="display:flex;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;color:var(--faint);text-transform:uppercase;margin-bottom:2px;">Billed</div>
            <div style="font-size:13px;font-weight:600;color:var(--blue2);font-family:var(--mono);">{{ formatCurrency(c.totalBilled) }}</div>
          </div>
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;color:var(--faint);text-transform:uppercase;margin-bottom:2px;">Paid</div>
            <div style="font-size:13px;font-weight:600;color:var(--green2);font-family:var(--mono);">{{ formatCurrency(c.totalPaid) }}</div>
          </div>
          <div style="flex:1;text-align:center;">
            <div style="font-size:10px;color:var(--faint);text-transform:uppercase;margin-bottom:2px;">Balance</div>
            <div style="font-size:13px;font-weight:600;color:var(--red2);font-family:var(--mono);">{{ formatCurrency(c.totalBilled - c.totalPaid) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal=false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>{{ editing ? 'Edit' : 'Add' }} {{ form.type==='client'?'Client':'Vendor' }}</h3>
          <button class="modal-close" @click="showModal=false">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group"><label class="form-label">Type</label>
            <select v-model="form.type" class="form-control">
              <option value="client">Client</option><option value="vendor">Vendor</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Name *</label><input v-model="form.name" class="form-control" /></div>
          <div class="form-group"><label class="form-label">Company</label><input v-model="form.company" class="form-control" /></div>
          <div class="form-group"><label class="form-label">Email</label><input v-model="form.email" type="email" class="form-control" /></div>
          <div class="form-group"><label class="form-label">Phone</label><input v-model="form.phone" class="form-control" /></div>
          <div class="form-group"><label class="form-label">GSTIN</label><input v-model="form.gstin" class="form-control" /></div>
          <div class="form-group"><label class="form-label">PAN</label><input v-model="form.pan" class="form-control" /></div>
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Address</label><textarea v-model="form.address" class="form-control" rows="2"></textarea></div>
          <div class="form-group"><label class="form-label">City</label><input v-model="form.city" class="form-control" /></div>
          <div class="form-group"><label class="form-label">State</label><input v-model="form.state" class="form-control" /></div>
        </div>
        <div class="flex-end" style="margin-top:20px;">
          <button class="btn btn-ghost" @click="showModal=false">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="loading">
            <div v-if="loading" class="spinner" style="width:14px;height:14px;"></div>
            <span v-else>Save</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
