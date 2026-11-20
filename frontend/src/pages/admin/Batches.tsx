import { useEffect, useMemo, useState } from 'react'
import {
  Search, RefreshCw, Plus, Eye, Pencil, Trash2,
  X, Save, Layers, GraduationCap, CalendarDays,
} from 'lucide-react'
import api from '../../services/api'

interface Course {
  id: number
  course_name: string
  course_code: string
}

interface Teacher {
  id: number
  first_name: string
  last_name: string
  employee_id: string
}

interface Batch {
  id: number
  batch_name: string
  batch_code: string
  course: number
  course_name: string
  teacher: number | null
  teacher_name: string
  start_date: string
  end_date: string
  max_students: number
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  created_at: string
  updated_at: string
}

interface BatchForm {
  batch_name: string
  batch_code: string
  course: string
  teacher: string
  start_date: string
  end_date: string
  max_students: string
  status: Batch['status']
}

const initialForm: BatchForm = {
  batch_name: '',
  batch_code: '',
  course: '',
  teacher: '',
  start_date: '',
  end_date: '',
  max_students: '30',
  status: 'UPCOMING',
}

function Batches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [showForm, setShowForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)

  const [form, setForm] = useState<BatchForm>(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [batchResponse, courseResponse, teacherResponse] =
        await Promise.all([
          api.get<Batch[]>('batches/'),
          api.get<Course[]>('courses/'),
          api.get<Teacher[]>('teachers/'),
        ])

      setBatches(batchResponse.data)
      setCourses(courseResponse.data)
      setTeachers(teacherResponse.data)
    } catch (err: any) {
      console.error('Batch fetch error:', err)
      setError('Unable to load batches. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const text = search.toLowerCase()

      const matchesSearch =
        batch.batch_name.toLowerCase().includes(text) ||
        batch.batch_code.toLowerCase().includes(text) ||
        (batch.course_name || '').toLowerCase().includes(text) ||
        (batch.teacher_name || '').toLowerCase().includes(text)

      const matchesStatus =
        statusFilter === 'ALL' || batch.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [batches, search, statusFilter])

  const upcomingCount = batches.filter(
    (batch) => batch.status === 'UPCOMING'
  ).length

  const ongoingCount = batches.filter(
    (batch) => batch.status === 'ONGOING'
  ).length

  const completedCount = batches.filter(
    (batch) => batch.status === 'COMPLETED'
  ).length

  const openAddForm = () => {
    setEditingBatch(null)
    setForm(initialForm)
    setError('')
    setShowForm(true)
  }

  const openEditForm = (batch: Batch) => {
    setEditingBatch(batch)

    setForm({
      batch_name: batch.batch_name,
      batch_code: batch.batch_code,
      course: String(batch.course),
      teacher: batch.teacher ? String(batch.teacher) : '',
      start_date: batch.start_date,
      end_date: batch.end_date,
      max_students: String(batch.max_students),
      status: batch.status,
    })

    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingBatch(null)
    setForm(initialForm)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      batch_name: form.batch_name.trim(),
      batch_code: form.batch_code.trim().toUpperCase(),
      course: Number(form.course),
      teacher: form.teacher ? Number(form.teacher) : null,
      start_date: form.start_date,
      end_date: form.end_date,
      max_students: Number(form.max_students),
      status: form.status,
    }

    try {
      if (editingBatch) {
        await api.patch(`batches/${editingBatch.id}/`, payload)
        setSuccess('Batch updated successfully.')
      } else {
        await api.post('batches/create/', payload)
        setSuccess('Batch created successfully.')
      }

      closeForm()
      await fetchData()
    } catch (err: any) {
      console.error('Batch save error:', err)

      const data = err.response?.data

      if (data && typeof data === 'object') {
        setError(
          Object.entries(data)
            .map(([field, value]) => {
              const message = Array.isArray(value)
                ? value.join(', ')
                : String(value)
              return `${field}: ${message}`
            })
            .join('\n')
        )
      } else {
        setError('Unable to save batch. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (batch: Batch) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${batch.batch_name}"?`
    )

    if (!confirmed) return

    try {
      await api.delete(`batches/${batch.id}/`)
      setBatches((previous) =>
        previous.filter((item) => item.id !== batch.id)
      )

      if (selectedBatch?.id === batch.id) {
        setSelectedBatch(null)
      }

      setSuccess('Batch deleted successfully.')
      setError('')
    } catch (err: any) {
      console.error('Batch delete error:', err)
      setError(
        err.response?.data?.detail ||
        'Unable to delete batch. It may have existing enrollments or records.'
      )
    }
  }

  const statusStyle = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-amber-100 text-amber-700'
      case 'ONGOING':
        return 'bg-emerald-100 text-emerald-700'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Batches Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage academy batches, courses and assigned teachers.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Batch
          </button>
        </div>
      </div>

      {error && !showForm && (
        <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[
          {
            label: 'Total Batches',
            value: batches.length,
            icon: <Layers size={23} />,
            style: 'bg-indigo-100 text-indigo-600',
          },
          {
            label: 'Upcoming Batches',
            value: upcomingCount,
            icon: <CalendarDays size={23} />,
            style: 'bg-amber-100 text-amber-600',
          },
          {
            label: 'Ongoing Batches',
            value: ongoingCount,
            icon: <GraduationCap size={23} />,
            style: 'bg-emerald-100 text-emerald-600',
          },
          {
            label: 'Completed Batches',
            value: completedCount,
            icon: <Layers size={23} />,
            style: 'bg-blue-100 text-blue-600',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                  {item.value}
                </h2>
              </div>
              <div className={`rounded-lg p-3 ${item.style}`}>
                {item.icon}
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search batch, code, course or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Status</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">All Batches</h2>
          <span className="text-sm text-slate-500">
            {filteredBatches.length} batches found
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading batches...
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-10 text-center">
            <Layers size={38} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              No batches found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add a new batch or change your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Teacher</th>
                  <th className="px-5 py-4">Start Date</th>
                  <th className="px-5 py-4">End Date</th>
                  <th className="px-5 py-4">Capacity</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {batch.batch_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {batch.batch_code}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.course_name}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.teacher_name || 'Not Assigned'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.start_date}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.end_date}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.max_students} Students
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedBatch(batch)}
                          title="View Batch"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => openEditForm(batch)}
                          title="Edit Batch"
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(batch)}
                          title="Delete Batch"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingBatch ? 'Edit Batch' : 'Add New Batch'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter batch information below.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">

              {error && (
                <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Batch Name *
                  </label>
                  <input
                    required
                    maxLength={150}
                    value={form.batch_name}
                    onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
                    placeholder="Python Morning Batch"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Batch Code *
                  </label>
                  <input
                    required
                    maxLength={30}
                    value={form.batch_code}
                    onChange={(e) => setForm({ ...form, batch_code: e.target.value.toUpperCase() })}
                    placeholder="DA-PY-B01"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Select Course *
                  </label>
                  <select
                    required
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_name} ({course.course_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Assign Teacher
                  </label>
                  <select
                    value={form.teacher}
                    onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Not Assigned</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} ({teacher.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Start Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    End Date *
                  </label>
                  <input
                    required
                    type="date"
                    min={form.start_date || undefined}
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Maximum Students *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.max_students}
                    onChange={(e) => setForm({ ...form, max_students: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Batch Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Batch['status'] })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || courses.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? 'Saving...' : editingBatch ? 'Update Batch' : 'Create Batch'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                Batch Details
              </h2>
              <button
                onClick={() => setSelectedBatch(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <h3 className="text-xl font-bold text-indigo-700">
                  {selectedBatch.batch_name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedBatch.batch_code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Course</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedBatch.course_name}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Teacher</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedBatch.teacher_name || 'Not Assigned'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Start Date</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedBatch.start_date}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">End Date</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedBatch.end_date}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Maximum Students
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedBatch.max_students}
                </span>
              </div>

              <div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedBatch.status)}`}>
                  {selectedBatch.status}
                </span>
              </div>

              <button
                onClick={() => {
                  const batch = selectedBatch
                  setSelectedBatch(null)
                  openEditForm(batch)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Pencil size={16} />
                Edit Batch
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Batches