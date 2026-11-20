import { useEffect, useState } from 'react'
import {
  BookOpen,
  Users,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Bell,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  GraduationCap,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

interface DashboardData {
  batches: any[]
  timetable: any[]
  attendance: any[]
  examinations: any[]
  notifications: any[]
}

function getList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function TeacherDashboard() {
  const { user, logout } = useAuth()

  const [data, setData] = useState<DashboardData>({
    batches: [],
    timetable: [],
    attendance: [],
    examinations: [],
    notifications: [],
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError('')

      const results = await Promise.allSettled([
        api.get('batches/'),
        api.get('timetable/'),
        api.get('attendance/'),
        api.get('examinations/'),
        api.get('notifications/'),
      ])

      const [
        batchesResult,
        timetableResult,
        attendanceResult,
        examinationsResult,
        notificationsResult,
      ] = results

      setData({
        batches:
          batchesResult.status === 'fulfilled'
            ? getList(batchesResult.value.data)
            : [],

        timetable:
          timetableResult.status === 'fulfilled'
            ? getList(timetableResult.value.data)
            : [],

        attendance:
          attendanceResult.status === 'fulfilled'
            ? getList(attendanceResult.value.data)
            : [],

        examinations:
          examinationsResult.status === 'fulfilled'
            ? getList(examinationsResult.value.data)
            : [],

        notifications:
          notificationsResult.status === 'fulfilled'
            ? getList(notificationsResult.value.data)
            : [],
      })

      if (results.every((result) => result.status === 'rejected')) {
        setError('Unable to load dashboard data. Please check your connection.')
      }
    } catch {
      setError('Something went wrong while loading dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const unreadNotifications = data.notifications.filter(
    (item) => !item.is_read
  ).length

  const presentCount = data.attendance.filter(
    (item) => item.status === 'PRESENT'
  ).length

  const today = new Date().toISOString().split('T')[0]

  const upcomingExaminations = data.examinations
    .filter((exam) => exam.exam_date && exam.exam_date >= today)
    .sort(
      (a, b) =>
        new Date(a.exam_date).getTime() -
        new Date(b.exam_date).getTime()
    )
    .slice(0, 5)

  const recentNotifications = [...data.notifications]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  const upcomingTimetable = [...data.timetable]
    .filter((item) => item.status !== 'CANCELLED')
    .slice(0, 5)

  const stats = [
    {
      title: 'My Batches',
      value: data.batches.length,
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Timetable Entries',
      value: data.timetable.length,
      icon: CalendarDays,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Attendance Records',
      value: data.attendance.length,
      icon: ClipboardCheck,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Examinations',
      value: data.examinations.length,
      icon: FileText,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Present Records',
      value: presentCount,
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Unread Notifications',
      value: unreadNotifications,
      icon: Bell,
      color: 'bg-red-100 text-red-600',
    },
  ]

  const formatDate = (date: string) => {
    if (!date) return 'Date unavailable'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const displayName =
    user?.first_name || user?.username || 'Teacher'

  return (
    <div className="min-h-screen bg-slate-100 p-5 md:p-8">

      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">

          <div className="flex items-center gap-4">

            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
              <GraduationCap size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Teacher Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Welcome back, {displayName}!
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Developers Academy
              </p>
            </div>

          </div>

          <div className="flex gap-2">

            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              <LogOut size={17} />
              Logout
            </button>

          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Statistics */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            Dashboard Overview
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {stats.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {item.title}
                      </p>

                      <h3 className="mt-2 text-3xl font-bold text-slate-800">
                        {loading ? '...' : item.value}
                      </h3>
                    </div>

                    <div className={`rounded-xl p-3 ${item.color}`}>
                      <Icon size={25} />
                    </div>

                  </div>

                </div>
              )
            })}

          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* My Batches */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={21} />
                <h2 className="font-bold text-slate-800">
                  My Batches
                </h2>
              </div>

              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {data.batches.length} Total
              </span>
            </div>

            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">
                Loading batches...
              </p>
            ) : data.batches.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                No assigned batches found.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">

                {data.batches.slice(0, 5).map((batch) => (
                  <div key={batch.id} className="p-5">

                    <div className="flex items-center justify-between gap-3">

                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {batch.batch_name || batch.name || `Batch #${batch.id}`}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {batch.batch_code || 'Batch'}
                        </p>
                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        {batch.status || 'Assigned'}
                      </span>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* Timetable */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-purple-600" size={21} />
                <h2 className="font-bold text-slate-800">
                  My Timetable
                </h2>
              </div>
            </div>

            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">
                Loading timetable...
              </p>
            ) : upcomingTimetable.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                No timetable entries found.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">

                {upcomingTimetable.map((item) => (
                  <div key={item.id} className="p-5">

                    <div className="flex items-start gap-3">

                      <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                        <Clock size={19} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <h3 className="font-semibold text-slate-800">
                          {item.subject || 'Lecture'}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.batch_name || 'Batch'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.day_of_week || ''}
                          {item.start_time && ` • ${item.start_time}`}
                          {item.end_time && ` - ${item.end_time}`}
                        </p>

                        {item.classroom && (
                          <p className="mt-1 text-xs text-slate-400">
                            Room: {item.classroom}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* Upcoming Examinations */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-2">
                <FileText className="text-orange-600" size={21} />
                <h2 className="font-bold text-slate-800">
                  Upcoming Examinations
                </h2>
              </div>
            </div>

            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">
                Loading examinations...
              </p>
            ) : upcomingExaminations.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                No upcoming examinations.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">

                {upcomingExaminations.map((exam) => (
                  <div key={exam.id} className="p-5">

                    <h3 className="font-semibold text-slate-800">
                      {exam.exam_name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>
                        Date: {formatDate(exam.exam_date)}
                      </span>

                      <span>
                        Total Marks: {exam.total_marks ?? '-'}
                      </span>
                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* Notifications */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div className="flex items-center gap-2">
                <Bell className="text-red-500" size={21} />
                <h2 className="font-bold text-slate-800">
                  Recent Notifications
                </h2>
              </div>

              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {unreadNotifications} Unread
              </span>

            </div>

            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">
                Loading notifications...
              </p>
            ) : recentNotifications.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                No notifications available.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">

                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="p-5">

                    <div className="flex items-start gap-3">

                      <div className="rounded-lg bg-red-50 p-2 text-red-500">
                        <Bell size={18} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-semibold text-slate-800">
                            {notification.title}
                          </h3>

                          {!notification.is_read && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                              New
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatDate(notification.created_at)}
                        </p>

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="rounded-xl bg-indigo-600 p-5 text-white">

          <div className="flex items-center gap-3">
            <Users size={25} />

            <div>
              <h3 className="font-semibold">
                Welcome to Developers Academy
              </h3>

              <p className="mt-1 text-sm text-indigo-100">
                Manage your batches, attendance, examinations and academic activities.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

export default TeacherDashboard