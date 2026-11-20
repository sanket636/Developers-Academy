import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Plus,
  Search,
  RefreshCw,
  CheckCheck,
  Trash2,
  X,
  Send,
  AlertCircle,
} from 'lucide-react'
import api from '../../services/api'

interface Notification {
  id: number
  recipient: number
  recipient_name?: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}

const notificationTypes = [
  'GENERAL',
  'ANNOUNCEMENT',
  'ATTENDANCE',
  'EXAMINATION',
  'FEES',
  'TIMETABLE',
  'SYSTEM',
]

const emptyForm = {
  recipient: '',
  title: '',
  message: '',
  notification_type: 'GENERAL',
}

function getErrorMessage(error: any) {
  const data = error?.response?.data

  if (typeof data === 'string') return data
  if (data?.detail) return data.detail
  if (data?.non_field_errors) return data.non_field_errors.join(', ')

  return 'Something went wrong. Please try again.'
}

function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('notifications/')
      const data = response.data

      setNotifications(
        Array.isArray(data) ? data : data.results || []
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(search.toLowerCase()) ||
        notification.message.toLowerCase().includes(search.toLowerCase()) ||
        (notification.recipient_name || '')
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'READ' && notification.is_read) ||
        (filter === 'UNREAD' && !notification.is_read)

      return matchesSearch && matchesFilter
    })
  }, [notifications, search, filter])

  const totalNotifications = notifications.length
  const unreadNotifications = notifications.filter(
    (item) => !item.is_read
  ).length
  const readNotifications = notifications.filter(
    (item) => item.is_read
  ).length

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')

      await api.post('notifications/create/', {
        recipient: Number(form.recipient),
        title: form.title.trim(),
        message: form.message.trim(),
        notification_type: form.notification_type,
      })

      setForm(emptyForm)
      setShowForm(false)
      await fetchNotifications()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`notifications/${id}/read/`)
      await fetchNotifications()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const deleteNotification = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return
    }

    try {
      await api.delete(`notifications/${id}/`)
      await fetchNotifications()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeStyle = (type: string) => {
    const styles: Record<string, string> = {
      GENERAL: 'bg-blue-100 text-blue-700',
      ANNOUNCEMENT: 'bg-purple-100 text-purple-700',
      ATTENDANCE: 'bg-green-100 text-green-700',
      EXAMINATION: 'bg-orange-100 text-orange-700',
      FEES: 'bg-yellow-100 text-yellow-700',
      TIMETABLE: 'bg-indigo-100 text-indigo-700',
      SYSTEM: 'bg-gray-100 text-gray-700',
    }

    return styles[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Notifications Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage academy announcements and student notifications.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={() => {
              setError('')
              setShowForm(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Send Notification
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Notifications</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {totalNotifications}
              </h2>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Bell size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unread</p>
              <h2 className="mt-2 text-3xl font-bold text-orange-600">
                {unreadNotifications}
              </h2>
            </div>
            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
              <Bell size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Read</p>
              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {readNotifications}
              </h2>
            </div>
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <CheckCheck size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">

        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">All Notifications</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
        </select>

      </div>

      {/* Notifications List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-800">
            Notification History
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={38} className="mx-auto text-gray-300" />
            <h3 className="mt-3 font-semibold text-gray-700">
              No Notifications Found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">

            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between ${
                  !notification.is_read ? 'bg-blue-50/40' : ''
                }`}
              >

                <div className="flex min-w-0 flex-1 gap-3">

                  <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-600">
                    <Bell size={19} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-800">
                        {notification.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getTypeStyle(
                          notification.notification_type
                        )}`}
                      >
                        {notification.notification_type}
                      </span>

                      {!notification.is_read && (
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                          Unread
                        </span>
                      )}
                    </div>

                    <p className="mt-2 break-words text-sm text-gray-600">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
                      <span>
                        Recipient:{' '}
                        {notification.recipient_name ||
                          `User #${notification.recipient}`}
                      </span>

                      <span>
                        {formatDate(notification.created_at)}
                      </span>
                    </div>

                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">

                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                      className="rounded-lg border border-green-200 p-2 text-green-600 hover:bg-green-50"
                    >
                      <CheckCheck size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete notification"
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Send Notification
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Create a notification for a user.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 p-5">

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Recipient User ID *
                </label>

                <input
                  type="number"
                  min="1"
                  required
                  value={form.recipient}
                  onChange={(e) =>
                    setForm({ ...form, recipient: e.target.value })
                  }
                  placeholder="Enter Student or Teacher User ID"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Enter the account User ID, not the Student or Teacher record ID.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notification Type *
                </label>

                <select
                  value={form.notification_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notification_type: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title *
                </label>

                <input
                  type="text"
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="Enter notification title"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Message *
                </label>

                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Write your notification message..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} />
                  {saving ? 'Sending...' : 'Send Notification'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Notifications