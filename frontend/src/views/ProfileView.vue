<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()
const loading = ref(false)
const success  = ref('')
const error    = ref('')

const form = ref({
  name:         auth.user?.name || '',
  businessName: auth.user?.businessName || '',
  gstin:        auth.user?.gstin || '',
  phone:        auth.user?.phone || '',
  address:      auth.user?.address || '',
})

const initials = computed(() => {
  const n = auth.user?.name || ''
  return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || 'U'
})

async function save() {
  loading.value=true; error.value=''; success.value=''
  try {
    await auth.updateProfile(form.value)
    success.value = 'Profile updated successfully!'
  } catch(e:any) { error.value = e.response?.data?.message || 'Update failed' }
  finally { loading.value=false }
}

function logout() { auth.logout(); router.push('/login') }
</script>

<template>
  <div class="fade-in" style="max-width:640px;">
    <h2 style="margin-bottom:24px;">Profile & Settings</h2>

    <!-- Avatar card -->
    <div class="card" style="display:flex;align-items:center;gap:20px;margin-bottom:20px;">
      <div style="width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,var(--blue),var(--violet));display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;flex-shrink:0;">
        {{ initials }}
      </div>
      <div>
        <div style="font-size:20px;font-weight:700;color:var(--paper);">{{ auth.user?.name }}</div>
        <div style="font-size:13px;color:var(--mid);">{{ auth.user?.email }}</div>
        <div style="font-size:12px;color:var(--faint);font-family:var(--mono);margin-top:4px;">{{ auth.user?.role?.toUpperCase() }}</div>
      </div>
    </div>

    <div v-if="success" style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);color:var(--green2);border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:16px;">✅ {{ success }}</div>
    <div v-if="error"   style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--red2);border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:16px;">{{ error }}</div>

    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-bottom:16px;">Business Information</h3>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="grid-2">
          <div class="form-group"><label class="form-label">Full Name</label><input v-model="form.name" class="form-control" /></div>
          <div class="form-group"><label class="form-label">Business Name</label><input v-model="form.businessName" class="form-control" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">GSTIN</label><input v-model="form.gstin" class="form-control" placeholder="27XXXXX1234Z5" /></div>
          <div class="form-group"><label class="form-label">Phone</label><input v-model="form.phone" class="form-control" /></div>
        </div>
        <div class="form-group"><label class="form-label">Business Address</label><textarea v-model="form.address" class="form-control" rows="3"></textarea></div>
        <div class="flex-end">
          <button class="btn btn-primary" @click="save" :disabled="loading">
            <div v-if="loading" class="spinner" style="width:14px;height:14px;"></div>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </div>

    <div class="card" style="border-color:rgba(239,68,68,.2);">
      <h3 style="margin-bottom:12px;color:var(--red2);">Danger Zone</h3>
      <p style="font-size:13px;margin-bottom:16px;">Sign out from your account. Your data stays safe in the database.</p>
      <button class="btn btn-danger" @click="logout">Sign Out</button>
    </div>
  </div>
</template>
