import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import {
  Search,
  RefreshCw,
  Users,
  Plus,
  Eye,
  X,
  UserPlus,
  Save,
  Pencil,
  Trash2,
  GraduationCap,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react'

import api from '../../services/api'

// ======================================
// TYPES
// ======================================

type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED'

interface Student {
  id: number
  user: number
  username: string
  first_name: string
  last_name: string
  email: string
  admission_number: string
  admission_date: string
  guardian_name: string
  guardian_phone: string
  emergency_contact: string
  status: StudentStatus
  created_at: string
  updated_at: string
}

interface StudentForm {
  username: string
  password: string
  first_name: string
  last_name: string
  email: string
  admission_number: string
  admission_date: string
  guardian_name: string
  guardian_phone: string
  emergency_contact: string
}

interface EditStudentForm {
  admission_number: string
  admission_date: string
  guardian_name: string
  guardian_phone: string
  emergency_contact: string
  status: StudentStatus
}

interface ApiError {
  response?: {
    data?: Record<string, unknown>
  }
}

// ======================================
// INITIAL FORM
// ======================================

const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const initialForm: StudentForm = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  admission_number: '',
  admission_date: getTodayDate(),
  guardian_name: '',
  guardian_phone: '',
  emergency_contact: '',
}

const initialEditForm: EditStudentForm = {
  admission_number: '',
  admission_date: '',
  guardian_name: '',
  guardian_phone: '',
  emergency_contact: '',
  status: 'ACTIVE',
}

// ======================================
// ERROR MESSAGE HELPER
// ======================================

const getApiErrorMessage = (err: unknown): string => {
  const error = err as ApiError
  const data = error.response?.data

  if (!data) {
    return 'Something went wrong. Please check your connection and try again.'
  }

  return Object.entries(data)
    .map(([field, message]) => {
      const text = Array.isArray(message)
        ? message.join(', ')
        : typeof message === 'string'
          ? message
          : JSON.stringify(message)

      return `${field}: ${text}`
    })
    .join('\n')
}

// ======================================
// MAIN COMPONENT
// ======================================

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Add student
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<StudentForm>(initialForm)
  const [formError, setFormError] = useState('')

  // Edit student
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editForm, setEditForm] =
    useState<EditStudentForm>(initialEditForm)
  const [updating, setUpdating] = useState(false)
  const [editError, setEditError] = useState('')

  // View details
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null)

  // Common messages
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ======================================
  // FETCH STUDENTS
  // ======================================

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get<Student[]>('students/')
      setStudents(response.data)
    } catch {
      setError(
        'Unable to load students. Please login again if your session expired.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStudents()
  }, [fetchStudents])

  // ======================================
  // SEARCH STUDENTS
  // ======================================

  const filteredStudents = useMemo(() => {
    const value = search.toLowerCase().trim()

    return students.filter((student) =>
      [
        student.first_name,
        student.last_name,
        student.username,
        student.email,
        student.admission_number,
      ].some((field) => field?.toLowerCase().includes(value))
    )
  }, [students, search])

  // ======================================
  // ADD FORM INPUT
  // ======================================

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // ======================================
  // CLOSE ADD FORM
  // ======================================

  const closeForm = () => {
    if (saving) return

    setShowForm(false)
    setForm(initialForm)
    setFormError('')
  }

  // ======================================
  // CREATE STUDENT
  // ======================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setSaving(true)
    setFormError('')
    setSuccess('')

    try {
      await api.post('students/create/', form)

      setSuccess('Student added successfully!')
      setShowForm(false)
      setForm(initialForm)

      await fetchStudents()
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // ======================================
  // VIEW STUDENT DETAILS
  // ======================================

  const viewStudent = (student: Student) => {
    setSelectedStudent(student)
  }

  // ======================================
  // OPEN EDIT FORM
  // ======================================

  const openEditForm = (student: Student) => {
    setEditStudent(student)

    setEditForm({
      admission_number: student.admission_number,
      admission_date: student.admission_date,
      guardian_name: student.guardian_name,
      guardian_phone: student.guardian_phone,
      emergency_contact: student.emergency_contact || '',
      status: student.status,
    })

    setEditError('')
    setSuccess('')
  }

  // ======================================
  // UPDATE STUDENT
  // ======================================

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!editStudent) return

    setUpdating(true)
    setEditError('')
    setSuccess('')

    try {
      await api.patch(
        `students/${editStudent.id}/`,
        editForm
      )

      setSuccess('Student updated successfully!')
      setEditStudent(null)

      await fetchStudents()
    } catch (err: unknown) {
      setEditError(getApiErrorMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  // ======================================
  // DELETE STUDENT
  // ======================================

  const handleDelete = async (student: Student) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.first_name} ${student.last_name}?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      await api.delete(`students/${student.id}/`)

      setSuccess('Student deleted successfully!')

      if (selectedStudent?.id === student.id) {
        setSelectedStudent(null)
      }

      await fetchStudents()
    } catch (err: unknown) {
      const message = getApiErrorMessage(err)

      setError(
        `Unable to delete student. The student may have related fee or academic records.\n${message}`
      )
    }
  }

  // ======================================
  // STATUS BADGE
  // ======================================

  const getStatusClass = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700'

      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-700'

      case 'GRADUATED':
        return 'bg-blue-100 text-blue-700'

      case 'SUSPENDED':
        return 'bg-red-100 text-red-700'

      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  // ======================================
  // PAGE UI
  // ======================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Students Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage student records and admission details.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={() => void fetchStudents()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Student
          </button>

        </div>
      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total Students
            </p>
            <Users className="text-indigo-600" size={22} />
          </div>

          <h2 className="mt-3 text-3xl font-bold text-slate-800">
            {students.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Active Students
            </p>
            <ShieldCheck className="text-green-600" size={22} />
          </div>

          <h2 className="mt-3 text-3xl font-bold text-green-600">
            {students.filter((s) => s.status === 'ACTIVE').length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Inactive Students
            </p>
            <Users className="text-red-500" size={22} />
          </div>

          <h2 className="mt-3 text-3xl font-bold text-red-500">
            {students.filter((s) => s.status === 'INACTIVE').length}
          </h2>
        </div>

      </div>

      {/* STUDENTS TABLE */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">

          <div>
            <h2 className="font-semibold text-slate-800">
              All Students
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Student admission records
            </p>
          </div>

          <div className="relative w-full sm:w-80">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

          </div>

        </div>

        {loading ? (

          <div className="p-10 text-center text-slate-500">
            Loading students...
          </div>

        ) : error && students.length === 0 ? (

          <div className="p-10 text-center text-red-500">
            {error}

            <button
              onClick={() => void fetchStudents()}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>

        ) : filteredStudents.length === 0 ? (

          <div className="p-10 text-center text-slate-500">
            No students found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Admission No.</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Admission Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredStudents.map((student) => (

                  <tr
                    key={student.id}
                    className="hover:bg-slate-50"
                  >

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {student.first_name} {student.last_name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        @{student.username}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {student.admission_number}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.email}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {student.admission_date}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(student.status)}`}
                      >
                        {student.status}
                      </span>
                    </td>

                    {/* ACTION BUTTONS */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">

                        <button
                          title="View Student"
                          onClick={() => viewStudent(student)}
                          className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          title="Edit Student"
                          onClick={() => openEditForm(student)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          title="Delete Student"
                          onClick={() => void handleDelete(student)}
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

        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
          Showing {filteredStudents.length} of {students.length} students
        </div>

      </div>

      {/* ======================================
          ADD STUDENT MODAL
      ====================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">

          <div className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
                  <UserPlus size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Add New Student
                  </h2>

                  <p className="text-xs text-slate-500">
                    Enter student admission information.
                  </p>
                </div>

              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>

            </div>

            {/* ADD FORM */}

            <form onSubmit={handleSubmit}>

              <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-indigo-600">
                    Account Information
                  </h3>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Username *
                  </label>

                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    required
                    maxLength={150}
                    autoComplete="username"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password *
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create password"
                    required
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    First Name *
                  </label>

                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    required
                    maxLength={150}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Last Name *
                  </label>

                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    required
                    maxLength={150}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email Address *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="student@example.com"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-indigo-600">
                    Admission Information
                  </h3>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Admission Number *
                  </label>

                  <input
                    name="admission_number"
                    value={form.admission_number}
                    onChange={handleChange}
                    placeholder="DA2026003"
                    required
                    maxLength={30}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Admission Date *
                  </label>

                  <input
                    type="date"
                    name="admission_date"
                    value={form.admission_date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-indigo-600">
                    Guardian Information
                  </h3>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Guardian Name *
                  </label>

                  <input
                    name="guardian_name"
                    value={form.guardian_name}
                    onChange={handleChange}
                    placeholder="Guardian full name"
                    required
                    maxLength={150}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Guardian Phone *
                  </label>

                  <input
                    type="tel"
                    name="guardian_phone"
                    value={form.guardian_phone}
                    onChange={handleChange}
                    placeholder="Guardian phone number"
                    required
                    maxLength={15}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Emergency Contact
                  </label>

                  <input
                    type="tel"
                    name="emergency_contact"
                    value={form.emergency_contact}
                    onChange={handleChange}
                    placeholder="Emergency contact number (optional)"
                    maxLength={15}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {formError && (
                  <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
                    {formError}
                  </div>
                )}

              </div>

              {/* FOOTER */}

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? 'Saving...' : 'Save Student'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================
          EDIT STUDENT MODAL
      ====================================== */}

      {editStudent && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">

          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 p-6">

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Edit Student
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update admission and guardian information.
                </p>
              </div>

              <button
                onClick={() => setEditStudent(null)}
                disabled={updating}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={21} />
              </button>

            </div>

            {/* EDIT FORM */}

            <form onSubmit={handleUpdate}>

              <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Admission Number *
                  </label>

                  <input
                    required
                    maxLength={30}
                    value={editForm.admission_number}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        admission_number: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Admission Date *
                  </label>

                  <input
                    type="date"
                    required
                    value={editForm.admission_date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        admission_date: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Guardian Name *
                  </label>

                  <input
                    required
                    maxLength={150}
                    value={editForm.guardian_name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        guardian_name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Guardian Phone *
                  </label>

                  <input
                    type="tel"
                    required
                    maxLength={15}
                    value={editForm.guardian_phone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        guardian_phone: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Emergency Contact
                  </label>

                  <input
                    type="tel"
                    maxLength={15}
                    value={editForm.emergency_contact}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        emergency_contact: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Student Status
                  </label>

                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as StudentStatus,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="GRADUATED">Graduated</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                {editError && (
                  <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
                    {editError}
                  </div>
                )}

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5">

                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  disabled={updating}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save size={17} />
                  {updating ? 'Updating...' : 'Update Student'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================
          VIEW STUDENT DETAILS MODAL
      ====================================== */}

      {selectedStudent && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">

          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b p-6">

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Student Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete student information
                </p>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
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
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    @{selectedStudent.username}
                  </p>
                </div>

              </div>

              <div className="space-y-4">

                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedStudent.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Admission Number</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedStudent.admission_number}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Admission Date</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedStudent.admission_date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Guardian Name</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedStudent.guardian_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Guardian Phone</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedStudent.guardian_phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Emergency Contact</p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedStudent.emergency_contact || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(selectedStudent.status)}`}
                    >
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            <div className="flex justify-end gap-3 border-t bg-slate-50 p-5">

              <button
                onClick={() => {
                  setSelectedStudent(null)
                  openEditForm(selectedStudent)
                }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Pencil size={16} />
                Edit Student
              </button>

              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
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