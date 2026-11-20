import { useEffect, useMemo, useState } from 'react'
import {
  Search, RefreshCw, Plus, Eye, Pencil, Trash2,
  X, Save, Users, GraduationCap, CalendarDays,
} from 'lucide-react'
import api from '../../services/api'

interface Student {
  id: number
  username: string
  first_name: string
  last_name: string
  admission_number: string
}

interface Batch {
  id: number
  batch_name: string
  batch_code: string
  status: string
}

interface Enrollment {
  id: number
  student: number
  student_name: string
  admission_number: string
  batch: number
  batch_name: string
  enrollment_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
  created_at: string
  updated_at: string
}

interface EnrollmentForm {
  student: string
  batch: string
  enrollment_date: string
  status: Enrollment['status']
}

const initialForm: EnrollmentForm = {
  student: '',
  batch: '',
  enrollment_date: new Date().toISOString().slice(0, 10),
  status: 'ACTIVE',
}

function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [showForm, setShowForm] = useState(false)
  const [editingEnrollment, setEditingEnrollment] =
    useState<Enrollment | null>(null)
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null)

  const [form, setForm] = useState<EnrollmentForm>(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [enrollmentResponse, studentResponse, batchResponse] =
        await Promise.all([
          api.get<Enrollment[]>('batches/enrollments/'),
          api.get<Student[]>('students/'),
          api.get<Batch[]>('batches/'),
        ])

      setEnrollments(enrollmentResponse.data)
      setStudents(studentResponse.data)
      setBatches(batchResponse.data)
    } catch (err: any) {
      console.error('Enrollment fetch error:', err)
      setError('Unable to load enrollment data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((item) => {
      const text = search.toLowerCase()

      const matchesSearch =
        (item.student_name || '').toLowerCase().includes(text) ||
        (item.admission_number || '').toLowerCase().includes(text) ||
        (item.batch_name || '').toLowerCase().includes(text)

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [enrollments, search, statusFilter])

  const activeCount = enrollments.filter(
    (item) => item.status === 'ACTIVE'
  ).length

  const completedCount = enrollments.filter(
    (item) => item.status === 'COMPLETED'
  ).length

  const droppedCount = enrollments.filter(
    (item) => item.status === 'DROPPED'
  ).length

  const openAddForm = () => {
    setEditingEnrollment(null)
    setForm(initialForm)
    setError('')
    setShowForm(true)
  }

  const openEditForm = (item: Enrollment) => {
    setEditingEnrollment(item)

    setForm({
      student: String(item.student),
      batch: String(item.batch),
      enrollment_date: item.enrollment_date,
      status: item.status,
    })

    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingEnrollment(null)
    setForm(initialForm)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      student: Number(form.student),
      batch: Number(form.batch),
      enrollment_date: form.enrollment_date,
      status: form.status,
    }

    try {
      if (editingEnrollment) {
        await api.patch(
          `batches/enrollments/${editingEnrollment.id}/`,
          payload
        )
        setSuccess('Enrollment updated successfully.')
      } else {
        await api.post('batches/enrollments/create/', payload)
        setSuccess('Student enrolled successfully.')
      }

      closeForm()
      await fetchData()
    } catch (err: any) {
      console.error('Enrollment save error:', err)

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
        setError('Unable to save enrollment. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: Enrollment) => {
    const confirmed = window.confirm(
      `Remove ${item.student_name} from ${item.batch_name}?`
    )

    if (!confirmed) return

    try {
      await api.delete(`batches/enrollments/${item.id}/`)

      setEnrollments((previous) =>
        previous.filter((enrollment) => enrollment.id !== item.id)
      )

      if (selectedEnrollment?.id === item.id) {
        setSelectedEnrollment(null)
      }

      setSuccess('Enrollment deleted successfully.')
      setError('')
    } catch (err: any) {
      console.error('Enrollment delete error:', err)
      setError(
        err.response?.data?.detail ||
        'Unable to delete enrollment. Check related records and permissions.'
      )
    }
  }

  const statusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700'
      case 'DROPPED':
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
            Student Enrollment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage student admissions into academy batches.
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
            Enroll Student
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
            label: 'Total Enrollments',
            value: enrollments.length,
            icon: <Users size={23} />,
            style: 'bg-indigo-100 text-indigo-600',
          },
          {
            label: 'Active Enrollments',
            value: activeCount,
            icon: <GraduationCap size={23} />,
            style: 'bg-emerald-100 text-emerald-600',
          },
          {
            label: 'Completed',
            value: completedCount,
            icon: <CalendarDays size={23} />,
            style: 'bg-blue-100 text-blue-600',
          },
          {
            label: 'Dropped',
            value: droppedCount,
            icon: <Users size={23} />,
            style: 'bg-red-100 text-red-600',
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

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search student, admission number or batch..."
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
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="DROPPED">Dropped</option>
        </select>
      </div>

      {/* Enrollment Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            All Enrollments
          </h2>
          <span className="text-sm text-slate-500">
            {filteredEnrollments.length} records found
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading enrollments...
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={38} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              No enrollments found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Enroll a student or change your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Admission No.</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Enrollment Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {item.student_name}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.admission_number}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.batch_name}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.enrollment_date}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedEnrollment(item)}
                          title="View Enrollment"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => openEditForm(item)}
                          title="Edit Enrollment"
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          title="Delete Enrollment"
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
          <div className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingEnrollment ? 'Edit Enrollment' : 'Enroll New Student'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select student and batch information.
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

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Select Student *
                </label>
                <select
                  required
                  value={form.student}
                  onChange={(e) => setForm({ ...form, student: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} - {student.admission_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Select Batch *
                </label>
                <select
                  required
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name} ({batch.batch_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Enrollment Date *
                </label>
                <input
                  required
                  type="date"
                  value={form.enrollment_date}
                  onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Enrollment Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Enrollment['status'] })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                </select>
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
                  disabled={saving || students.length === 0 || batches.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? 'Saving...' : editingEnrollment ? 'Update Enrollment' : 'Enroll Student'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                Enrollment Details
              </h2>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs uppercase text-slate-400">Student</p>
                <h3 className="mt-1 text-lg font-bold text-indigo-700">
                  {selectedEnrollment.student_name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedEnrollment.admission_number}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-400">Batch</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedEnrollment.batch_name}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-400">Enrollment Date</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedEnrollment.enrollment_date}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-400">Status</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedEnrollment.status)}`}>
                  {selectedEnrollment.status}
                </span>
              </div>

              <button
                onClick={() => {
                  const item = selectedEnrollment
                  setSelectedEnrollment(null)
                  openEditForm(item)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Pencil size={16} />
                Edit Enrollment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Enrollments