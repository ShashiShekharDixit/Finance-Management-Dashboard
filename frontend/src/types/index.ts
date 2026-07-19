export interface User {
  _id: string
  name: string
  email: string
  businessName: string
  gstin: string
  phone: string
  address: string
  role: string
}

export interface Client {
  _id: string
  type: 'client' | 'vendor'
  name: string
  email: string
  phone: string
  gstin: string
  pan: string
  address: string
  city: string
  state: string
  company: string
  totalBilled: number
  totalPaid: number
  isActive: boolean
  createdAt: string
}

export interface LineItem {
  description: string
  hsn: string
  quantity: number
  unit: string
  rate: number
  gstRate: 0 | 5 | 12 | 18 | 28
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
  totalAmount: number
}

export interface Invoice {
  _id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  type: 'invoice' | 'proforma' | 'credit_note'
  gstType: 'intra' | 'inter'
  client: Client | string
  items: LineItem[]
  subtotal: number
  totalCGST: number
  totalSGST: number
  totalIGST: number
  totalGST: number
  discount: number
  discountType: 'flat' | 'percent'
  grandTotal: number
  amountPaid: number
  balanceDue: number
  notes: string
  terms: string
  createdAt: string
}

export interface Expense {
  _id: string
  title: string
  category: string
  amount: number
  gstRate: number
  gstAmount: number
  totalAmount: number
  date: string
  paymentMethod: string
  reference: string
  notes: string
  vendor?: Client | string
  createdAt: string
}

export interface Income {
  _id: string
  title: string
  category: string
  amount: number
  gstRate: number
  gstAmount: number
  totalAmount: number
  date: string
  paymentMethod: string
  reference: string
  notes: string
  client?: Client | string
  createdAt: string
}

export interface DashboardData {
  summary: {
    totalRevenue: number
    monthRevenue: number
    totalExpenses: number
    monthExpenses: number
    totalIncome: number
    monthIncome: number
    netProfit: number
    pendingAmount: number
    clientCount: number
  }
  invoiceStats: { _id: string; count: number; amount: number }[]
  overdueInvoices: Invoice[]
  recentInvoices: Invoice[]
  monthlyTrend: { _id: { year: number; month: number }; revenue: number; count: number }[]
  expenseByCategory: { _id: string; total: number }[]
}
