import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  Plus,
  IndianRupee,
  Receipt,
  Wallet,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react'
import api from '../../services/api'

interface Student {
  id: number
  username: string
  first_name: string
  last_name: string
  admission_number?: string
}

interface Batch {
  id: number
  batch_name: string
  batch_code: string
}

interface Invoice {
  id: number
  student: number
  student_name?: string
  admission_number?: string
  batch: number
  batch_name?: string
  total_fee: string | number
  discount: string | number
  final_fee?: string | number
  paid_amount?: string | number
  balance_amount?: string | number
  due_date: string
  status: string
  notes?: string
}

interface Payment {
  id: number
  invoice: number
  receipt_number: string
  student_name?: string
  admission_number?: string
  amount: string | number
  payment_method: string
  payment_date: string
  transaction_id?: string
  remarks?: string
}

interface InvoiceForm {
  student: string
  batch: string
  total_fee: string
  discount: string
  due_date: string
  notes: string
}

interface PaymentForm {
  invoice: string
  amount: string
  payment_method: string
  payment_date: string
  transaction_id: string
  remarks: string
}

function getList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]

  if (
    data &&
    typeof data === 'object' &&
    'results' in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results
  }

  return []
}

const initialInvoiceForm: InvoiceForm = {
  student: '',
  batch: '',
  total_fee: '',
  discount: '0',
  due_date: '',
  notes: '',
}

const initialPaymentForm: PaymentForm = {
  invoice: '',
  amount: '',
  payment_method: 'UPI',
  payment_date: new Date().toISOString().split('T')[0],
  transaction_id: '',
  remarks: '',
}

const currency = (value: string | number | undefined) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`

function Fees() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices')

  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(initialInvoiceForm)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(initialPaymentForm)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [invoiceRes, paymentRes, studentRes, batchRes] = await Promise.all([
        api.get('fees/invoices/'),
        api.get('fees/payments/'),
        api.get('students/'),
        api.get('batches/'),
      ])

      setInvoices(getList<Invoice>(invoiceRes.data))
      setPayments(getList<Payment>(paymentRes.data))
      setStudents(getList<Student>(studentRes.data))
      setBatches(getList<Batch>(batchRes.data))
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          'Unable to load fee records. Please check your connection.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalFees = useMemo(
    () => invoices.reduce((sum, item) => sum + Number(item.final_fee ?? Number(item.total_fee) - Number(item.discount)), 0),
    [invoices]
  )

  const totalCollected = useMemo(
    () => invoices.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0),
    [invoices]
  )

  const totalPending = useMemo(
    () => invoices.reduce((sum, item) => sum + Number(item.balance_amount ?? Math.max(0, Number(item.final_fee ?? Number(item.total_fee) - Number(item.discount)) - Number(item.paid_amount || 0))), 0),
    [invoices]
  )

  const filteredInvoices = invoices.filter((item) => {
    const text = `${item.student_name || ''} ${item.admission_number || ''} ${item.batch_name || ''} ${item.status}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const filteredPayments = payments.filter((item) => {
    const text = `${item.receipt_number} ${item.student_name || ''} ${item.admission_number || ''} ${item.payment_method}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('fees/invoices/create/', {
        student: Number(invoiceForm.student),
        batch: Number(invoiceForm.batch),
        total_fee: Number(invoiceForm.total_fee),
        discount: Number(invoiceForm.discount || 0),
        due_date: invoiceForm.due_date,
        notes: invoiceForm.notes,
      })

      setSuccess('Fee invoice created successfully.')
      setInvoiceForm(initialInvoiceForm)
      setShowInvoiceForm(false)
      await loadData()
    } catch (err: any) {
      const data = err.response?.data
      setError(
        typeof data === 'string'
          ? data
          : data?.detail || JSON.stringify(data || 'Unable to create invoice.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('fees/payments/create/', {
        invoice: Number(paymentForm.invoice),
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        transaction_id: paymentForm.transaction_id,
        remarks: paymentForm.remarks,
      })

      setSuccess('Payment recorded successfully.')
      setPaymentForm(initialPaymentForm)
      setShowPaymentForm(false)
      await loadData()
    } catch (err: any) {
      const data = err.response?.data
      setError(
        typeof data === 'string'
          ? data
          : data?.detail || JSON.stringify(data || 'Unable to record payment.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const selectedInvoice = invoices.find(
    (item) => item.id === Number(paymentForm.invoice)
  )

  const getBalance = (item: Invoice) =>
    Number(
      item.balance_amount ??
        Math.max(
          0,
          Number(item.final_fee ?? Number(item.total_fee) - Number(item.discount)) -
            Number(item.paid_amount || 0)
        )
    )

  const statusClass = (status: string) => {
    const value = status.toUpperCase()

    if (value === 'PAID') return 'bg-green-100 text-green-700'
    if (value === 'PARTIAL') return 'bg-blue-100 text-blue-700'
    if (value === 'OVERDUE') return 'bg-red-100 text-red-700'

    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Fees & Payments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage student fee invoices and payment records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={() => {
              setError('')
              setShowInvoiceForm(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Create Invoice
          </button>

          <button
            onClick={() => {
              setError('')
              setShowPaymentForm(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <IndianRupee size={17} />
            Add Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Invoices</p>
            <Receipt className="text-blue-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">
            {invoices.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Fee Amount</p>
            <Wallet className="text-purple-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">
            {currency(totalFees)}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Collected Amount</p>
            <CheckCircle className="text-green-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-green-600">
            {currency(totalCollected)}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Pending Amount</p>
            <Clock className="text-orange-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-orange-600">
            {currency(totalPending)}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Fee Invoices
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeTab === 'payments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Payment History
            </button>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading fee records...
          </div>
        ) : activeTab === 'invoices' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Total Fee</th>
                  <th className="px-5 py-4">Paid</th>
                  <th className="px-5 py-4">Balance</th>
                  <th className="px-5 py-4">Due Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {item.student_name || `Student #${item.student}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.admission_number || `ID: ${item.student}`}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.batch_name || `Batch #${item.batch}`}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {currency(item.final_fee ?? Number(item.total_fee) - Number(item.discount))}
                    </td>

                    <td className="px-5 py-4 font-medium text-green-600">
                      {currency(item.paid_amount)}
                    </td>

                    <td className="px-5 py-4 font-medium text-orange-600">
                      {currency(getBalance(item))}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.due_date}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {getBalance(item) > 0 ? (
                        <button
                          onClick={() => {
                            setPaymentForm({
                              ...initialPaymentForm,
                              invoice: String(item.id),
                              amount: String(getBalance(item)),
                            })
                            setError('')
                            setShowPaymentForm(true)
                          }}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Collect Fee
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-green-600">
                          Fully Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      No fee invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Receipt Number</th>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Payment Date</th>
                  <th className="px-5 py-4">Transaction ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-blue-600">
                      {item.receipt_number}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {item.student_name || `Invoice #${item.invoice}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.admission_number || ''}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-semibold text-green-600">
                      {currency(item.amount)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.payment_method}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.payment_date}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {item.transaction_id || '-'}
                    </td>
                  </tr>
                ))}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      No payment records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInvoiceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Create Fee Invoice
                </h2>
                <p className="text-sm text-slate-500">
                  Generate a new student fee invoice.
                </p>
              </div>
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Student *
                </label>
                <select
                  required
                  value={invoiceForm.student}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, student: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.admission_number || student.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Batch *
                </label>
                <select
                  required
                  value={invoiceForm.batch}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, batch: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name} ({batch.batch_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Total Fee (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={invoiceForm.total_fee}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, total_fee: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                    placeholder="25000"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceForm.discount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date *
                </label>
                <input
                  required
                  type="date"
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowInvoiceForm(false)}
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Record Fee Payment
                </h2>
                <p className="text-sm text-slate-500">
                  Add a payment against an invoice.
                </p>
              </div>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fee Invoice *
                </label>
                <select
                  required
                  value={paymentForm.invoice}
                  onChange={(e) => {
                    const invoice = invoices.find((item) => item.id === Number(e.target.value))
                    setPaymentForm({
                      ...paymentForm,
                      invoice: e.target.value,
                      amount: invoice ? String(getBalance(invoice)) : '',
                    })
                  }}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select Invoice</option>
                  {invoices.filter((item) => getBalance(item) > 0).map((item) => (
                    <option key={item.id} value={item.id}>
                      Invoice #{item.id} - {item.student_name || `Student #${item.student}`} - Balance {currency(getBalance(item))}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="rounded-lg bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Amount</span>
                    <strong>{currency(selectedInvoice.final_fee ?? Number(selectedInvoice.total_fee) - Number(selectedInvoice.discount))}</strong>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-slate-500">Already Paid</span>
                    <strong className="text-green-600">{currency(selectedInvoice.paid_amount)}</strong>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-slate-500">Remaining Balance</span>
                    <strong className="text-orange-600">{currency(getBalance(selectedInvoice))}</strong>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Payment Amount (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    max={selectedInvoice ? getBalance(selectedInvoice) : undefined}
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Payment Date *
                </label>
                <input
                  required
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Transaction ID
                </label>
                <input
                  value={paymentForm.transaction_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                  placeholder="Optional transaction reference"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Remarks
                </label>
                <textarea
                  rows={2}
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500"
                  placeholder="Optional remarks..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting || !selectedInvoice}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fees