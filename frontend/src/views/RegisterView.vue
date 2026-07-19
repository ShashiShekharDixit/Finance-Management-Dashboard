<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()
const form = ref({ name:'', email:'', password:'', businessName:'', gstin:'', phone:'' })
const error   = ref('')
const loading = ref(false)

async function submit() {
  if (!form.value.name || !form.value.email || !form.value.password) { error.value='Required fields missing'; return }
  error.value=''; loading.value=true
  try {
    await auth.register(form.value)
    router.push('/dashboard')
  } catch(e:any) { error.value = e.response?.data?.message || 'Registration failed' }
  finally { loading.value=false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card fade-in" style="max-width:480px;">
      <div class="auth-logo">
        <div class="icon">💹</div>
        <h1>Create Account</h1>
        <p>Set up your finance workspace</p>
      </div>

      <div v-if="error" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--red2);border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:16px;">{{ error }}</div>

      <form @submit.prevent="submit" style="display:flex;flex-direction:column;gap:14px;">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input v-model="form.name" class="form-control" placeholder="Shashi Dixit" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input v-model="form.phone" class="form-control" placeholder="9876543210" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="you@business.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Password *</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="Min 6 characters" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Business Name</label>
            <input v-model="form.businessName" class="form-control" placeholder="My Business" />
          </div>
          <div class="form-group">
            <label class="form-label">GSTIN</label>
            <input v-model="form.gstin" class="form-control" placeholder="27XXXXX1234Z5" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading" style="width:100%;justify-content:center;margin-top:4px;">
          <div v-if="loading" class="spinner" style="width:16px;height:16px;"></div>
          <span v-else>Create Account →</span>
        </button>
      </form>

      <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--mid);">
        Already have an account? <router-link to="/login" style="color:var(--blue);">Sign in</router-link>
      </p>
    </div>
  </div>
</template>
