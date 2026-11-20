import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import {
  Search,
  RefreshCw,
  Users,
  Plus,
  Eye,
  X,
  Pencil,
  Trash2,
  GraduationCap,
  Mail,
  Phone,
  CalendarDays,
  Save,
  Briefcase,
  IndianRupee,
} from 'lucide-react'

import api from '../../services/api'

type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'

interface Teacher {
  id: number
  user: number
  username: string
  first_name: string
  last_name: string
  email: string
  employee_id: string
  qualification: string
  specialization: string
  experience_years: number
  joining_date: string
  salary: string
  status: TeacherStatus
  created_at: string
  updated_at: string
}

interface TeacherForm {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  employee_id: string
  qualification: string
  specialization: string
  experience_years: number
  joining_date: string
  salary: string
}

interface EditTeacherForm {
  employee_id: string
  qualification: string
  specialization: string
  experience_years: number
  joining_date: string
  salary: string
  status: TeacherStatus
}

interface ApiError {
  response?: {
    data?: Record<string, unknown>
  }
}

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const initialForm: TeacherForm = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  employee_id: '',
  qualification: 'OTHER',
  specialization: '',
  experience_years: 0,
  joining_date: today(),
  salary: '0',
}

const initialEditForm: EditTeacherForm = {
  employee_id: '',
  qualification: 'OTHER',
  specialization: '',
  experience_years: 0,
  joining_date: today(),
  salary: '0',
  status: 'ACTIVE',
}

const getErrorMessage = (err: unknown) => {
  const data = (err as ApiError).response?.data

  if (!data) {
    return 'Something went wrong. Please try again.'
  }

  return Object.entries(data)
    .map(([field, message]) => {
      const value = Array.isArray(message)
        ? message.join(', ')
        : typeof message === 'string'
          ? message
          : JSON.stringify(message)

      return `${field}: ${value}`
    })
    .join('\n')
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TeacherForm>(initialForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null)
  const [editForm, setEditForm] = useState<EditTeacherForm>(initialEditForm)
  const [editError, setEditError] = useState('')
  const [updating, setUpdating] = useState(false)

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // FETCH TEACHERS

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get<Teacher[]>('teachers/')
      setTeachers(response.data)
    } catch {
      setError('Unable to load teachers. Please check your login and backend server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTeachers()
  }, [fetchTeachers])

  // SEARCH

  const filteredTeachers = useMemo(() => {
    const value = search.toLowerCase().trim()

    return teachers.filter((teacher) =>
      [
        teacher.first_name,
        teacher.last_name,
        teacher.username,
        teacher.email,
        teacher.employee_id,
        teacher.specialization,
      ].some((field) => field?.toLowerCase().includes(value))
    )
  }, [teachers, search])

  // ADD TEACHER

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    setSuccess('')

    try {
      await api.post('teachers/create/', form)

      setSuccess('Teacher added successfully!')
      setShowForm(false)
      setForm(initialForm)

      await fetchTeachers()
    } catch (err: unknown) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // OPEN EDIT FORM

  const openEdit = (teacher: Teacher) => {
    setEditTeacher(teacher)

    setEditForm({
      employee_id: teacher.employee_id,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      experience_years: teacher.experience_years,
      joining_date: teacher.joining_date,
      salary: String(teacher.salary),
      status: teacher.status,
    })

    setEditError('')
    setSuccess('')
  }

  // UPDATE TEACHER

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editTeacher) return

    setUpdating(true)
    setEditError('')
    setSuccess('')

    try {
      await api.patch(`teachers/${editTeacher.id}/`, editForm)

      setSuccess('Teacher updated successfully!')
      setEditTeacher(null)

      await fetchTeachers()
    } catch (err: unknown) {
      setEditError(getErrorMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  // DELETE TEACHER

  const handleDelete = async (teacher: Teacher) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${teacher.first_name} ${teacher.last_name} (${teacher.employee_id})?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      await api.delete(`teachers/${teacher.id}/`)

      setSuccess('Teacher deleted successfully!')

      if (selectedTeacher?.id === teacher.id) {
        setSelectedTeacher(null)
      }

      await fetchTeachers()
    } catch (err: unknown) {
      setError(
        `Unable to delete teacher. The teacher may be assigned to courses or batches.\n${getErrorMessage(err)}`
      )
    }
  }

  const getStatusClass = (status: TeacherStatus) => {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-700'
    if (status === 'INACTIVE') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  const getQualificationLabel = (value: string) => {
    const labels: Record<string, string> = {
      PHD: 'PhD',
      MASTERS: "Master's",
      BACHELORS: "Bachelor's",
      DIPLOMA: 'Diploma',
      OTHER: 'Other',
    }

    return labels[value] || value
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Teachers Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage teacher profiles, qualifications and employment details.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => void fetchTeachers()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={() => {
              setForm(initialForm)
              setFormError('')
              setSuccess('')
              setShowForm(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Teacher
          </button>
        </div>
      </div>

      {/* MESSAGES */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Teachers</p>
            <Users className="text-indigo-600" size={22} />
          </div>
          <h2 className="mt-3 text-3xl font-bold text-slate-800">
            {teachers.length}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Active Teachers</p>
            <GraduationCap className="text-green-600" size={22} />
          </div>
          <h2 className="mt-3 text-3xl font-bold text-green-600">
            {teachers.filter((t) => t.status === 'ACTIVE').length}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Inactive Teachers</p>
            <Users className="text-red-500" size={22} />
          </div>
          <h2 className="mt-3 text-3xl font-bold text-red-500">
            {teachers.filter((t) => t.status === 'INACTIVE').length}
          </h2>
        </div>
      </div>

      {/* TEACHER TABLE */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="font-semibold text-slate-800">All Teachers</h2>
            <p className="mt-1 text-xs text-slate-500">
              Teacher employment records
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teachers..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading teachers...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No teachers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Teacher</th>
                  <th className="px-5 py-4">Employee ID</th>
                  <th className="px-5 py-4">Specialization</th>
                  <th className="px-5 py-4">Experience</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50">

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {teacher.first_name} {teacher.last_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {teacher.email}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {teacher.employee_id}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {teacher.specialization}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {teacher.experience_years} years
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(teacher.status)}`}>
                        {teacher.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          title="View Teacher"
                          onClick={() => setSelectedTeacher(teacher)}
                          className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          title="Edit Teacher"
                          onClick={() => openEdit(teacher)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          title="Delete Teacher"
                          onClick={() => void handleDelete(teacher)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t px-5 py-4 text-xs text-slate-500">
          Showing {filteredTeachers.length} of {teachers.length} teachers
        </div>
      </div>

      {/* ADD TEACHER MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Add New Teacher
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Create a teacher account and profile.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleAdd}>
              <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <h3 className="border-b pb-2 text-sm font-bold text-indigo-600">
                    Account Information
                  </h3>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Username *</label>
                  <input
                    required
                    maxLength={150}
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Password *</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">First Name *</label>
                  <input
                    required
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Last Name *</label>
                  <input
                    required
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <h3 className="border-b pb-2 text-sm font-bold text-indigo-600">
                    Professional Information
                  </h3>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Employee ID *</label>
                  <input
                    required
                    maxLength={30}
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    placeholder="DA-EMP-002"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Qualification *</label>
                  <select
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="OTHER">Other</option>
                    <option value="PHD">PhD</option>
                    <option value="MASTERS">Masters</option>
                    <option value="BACHELORS">Bachelors</option>
                    <option value="DIPLOMA">Diploma</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Specialization *</label>
                  <input
                    required
                    maxLength={150}
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="Python Development"
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Experience (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.experience_years}
                    onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={form.joining_date}
                    onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Monthly Salary *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                {formError && (
                  <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
                    {formError}
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-3 border-t bg-slate-50 p-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="rounded-lg border bg-white px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save size={17} />
                  {saving ? 'Saving...' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}

      {editTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Edit Teacher</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editTeacher.first_name} {editTeacher.last_name}
                </p>
              </div>
              <button
                onClick={() => setEditTeacher(null)}
                disabled={updating}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Employee ID *</label>
                  <input
                    required
                    value={editForm.employee_id}
                    onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Qualification *</label>
                  <select
                    value={editForm.qualification}
                    onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="OTHER">Other</option>
                    <option value="PHD">PhD</option>
                    <option value="MASTERS">Masters</option>
                    <option value="BACHELORS">Bachelors</option>
                    <option value="DIPLOMA">Diploma</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Specialization *</label>
                  <input
                    required
                    value={editForm.specialization}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Experience (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.experience_years}
                    onChange={(e) => setEditForm({ ...editForm, experience_years: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.joining_date}
                    onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Monthly Salary *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editForm.salary}
                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TeacherStatus })}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                {editError && (
                  <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
                    {editError}
                  </div>
                )}

              </div>

              <div className="flex justify-end gap-3 border-t bg-slate-50 p-5">
                <button
                  type="button"
                  onClick={() => setEditTeacher(null)}
                  disabled={updating}
                  className="rounded-lg border bg-white px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save size={17} />
                  {updating ? 'Updating...' : 'Update Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW TEACHER MODAL */}

      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Teacher Details</h2>
                <p className="mt-1 text-sm text-slate-500">Complete teacher profile</p>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedTeacher.first_name} {selectedTeacher.last_name}
                  </h3>
                  <p className="text-sm text-slate-500">@{selectedTeacher.username}</p>
                </div>
              </div>

              <div className="space-y-4">

                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium">{selectedTeacher.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Employee ID</p>
                    <p className="text-sm font-medium">{selectedTeacher.employee_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Qualification</p>
                    <p className="text-sm font-medium">
                      {getQualificationLabel(selectedTeacher.qualification)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Specialization</p>
                    <p className="text-sm font-medium">{selectedTeacher.specialization}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Experience</p>
                    <p className="text-sm font-medium">{selectedTeacher.experience_years} years</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Joining Date</p>
                    <p className="text-sm font-medium">{selectedTeacher.joining_date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <IndianRupee size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Monthly Salary</p>
                    <p className="text-sm font-medium">₹{Number(selectedTeacher.salary).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(selectedTeacher.status)}`}>
                      {selectedTeacher.status}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 border-t bg-slate-50 p-5">
              <button
                onClick={() => {
                  const teacher = selectedTeacher
                  setSelectedTeacher(null)
                  openEdit(teacher)
                }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Pencil size={16} />
                Edit Teacher
              </button>

              <button
                onClick={() => setSelectedTeacher(null)}
                className="rounded-lg border bg-white px-4 py-2.5 text-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}