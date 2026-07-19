export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

export const formatDate = (date: string | Date): string => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export const formatDateInput = (date: string | Date): string => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

export const getMonthName = (month: number): string => {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month - 1]
}

export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    paid: 'var(--green)',
    partial: 'var(--amber)',
    sent: 'var(--blue)',
    draft: 'var(--mid)',
    overdue: 'var(--red)',
    cancelled: 'var(--faint)',
  }
  return map[status] || 'var(--mid)'
}

export const GST_RATES = [0, 5, 12, 18, 28] as const
export const PAYMENT_METHODS = ['cash', 'bank', 'upi', 'card', 'cheque'] as const
export const EXPENSE_CATEGORIES = [
  'Office Supplies','Travel','Utilities','Rent','Salaries',
  'Marketing','Software','Equipment','Maintenance','Food',
  'Professional Fees','Taxes','Insurance','Miscellaneous'
]
export const INCOME_CATEGORIES = [
  'Sales','Service','Consulting','Rental','Investment',
  'Interest','Commission','Freelance','Refund','Other'
]
