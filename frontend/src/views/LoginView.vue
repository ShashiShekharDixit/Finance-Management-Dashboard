<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()
const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)

async function submit() {
  if (!email.value || !password.value) { error.value = 'All fields required'; return }
  error.value = ''; loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Login failed'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card fade-in">
      <div class="auth-logo">
        <div class="icon">💹</div>
        <h1>FinanceFlow</h1>
        <p>Sign in to your account</p>
      </div>

      <div v-if="error" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--red2);border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:16px;">
        {{ error }}
      </div>

      <form @submit.prevent="submit" style="display:flex;flex-direction:column;gap:16px;">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-control" placeholder="you@business.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" class="form-control" placeholder="••••••••" />
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading" style="width:100%;justify-content:center;margin-top:4px;">
          <div v-if="loading" class="spinner" style="width:16px;height:16px;"></div>
          <span v-else>Sign In →</span>
        </button>
      </form>

      <p style="text-align:center;margin-top:20px;font-size:13px;color:var(--mid);">
        No account?
        <router-link to="/register" style="color:var(--blue);">Create one</router-link>
      </p>
    </div>
  </div>
</template>
