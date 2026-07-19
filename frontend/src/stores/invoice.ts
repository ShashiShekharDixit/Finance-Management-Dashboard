import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'
import type { Invoice } from '@/types'

export const useInvoiceStore = defineStore('invoice', () => {
  const invoices   = ref<Invoice[]>([])
  const current    = ref<Invoice | null>(null)
  const loading    = ref(false)
  const total      = ref(0)
  const statusTotals = ref<any[]>([])

  async function fetch(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/invoices', { params })
      invoices.value   = data.invoices
      total.value      = data.total
      statusTotals.value = data.statusTotals || []
    } finally { loading.value = false }
  }

  async function fetchOne(id: string) {
    loading.value = true
    try {
      const { data } = await api.get(`/invoices/${id}`)
      current.value = data.invoice
    } finally { loading.value = false }
  }

  async function create(payload: any) {
    const { data } = await api.post('/invoices', payload)
    invoices.value.unshift(data.invoice)
    return data.invoice
  }

  async function update(id: string, payload: any) {
    const { data } = await api.put(`/invoices/${id}`, payload)
    const idx = invoices.value.findIndex(i => i._id === id)
    if (idx > -1) invoices.value[idx] = data.invoice
    current.value = data.invoice
    return data.invoice
  }

  async function recordPayment(id: string, payload: any) {
    const { data } = await api.patch(`/invoices/${id}/payment`, payload)
    const idx = invoices.value.findIndex(i => i._id === id)
    if (idx > -1) invoices.value[idx] = data.invoice
    return data.invoice
  }

  async function remove(id: string) {
    await api.delete(`/invoices/${id}`)
    invoices.value = invoices.value.filter(i => i._id !== id)
  }

  return { invoices, current, loading, total, statusTotals, fetch, fetchOne, create, update, recordPayment, remove }
})
