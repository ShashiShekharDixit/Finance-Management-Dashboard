import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('ff_token') || '')
  const user  = ref<User | null>(JSON.parse(localStorage.getItem('ff_user') || 'null'))

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    token.value = data.token
    user.value  = data.user
    localStorage.setItem('ff_token', data.token)
    localStorage.setItem('ff_user', JSON.stringify(data.user))
  }

  async function register(payload: any) {
    const { data } = await api.post('/auth/register', payload)
    token.value = data.token
    user.value  = data.user
    localStorage.setItem('ff_token', data.token)
    localStorage.setItem('ff_user', JSON.stringify(data.user))
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me')
    user.value = data.user
    localStorage.setItem('ff_user', JSON.stringify(data.user))
  }

  async function updateProfile(payload: any) {
    const { data } = await api.put('/auth/profile', payload)
    user.value = data.user
    localStorage.setItem('ff_user', JSON.stringify(data.user))
  }

  function logout() {
    token.value = ''
    user.value  = null
    localStorage.removeItem('ff_token')
    localStorage.removeItem('ff_user')
  }

  return { token, user, isAuthenticated, login, register, fetchMe, updateProfile, logout }
})
