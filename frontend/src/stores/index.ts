import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'
import type { Expense, Income, Client, DashboardData } from '@/types'

// ── EXPENSE STORE ──
export const useExpenseStore = defineStore('expense', () => {
  const expenses = ref<Expense[]>([])
  const loading  = ref(false)
  const total    = ref(0)
  const summary  = ref<any[]>([])

  async function fetch(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/expenses', { params })
      expenses.value = data.expenses
      total.value    = data.total
      summary.value  = data.summary || []
    } finally { loading.value = false }
  }

  async function create(payload: any) {
    const { data } = await api.post('/expenses', payload)
    expenses.value.unshift(data.expense)
    return data.expense
  }

  async function update(id: string, payload: any) {
    const { data } = await api.put(`/expenses/${id}`, payload)
    const idx = expenses.value.findIndex(e => e._id === id)
    if (idx > -1) expenses.value[idx] = data.expense
    return data.expense
  }

  async function remove(id: string) {
    await api.delete(`/expenses/${id}`)
    expenses.value = expenses.value.filter(e => e._id !== id)
  }

  return { expenses, loading, total, summary, fetch, create, update, remove }
})

// ── INCOME STORE ──
export const useIncomeStore = defineStore('income', () => {
  const income   = ref<Income[]>([])
  const loading  = ref(false)
  const total    = ref(0)
  const summary  = ref<any[]>([])

  async function fetch(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/income', { params })
      income.value  = data.income
      total.value   = data.total
      summary.value = data.summary || []
    } finally { loading.value = false }
  }

  async function create(payload: any) {
    const { data } = await api.post('/income', payload)
    income.value.unshift(data.income)
    return data.income
  }

  async function update(id: string, payload: any) {
    const { data } = await api.put(`/income/${id}`, payload)
    const idx = income.value.findIndex(i => i._id === id)
    if (idx > -1) income.value[idx] = data.income
    return data.income
  }

  async function remove(id: string) {
    await api.delete(`/income/${id}`)
    income.value = income.value.filter(i => i._id !== id)
  }

  return { income, loading, total, summary, fetch, create, update, remove }
})

// ── CLIENT STORE ──
export const useClientStore = defineStore('client', () => {
  const clients  = ref<Client[]>([])
  const loading  = ref(false)
  const total    = ref(0)

  async function fetch(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/clients', { params })
      clients.value = data.clients
      total.value   = data.total
    } finally { loading.value = false }
  }

  async function create(payload: any) {
    const { data } = await api.post('/clients', payload)
    clients.value.unshift(data.client)
    return data.client
  }

  async function update(id: string, payload: any) {
    const { data } = await api.put(`/clients/${id}`, payload)
    const idx = clients.value.findIndex(c => c._id === id)
    if (idx > -1) clients.value[idx] = data.client
    return data.client
  }

  async function remove(id: string) {
    await api.delete(`/clients/${id}`)
    clients.value = clients.value.filter(c => c._id !== id)
  }

  return { clients, loading, total, fetch, create, update, remove }
})

// ── DASHBOARD STORE ──
export const useDashboardStore = defineStore('dashboard', () => {
  const data    = ref<DashboardData | null>(null)
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const res = await api.get('/dashboard')
      data.value = res.data
    } finally { loading.value = false }
  }

  return { data, loading, fetch }
})
