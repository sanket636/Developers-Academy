import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  IndianRupee,
  Bell,
  GraduationCap,
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

interface DashboardData {
  batches: any[]
  timetable: any[]
  attendance: any[]
  examinations: any[]
  results: any[]
  invoices: any[]
  notifications: any[]
}

const initialData: DashboardData = {
  batches: [],
  timetable: [],
  attendance: [],
  examinations: [],
  results: [],
  invoices: [],
  notifications: [],
}

function getList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function formatDate(value?: string) {
  if (!value) return 'Date not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value?: string) {
  if (!value) return '--'

  return value.slice(0, 5)
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string
  value: string | number
  icon: any
  color: string
  subtitle?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            {value}
          </h2>
          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className={`rounded-xl p-4 ${color}`}>
          <Icon size={25} />
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
  count,
}: {
  title: string
  icon: any
  children: React.ReactNode
  count?: number
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h2 className="flex items-center gap-3 text-lg font-bold text-slate-800">
          <Icon size={21} className="text-indigo-600" />
          {title}
        </h2>

        {count !== undefined && (
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            {count} Total
          </span>
        )}
      </div>

      <div className="p-6">{children}</div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-sm text-slate-400">
      {message}
    </div>
  )
}

export default function StudentDashboard() {
  const { user, logout } = useAuth()

  const [data, setData] = useState<DashboardData>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    const endpoints = [
      'batches/',
      'timetable/',
      'attendance/',
      'examinations/',
      'examinations/results/',
      'fees/invoices/',
      'notifications/',
    ]

    const responses = await Promise.allSettled(
      endpoints.map((endpoint) => api.get(endpoint)),
    )

    const values = responses.map((response) =>
      response.status === 'fulfilled'
        ? getList(response.value.data)
        : [],
    )

    setData({
      batches: values[0],
      timetable: values[1],
      attendance: values[2],
      examinations: values[3],
      results: values[4],
      invoices: values[5],
      notifications: values[6],
    })

    const failed = responses.filter(
      (response) => response.status === 'rejected',
    ).length

    if (failed === endpoints.length) {
      setError('Unable to load dashboard data. Please check your connection.')
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const presentCount = data.attendance.filter(
    (item) => item.status === 'PRESENT',
  ).length

  const attendancePercentage =
    data.attendance.length > 0
      ? Math.round((presentCount / data.attendance.length) * 100)
      : 0

  const unreadNotifications = data.notifications.filter(
    (item) => !item.is_read,
  ).length

  const totalFees = data.invoices.reduce(
    (sum, item) =>
      sum + Number(item.final_fee ?? item.total_fee ?? 0),
    0,
  )

  const paidFees = data.invoices.reduce(
    (sum, item) => sum + Number(item.paid_amount ?? 0),
    0,
  )

  const pendingFees = data.invoices.reduce(
    (sum, item) =>
      sum + Number(item.balance_amount ?? 0),
    0,
  )

  return (
    <div className="min-h-screen bg-slate-100 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-indigo-100 p-4 text-indigo-600">
              <GraduationCap size={35} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Student Dashboard
              </h1>

              <p className="mt-1 text-slate-500">
                Welcome back, {user?.first_name || user?.username}!
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Developers Academy
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading student dashboard...
          </div>
        )}

        {!loading && (
          <>
            {/* Statistics */}
            <div className="mt-8">
              <h2 className="mb-5 text-xl font-bold text-slate-800">
                Dashboard Overview
              </h2>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  title="My Batches"
                  value={data.batches.length}
                  icon={BookOpen}
                  color="bg-blue-100 text-blue-600"
                />

                <StatCard
                  title="Attendance Records"
                  value={data.attendance.length}
                  icon={ClipboardCheck}
                  color="bg-green-100 text-green-600"
                />

                <StatCard
                  title="Attendance Percentage"
                  value={`${attendancePercentage}%`}
                  icon={CheckCircle}
                  color="bg-emerald-100 text-emerald-600"
                />

                <StatCard
                  title="Examinations"
                  value={data.examinations.length}
                  icon={FileText}
                  color="bg-orange-100 text-orange-600"
                />

                <StatCard
                  title="My Results"
                  value={data.results.length}
                  icon={Award}
                  color="bg-purple-100 text-purple-600"
                />

                <StatCard
                  title="Unread Notifications"
                  value={unreadNotifications}
                  icon={Bell}
                  color="bg-red-100 text-red-600"
                />
              </div>
            </div>

            {/* Fees Overview */}
            <div className="mt-8">
              <h2 className="mb-5 text-xl font-bold text-slate-800">
                Fees Overview
              </h2>

              <div className="grid gap-5 sm:grid-cols-3">
                <StatCard
                  title="Total Fees"
                  value={`₹${totalFees.toLocaleString('en-IN')}`}
                  icon={IndianRupee}
                  color="bg-blue-100 text-blue-600"
                />

                <StatCard
                  title="Paid Fees"
                  value={`₹${paidFees.toLocaleString('en-IN')}`}
                  icon={CheckCircle}
                  color="bg-green-100 text-green-600"
                />

                <StatCard
                  title="Pending Fees"
                  value={`₹${pendingFees.toLocaleString('en-IN')}`}
                  icon={AlertCircle}
                  color="bg-orange-100 text-orange-600"
                />
              </div>
            </div>

            {/* My Courses / Batches */}
            <div className="mt-8">
              <SectionCard
                title="My Courses & Batches"
                icon={BookOpen}
                count={data.batches.length}
              >
                {data.batches.length === 0 ? (
                  <EmptyState message="No enrolled batches found." />
                ) : (
                  <div className="space-y-4">
                    {data.batches.map((batch, index) => (
                      <div
                        key={batch.id ?? index}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {batch.batch_name || 'Batch'}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {batch.course_name || 'Course information unavailable'}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Batch Code: {batch.batch_code || '--'}
                            </p>
                          </div>

                          <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {batch.status || 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Timetable */}
            <div className="mt-6">
              <SectionCard
                title="My Timetable"
                icon={CalendarDays}
                count={data.timetable.length}
              >
                {data.timetable.length === 0 ? (
                  <EmptyState message="No timetable entries available." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-500">
                          <th className="p-3">Day</th>
                          <th className="p-3">Subject</th>
                          <th className="p-3">Teacher</th>
                          <th className="p-3">Time</th>
                          <th className="p-3">Classroom</th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.timetable.map((item, index) => (
                          <tr
                            key={item.id ?? index}
                            className="border-b last:border-0"
                          >
                            <td className="p-3 font-medium text-slate-700">
                              {item.day_of_week || '--'}
                            </td>
                            <td className="p-3">
                              {item.subject || item.course_name || '--'}
                            </td>
                            <td className="p-3">
                              {item.teacher_name || '--'}
                            </td>
                            <td className="p-3">
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatTime(item.start_time)} - {formatTime(item.end_time)}
                              </span>
                            </td>
                            <td className="p-3">
                              {item.classroom || '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Examination Results */}
            <div className="mt-6">
              <SectionCard
                title="My Examination Results"
                icon={Award}
                count={data.results.length}
              >
                {data.results.length === 0 ? (
                  <EmptyState message="No examination results available." />
                ) : (
                  <div className="space-y-3">
                    {data.results.map((result, index) => (
                      <div
                        key={result.id ?? index}
                        className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {result.exam_name ||
                              result.examination_name ||
                              result.examination ||
                              'Examination'}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Date: {formatDate(result.exam_date)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                            Marks: {result.marks_obtained ?? '--'} / {result.total_marks ?? '--'}
                          </span>

                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Grade: {result.grade || '--'}
                          </span>

                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            result.is_passed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {result.is_passed === true
                              ? 'PASS'
                              : result.is_passed === false
                                ? 'FAIL'
                                : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Fee Invoices */}
            <div className="mt-6">
              <SectionCard
                title="My Fee Invoices"
                icon={IndianRupee}
                count={data.invoices.length}
              >
                {data.invoices.length === 0 ? (
                  <EmptyState message="No fee invoices available." />
                ) : (
                  <div className="space-y-3">
                    {data.invoices.map((invoice, index) => (
                      <div
                        key={invoice.id ?? index}
                        className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {invoice.batch_name || 'Course Fee'}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Due Date: {formatDate(invoice.due_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">
                            Total: ₹{Number(invoice.final_fee ?? invoice.total_fee ?? 0).toLocaleString('en-IN')}
                          </p>

                          <p className="mt-1 text-sm text-green-600">
                            Paid: ₹{Number(invoice.paid_amount ?? 0).toLocaleString('en-IN')}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-orange-600">
                            Balance: ₹{Number(invoice.balance_amount ?? 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {invoice.status || 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Examinations */}
            <div className="mt-6">
              <SectionCard
                title="Upcoming Examinations"
                icon={FileText}
                count={data.examinations.length}
              >
                {data.examinations.length === 0 ? (
                  <EmptyState message="No examinations available." />
                ) : (
                  <div className="space-y-3">
                    {data.examinations.map((exam, index) => (
                      <div
                        key={exam.id ?? index}
                        className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {exam.exam_name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Exam Code: {exam.exam_code || '--'}
                          </p>
                        </div>

                        <div className="text-sm text-slate-600">
                          <p>Date: {formatDate(exam.exam_date)}</p>
                          <p className="mt-1">
                            Total Marks: {exam.total_marks ?? '--'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Notifications */}
            <div className="mt-6">
              <SectionCard
                title="Recent Notifications"
                icon={Bell}
                count={data.notifications.length}
              >
                {data.notifications.length === 0 ? (
                  <EmptyState message="No notifications available." />
                ) : (
                  <div className="space-y-3">
                    {data.notifications.map((notification, index) => (
                      <div
                        key={notification.id ?? index}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {notification.title}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              {notification.message}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>

                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                            notification.is_read
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {notification.is_read ? 'Read' : 'New'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}