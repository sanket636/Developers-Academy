import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  BookOpen,
  GraduationCap,
  IndianRupee,
  Clock,
} from 'lucide-react'
import api from '../../services/api'

interface Course {
  id: number
  course_name: string
  course_code: string
  description: string
  duration_months: number
  course_fee: string | number
  teacher: number | null
  teacher_name: string
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  created_at: string
  updated_at: string
}

interface Teacher {
  id: number
  username: string
  first_name: string
  last_name: string
  employee_id: string
  specialization: string
}

interface CourseForm {
  course_name: string
  course_code: string
  description: string
  duration_months: string
  course_fee: string
  teacher: string
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
}

const initialForm: CourseForm = {
  course_name: '',
  course_code: '',
  description: '',
  duration_months: '6',
  course_fee: '0',
  teacher: '',
  status: 'ACTIVE',
}

function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const [form, setForm] = useState<CourseForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [courseResponse, teacherResponse] = await Promise.all([
        api.get<Course[]>('courses/'),
        api.get<Teacher[]>('teachers/'),
      ])

      setCourses(courseResponse.data)
      setTeachers(teacherResponse.data)
    } catch (err: any) {
      console.error('Courses fetch error:', err)
      setError('Unable to load courses. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const searchText = search.toLowerCase()

      const matchesSearch =
        course.course_name.toLowerCase().includes(searchText) ||
        course.course_code.toLowerCase().includes(searchText) ||
        (course.teacher_name || '').toLowerCase().includes(searchText)

      const matchesStatus =
        statusFilter === 'ALL' || course.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [courses, search, statusFilter])

  const activeCourses = courses.filter(
    (course) => course.status === 'ACTIVE'
  ).length

  const inactiveCourses = courses.filter(
    (course) => course.status === 'INACTIVE'
  ).length

  const completedCourses = courses.filter(
    (course) => course.status === 'COMPLETED'
  ).length

  const openAddForm = () => {
    setEditingCourse(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  const openEditForm = (course: Course) => {
    setEditingCourse(course)

    setForm({
      course_name: course.course_name,
      course_code: course.course_code,
      description: course.description || '',
      duration_months: String(course.duration_months),
      course_fee: String(course.course_fee),
      teacher: course.teacher ? String(course.teacher) : '',
      status: course.status,
    })

    setError('')
    setSuccess('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCourse(null)
    setForm(initialForm)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      course_name: form.course_name.trim(),
      course_code: form.course_code.trim().toUpperCase(),
      description: form.description.trim(),
      duration_months: Number(form.duration_months),
      course_fee: Number(form.course_fee),
      teacher: form.teacher ? Number(form.teacher) : null,
      status: form.status,
    }

    try {
      if (editingCourse) {
        await api.patch(`courses/${editingCourse.id}/`, payload)
        setSuccess('Course updated successfully.')
      } else {
        await api.post('courses/create/', payload)
        setSuccess('Course created successfully.')
      }

      await fetchData()
      closeForm()
    } catch (err: any) {
      console.error('Course save error:', err)

      const data = err.response?.data

      if (data && typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(', ')
              : String(value)

            return `${field}: ${message}`
          })
          .join('\n')

        setError(messages || 'Unable to save course.')
      } else {
        setError('Unable to save course. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (course: Course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.course_name}"?`
    )

    if (!confirmed) return

    try {
      await api.delete(`courses/${course.id}/`)
      setCourses((previous) =>
        previous.filter((item) => item.id !== course.id)
      )

      if (selectedCourse?.id === course.id) {
        setSelectedCourse(null)
      }

      setSuccess('Course deleted successfully.')
      setError('')
    } catch (err: any) {
      console.error('Course delete error:', err)
      setError(
        err.response?.data?.detail ||
          'Unable to delete course. It may be linked to existing batches.'
      )
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700'
      case 'INACTIVE':
        return 'bg-slate-100 text-slate-600'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Courses Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage academy courses, teachers and course fees.
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
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Course
          </button>
        </div>
      </div>

      {/* Messages */}
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

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Courses</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-800">
                {courses.length}
              </h2>
            </div>
            <div className="rounded-lg bg-indigo-100 p-3 text-indigo-600">
              <BookOpen size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Active Courses</p>
              <h2 className="mt-2 text-2xl font-bold text-emerald-600">
                {activeCourses}
              </h2>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-600">
              <GraduationCap size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Inactive Courses</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-600">
                {inactiveCourses}
              </h2>
            </div>
            <div className="rounded-lg bg-slate-100 p-3 text-slate-600">
              <BookOpen size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed Courses</p>
              <h2 className="mt-2 text-2xl font-bold text-blue-600">
                {completedCourses}
              </h2>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <GraduationCap size={23} />
            </div>
          </div>
        </div>

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
            placeholder="Search course name, code or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="COMPLETED">Completed</option>
        </select>

      </div>

      {/* Courses Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            All Courses
          </h2>

          <span className="text-sm text-slate-500">
            {filteredCourses.length} courses found
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen size={38} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              No courses found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add a new course or change your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">

              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Course Fee</th>
                  <th className="px-5 py-4">Teacher</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50">

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {course.course_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {course.course_code}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {course.duration_months} months
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      ₹{Number(course.course_fee).toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {course.teacher_name || 'Not Assigned'}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(course.status)}`}
                      >
                        {course.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">

                        <button
                          onClick={() => setSelectedCourse(course)}
                          title="View Course"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => openEditForm(course)}
                          title="Edit Course"
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(course)}
                          title="Delete Course"
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

      {/* Add / Edit Course Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter course information below.
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
                    Course Name *
                  </label>
                  <input
                    required
                    maxLength={150}
                    value={form.course_name}
                    onChange={(e) =>
                      setForm({ ...form, course_name: e.target.value })
                    }
                    placeholder="Full Stack Python Development"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Course Code *
                  </label>
                  <input
                    required
                    maxLength={30}
                    value={form.course_code}
                    onChange={(e) =>
                      setForm({ ...form, course_code: e.target.value.toUpperCase() })
                    }
                    placeholder="DA-PY-001"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Duration (Months) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.duration_months}
                    onChange={(e) =>
                      setForm({ ...form, duration_months: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Course Fee (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.course_fee}
                    onChange={(e) =>
                      setForm({ ...form, course_fee: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Assign Teacher
                  </label>
                  <select
                    value={form.teacher}
                    onChange={(e) =>
                      setForm({ ...form, teacher: e.target.value })
                    }
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
                    Course Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as CourseForm['status'],
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Course Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Enter course details, topics and learning outcomes..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
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
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving
                    ? 'Saving...'
                    : editingCourse
                      ? 'Update Course'
                      : 'Create Course'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* View Course Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                Course Details
              </h2>

              <button
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">

              <div>
                <h3 className="text-xl font-bold text-indigo-700">
                  {selectedCourse.course_name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCourse.course_code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={16} />
                    <span className="text-xs">Duration</span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-800">
                    {selectedCourse.duration_months} Months
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <IndianRupee size={16} />
                    <span className="text-xs">Course Fee</span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-800">
                    ₹{Number(selectedCourse.course_fee).toLocaleString('en-IN')}
                  </p>
                </div>

              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Assigned Teacher
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {selectedCourse.teacher_name || 'Not Assigned'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Status
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedCourse.status)}`}
                >
                  {selectedCourse.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedCourse.description || 'No description available.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedCourse(null)
                  openEditForm(selectedCourse)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Pencil size={16} />
                Edit Course
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Courses