import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  BookOpen,
  IndianRupee,
  Bell,
  RefreshCw,
  LogOut,
  TrendingUp,
  Activity,
  Wallet,
  ClipboardCheck,
  CalendarDays,
  FileText,
  ArrowUpRight,
  Eye,
  UserPlus,
  UserCheck,
  BarChart3,
  Clock,
  Layers,
  Award,
} from 'lucide-react'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

interface DashboardData {
  total_students: number
  total_teachers: number
  total_courses: number
  total_batches: number
  total_attendance_records: number
  total_examinations: number
  total_fee_invoices: number
  total_fees_collected: number
  pending_fee_invoices: number
  today_attendance: number
  unread_notifications: number
}

interface DashboardResponse {
  role: string
  dashboard: DashboardData
}

interface Student {
  id: number
  admission_number?: string
  username?: string
  first_name?: string
  last_name?: string
  status?: string
  user?: {
    first_name?: string
    last_name?: string
    username?: string
  }
}

interface Notification {
  id: number
  title: string
  message: string
  notification_type?: string
  created_at?: string
  is_read?: boolean
}

interface AttendanceRecord {
  id: number
  student_name: string
  admission_number?: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
}

interface ExamResult {
  id: number
  student_name: string
  exam_name: string
  marks_obtained: string
  total_marks: number
  percentage: number
  grade: string
  result_status: string
  created_at?: string
}

interface FeeInvoice {
  id: number
  total_fee?: number | string
  discount?: number | string
  final_fee?: number | string
  paid_amount?: number | string
  balance_amount?: number | string
  status?: string
}

const defaultData: DashboardData = {
  total_students: 0,
  total_teachers: 0,
  total_courses: 0,
  total_batches: 0,
  total_attendance_records: 0,
  total_examinations: 0,
  total_fee_invoices: 0,
  total_fees_collected: 0,
  pending_fee_invoices: 0,
  today_attendance: 0,
  unread_notifications: 0,
}

function getList<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[]
  }

  if (
    response &&
    typeof response === 'object' &&
    'results' in response &&
    Array.isArray((response as { results: unknown }).results)
  ) {
    return (response as { results: T[] }).results
  }

  return []
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

function formatTime(date?: string) {
  if (!date) return 'Recently'

  const difference = Date.now() - new Date(date).getTime()

  if (Number.isNaN(difference)) return 'Recently'

  const minutes = Math.floor(difference / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `${hours} hr ago`

  return `${Math.floor(hours / 24)} days ago`
}

function getLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()

  const [data, setData] = useState<DashboardData>(defaultData)
  const [students, setStudents] = useState<Student[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [feeInvoices, setFeeInvoices] = useState<FeeInvoice[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [
        dashboardRes,
        studentsRes,
        notificationsRes,
        attendanceRes,
        resultsRes,
        invoicesRes,
      ] = await Promise.allSettled([
        api.get<DashboardResponse>('dashboard/'),
        api.get('students/'),
        api.get('notifications/'),
        api.get('attendance/'),
        api.get('examinations/results/'),
        api.get('fees/invoices/'),
      ])

      if (dashboardRes.status === 'fulfilled') {
        setData({
          ...defaultData,
          ...dashboardRes.value.data.dashboard,
        })
      } else {
        throw new Error('Dashboard API could not be loaded.')
      }

      if (studentsRes.status === 'fulfilled') {
        setStudents(getList<Student>(studentsRes.value.data))
      }

      if (notificationsRes.status === 'fulfilled') {
        setNotifications(
          getList<Notification>(notificationsRes.value.data).slice(0, 4),
        )
      }

      if (attendanceRes.status === 'fulfilled') {
        setAttendanceRecords(
          getList<AttendanceRecord>(attendanceRes.value.data),
        )
      }

      if (resultsRes.status === 'fulfilled') {
        setExamResults(
          getList<ExamResult>(resultsRes.value.data),
        )
      }

      if (invoicesRes.status === 'fulfilled') {
        setFeeInvoices(
          getList<FeeInvoice>(invoicesRes.value.data),
        )
      }
    } catch {
      setError(
        'Dashboard data load झाले नाही. Refresh करून पुन्हा प्रयत्न करा.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  // Fee calculations from invoice API
  const hasInvoiceData = feeInvoices.length > 0

  const totalInvoiced = feeInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.final_fee ?? invoice.total_fee ?? 0),
    0,
  )

  const totalPaid = feeInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.paid_amount ?? 0),
    0,
  )

  const totalPending = feeInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance_amount ?? 0),
    0,
  )

  const feePaidAmount = hasInvoiceData
    ? totalPaid
    : data.total_fees_collected

  const feePendingAmount = hasInvoiceData
    ? totalPending
    : 0

  const feeTotalAmount = hasInvoiceData
    ? totalInvoiced
    : data.total_fees_collected

  const feeLabel = formatCurrency(feePaidAmount)

  const paidPercentage =
    feeTotalAmount > 0
      ? (feePaidAmount / feeTotalAmount) * 100
      : 0

  // Statistics cards
  const stats = [
    {
      title: 'Total Students',
      value: data.total_students.toLocaleString('en-IN'),
      icon: Users,
      color: 'blue',
      change: 'Students registered',
    },
    {
      title: 'Total Teachers',
      value: data.total_teachers.toLocaleString('en-IN'),
      icon: GraduationCap,
      color: 'green',
      change: 'Academy faculty',
    },
    {
      title: 'Total Courses',
      value: data.total_courses.toLocaleString('en-IN'),
      icon: BookOpen,
      color: 'purple',
      change: 'Available courses',
    },
    {
      title: 'Fees Collected',
      value: feeLabel,
      icon: IndianRupee,
      color: 'orange',
      change: `${data.pending_fee_invoices} pending invoices`,
    },
  ]

  // Student search
  const filteredStudents = students
    .filter((student) => {
      const name = [
        student.first_name,
        student.last_name,
        student.user?.first_name,
        student.user?.last_name,
        student.admission_number,
        student.user?.username,
        student.username,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return name.includes(search.toLowerCase())
    })
    .slice(0, 5)

  // Academy overview
  const maxValue = Math.max(
    data.total_students,
    data.total_teachers,
    data.total_courses,
    data.total_batches,
    1,
  )

  const summaryItems = [
    { label: 'Students', value: data.total_students, color: 'bg-blue-500' },
    { label: 'Teachers', value: data.total_teachers, color: 'bg-purple-500' },
    { label: 'Courses', value: data.total_courses, color: 'bg-green-500' },
    { label: 'Batches', value: data.total_batches, color: 'bg-orange-500' },
  ]

  // Attendance chart: last seven days
  const attendanceChartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))

    const dateString = getLocalDate(date)

    const records = attendanceRecords.filter(
      (item) => item.date === dateString,
    )

    return {
      day: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
      present: records.filter((item) => item.status === 'PRESENT').length,
      absent: records.filter((item) => item.status === 'ABSENT').length,
      late: records.filter((item) => item.status === 'LATE').length,
      excused: records.filter((item) => item.status === 'EXCUSED').length,
    }
  })

  // Examination grade chart
  const gradeOrder = ['A+', 'A', 'B', 'C', 'D', 'E', 'F']

  const gradeChartData = gradeOrder
    .map((grade) => ({
      name: grade,
      value: examResults.filter((result) => result.grade === grade).length,
    }))
    .filter((item) => item.value > 0)

  const gradeColors: Record<string, string> = {
    'A+': '#16a34a',
    A: '#2563eb',
    B: '#8b5cf6',
    C: '#f59e0b',
    D: '#f97316',
    E: '#64748b',
    F: '#ef4444',
  }

  const passedResults = examResults.filter(
    (result) => result.result_status === 'PASS',
  ).length

  const failedResults = examResults.filter(
    (result) => result.result_status === 'FAIL',
  ).length

  const averagePercentage =
    examResults.length > 0
      ? examResults.reduce(
          (sum, result) => sum + Number(result.percentage || 0),
          0,
        ) / examResults.length
      : 0

  return (
    <div className="min-h-screen bg-[#f5f6fc] text-slate-900">

      {/* Top Header */}
      <header className="sticky top-0 z-20 flex flex-col justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:flex-row md:items-center md:px-8">

        <div className="relative w-full md:max-w-xl">
          <Users
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center justify-between gap-5">

          <Link
            to="/admin/notifications"
            className="relative rounded-full p-2 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
            title="Notifications"
          >
            <Bell size={23} />

            {data.unread_notifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {data.unread_notifications}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {(user?.first_name || user?.username || 'A')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {user?.first_name || user?.username || 'Admin'}
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={19} />
            </button>

          </div>
        </div>
      </header>

      <main className="space-y-6 p-5 md:p-8">

        {/* Page Heading */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <p className="mt-1 text-base text-slate-600">
              Welcome back, {user?.first_name || user?.username || 'Admin'}! 👋
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-sm">
              <CalendarDays size={18} className="text-indigo-600" />
              {currentDate}
            </div>

            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? 'animate-spin' : ''}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {stats.map((stat) => {
            const Icon = stat.icon

            const colorClasses: Record<string, string> = {
              blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-600',
              green: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/80 text-emerald-600',
              purple: 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/80 text-purple-600',
              orange: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/80 text-orange-600',
            }

            return (
              <div
                key={stat.title}
                className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${colorClasses[stat.color]}`}
              >

                <div className="absolute -bottom-10 -right-5 h-32 w-32 rounded-full bg-white/40" />

                <div className="relative flex items-start justify-between">

                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {stat.title}
                    </p>

                    <h2 className="mt-4 text-3xl font-extrabold text-slate-900">
                      {loading ? '...' : stat.value}
                    </h2>

                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {stat.change}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
                    <Icon size={27} />
                  </div>

                </div>
              </div>
            )
          })}

        </section>

        {/* Main Dashboard Grid */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* Academy Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">

            <div className="mb-6 flex items-center justify-between">

              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <BarChart3 size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Academy Overview
                  </h2>

                  <p className="text-xs text-slate-500">
                    Current academy statistics
                  </p>
                </div>
              </div>

              <Activity size={20} className="text-slate-400" />

            </div>

            <div className="space-y-6">

              {summaryItems.map((item) => (
                <div key={item.label}>

                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">
                      {item.label}
                    </span>

                    <span className="font-bold text-slate-900">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                      style={{
                        width: `${(item.value / maxValue) * 100}%`,
                      }}
                    />
                  </div>

                </div>
              ))}

            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-xs font-medium text-indigo-600">
                  Examinations
                </p>

                <p className="mt-1 text-2xl font-bold text-indigo-900">
                  {data.total_examinations}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-600">
                  Attendance Records
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-900">
                  {data.total_attendance_records}
                </p>
              </div>

            </div>
          </div>

          {/* Fee Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">

            <div className="mb-6 flex items-center gap-3">

              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <Wallet size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Fee Overview
                </h2>

                <p className="text-xs text-slate-500">
                  Payment collection summary
                </p>
              </div>

            </div>

            <div className="flex flex-col items-center justify-center py-3">

              <div
                className="relative flex h-44 w-44 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#16a34a 0% ${paidPercentage}%, #f97316 ${paidPercentage}% 100%)`,
                }}
              >

                <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white shadow-inner">

                  <span className="text-2xl font-extrabold text-slate-900">
                    {data.total_fee_invoices}
                  </span>

                  <span className="text-xs text-slate-500">
                    Total Invoices
                  </span>

                </div>
              </div>

              <p className="mt-5 text-center text-2xl font-extrabold text-slate-900">
                {feeLabel}
              </p>

              <p className="text-sm text-slate-500">
                Total fees collected
              </p>

            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">

              <div className="flex items-center justify-between text-sm">

                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  Payments received
                </span>

                <span className="font-bold text-slate-900">
                  {formatCurrency(feePaidAmount)}
                </span>

              </div>

              <div className="flex items-center justify-between text-sm">

                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                  Pending amount
                </span>

                <span className="font-bold text-slate-900">
                  {hasInvoiceData
                    ? formatCurrency(feePendingAmount)
                    : 'Unavailable'}
                </span>

              </div>

            </div>
          </div>

          {/* Recent Notifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex items-center gap-2">
                <Bell size={21} className="text-indigo-600" />

                <h2 className="font-bold text-slate-900">
                  Recent Notifications
                </h2>
              </div>

              <Link
                to="/admin/notifications"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View All →
              </Link>

            </div>

            <div className="space-y-4">

              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className="flex gap-3 border-b border-slate-100 pb-3 last:border-0"
                  >

                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        index % 3 === 0
                          ? 'bg-blue-500'
                          : index % 3 === 1
                            ? 'bg-emerald-500'
                            : 'bg-orange-400'
                      }`}
                    />

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-800">
                        {notification.title}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {notification.message}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatTime(notification.created_at)}
                      </p>

                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  No notifications available.
                </p>
              )}

            </div>
          </div>

        </section>

        {/* Attendance and Examination Charts */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

          {/* Attendance Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Attendance Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Last 7 days attendance records
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <UserCheck size={22} />
              </div>

            </div>

            <div className="h-72">

              {attendanceRecords.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">

                  <LineChart data={attendanceChartData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />

                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="present"
                      name="Present"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="absent"
                      name="Absent"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="late"
                      name="Late"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />

                  </LineChart>

                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No attendance records available.
                </div>
              )}

            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">

              <div className="rounded-xl bg-green-50 p-3 text-center">
                <p className="text-xs text-green-700">Present</p>

                <p className="mt-1 text-xl font-bold text-green-800">
                  {attendanceRecords.filter(
                    (item) => item.status === 'PRESENT',
                  ).length}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3 text-center">
                <p className="text-xs text-red-700">Absent</p>

                <p className="mt-1 text-xl font-bold text-red-800">
                  {attendanceRecords.filter(
                    (item) => item.status === 'ABSENT',
                  ).length}
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-3 text-center">
                <p className="text-xs text-orange-700">Late</p>

                <p className="mt-1 text-xl font-bold text-orange-800">
                  {attendanceRecords.filter(
                    (item) => item.status === 'LATE',
                  ).length}
                </p>
              </div>

            </div>
          </div>

          {/* Exam Performance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Exam Performance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Student grade distribution
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                <Award size={22} />
              </div>

            </div>

            <div className="h-72">

              {gradeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie
                      data={gradeChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      label
                    >

                      {gradeChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={gradeColors[entry.name]}
                        />
                      ))}

                    </Pie>

                    <Tooltip />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No examination results available.
                </div>
              )}

            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">

              <div className="rounded-xl bg-green-50 p-3 text-center">
                <p className="text-xs text-green-700">Passed</p>

                <p className="mt-1 text-xl font-bold text-green-800">
                  {passedResults}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3 text-center">
                <p className="text-xs text-red-700">Failed</p>

                <p className="mt-1 text-xl font-bold text-red-800">
                  {failedResults}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-3 text-center">
                <p className="text-xs text-indigo-700">Average</p>

                <p className="mt-1 text-xl font-bold text-indigo-800">
                  {averagePercentage.toFixed(1)}%
                </p>
              </div>

            </div>
          </div>

        </section>

        {/* Recent Exam Results */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                <FileText size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Recent Exam Results
                </h2>

                <p className="text-xs text-slate-500">
                  Latest student examination performance
                </p>
              </div>

            </div>

            <Link
              to="/admin/examinations"
              className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All <ArrowUpRight size={16} />
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Examination</th>
                  <th className="px-5 py-4">Marks</th>
                  <th className="px-5 py-4">Percentage</th>
                  <th className="px-5 py-4">Grade</th>
                  <th className="px-5 py-4">Result</th>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {examResults.length > 0 ? (
                  examResults.slice(0, 5).map((result) => (

                    <tr
                      key={result.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {result.student_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {result.exam_name}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {result.marks_obtained} / {result.total_marks}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {Number(result.percentage).toFixed(1)}%
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-indigo-100 px-3 py-1 font-bold text-indigo-700">
                          {result.grade}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            result.result_status === 'PASS'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {result.result_status}
                        </span>
                      </td>

                    </tr>

                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      No examination results available.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>
        </section>

        {/* Lower Dashboard Grid */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* Recent Students */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-8">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Users size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Recent Students
                  </h2>

                  <p className="text-xs text-slate-500">
                    Latest registered students
                  </p>
                </div>

              </div>

              <Link
                to="/admin/students"
                className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View All <ArrowUpRight size={16} />
              </Link>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[600px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">

                  <tr>
                    <th className="px-5 py-4">Admission No.</th>
                    <th className="px-5 py-4">Student Name</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {

                      const firstName =
                        student.first_name || student.user?.first_name || ''

                      const lastName =
                        student.last_name || student.user?.last_name || ''

                      const name =
                        `${firstName} ${lastName}`.trim() ||
                        student.username ||
                        student.user?.username ||
                        'Student'

                      return (
                        <tr
                          key={student.id}
                          className="transition hover:bg-slate-50"
                        >

                          <td className="px-5 py-4 font-medium text-slate-600">
                            {student.admission_number || `STU-${student.id}`}
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {name}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                student.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {student.status || 'ACTIVE'}
                            </span>

                          </td>

                          <td className="px-5 py-4 text-right">

                            <Link
                              to="/admin/students"
                              className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                              title="View Students"
                            >
                              <Eye size={17} />
                            </Link>

                          </td>

                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-slate-400"
                      >
                        {loading ? 'Loading students...' : 'No students found.'}
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          </div>

          {/* Quick Actions and Academy Activity */}
          <div className="space-y-5 xl:col-span-4">

            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center gap-2">
                <TrendingUp size={21} className="text-indigo-600" />

                <h2 className="font-bold text-slate-900">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <Link
                  to="/admin/students"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-indigo-50/60 p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-100"
                >
                  <UserPlus size={24} className="text-indigo-600" />

                  <span className="text-xs font-semibold">
                    Add Student
                  </span>
                </Link>

                <Link
                  to="/admin/teachers"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-indigo-50/60 p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-100"
                >
                  <GraduationCap size={24} className="text-indigo-600" />

                  <span className="text-xs font-semibold">
                    Add Teacher
                  </span>
                </Link>

                <Link
                  to="/admin/attendance"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-indigo-50/60 p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-100"
                >
                  <UserCheck size={24} className="text-indigo-600" />

                  <span className="text-xs font-semibold">
                    Attendance
                  </span>
                </Link>

                <Link
                  to="/admin/examinations"
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-indigo-50/60 p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-100"
                >
                  <FileText size={24} className="text-indigo-600" />

                  <span className="text-xs font-semibold">
                    Examinations
                  </span>
                </Link>

              </div>
            </div>

            {/* Academy Activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center gap-2">
                <Clock size={20} className="text-orange-500" />

                <h2 className="font-bold text-slate-900">
                  Academy Activity
                </h2>
              </div>

              <div className="space-y-4">

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                      <CalendarDays size={19} />
                    </div>

                    <span className="text-sm text-slate-600">
                      Today's Attendance
                    </span>
                  </div>

                  <span className="font-bold text-slate-900">
                    {data.today_attendance}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                      <ClipboardCheck size={19} />
                    </div>

                    <span className="text-sm text-slate-600">
                      Examinations
                    </span>
                  </div>

                  <span className="font-bold text-slate-900">
                    {data.total_examinations}
                  </span>

                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
                      <Layers size={19} />
                    </div>

                    <span className="text-sm text-slate-600">
                      Active Batches
                    </span>
                  </div>

                  <span className="font-bold text-slate-900">
                    {data.total_batches}
                  </span>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Developers Academy. All rights reserved.
        </footer>

      </main>
    </div>
  )
}