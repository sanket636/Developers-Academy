import { useEffect, useMemo, useState } from 'react'
import {
  Search, RefreshCw, Plus, Eye, Pencil, Trash2,
  X, ClipboardCheck, Users, CheckCircle, XCircle,
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
}

interface AttendanceRecord {
  id: number
  student: number
  student_name: string
  admission_number: string
  batch: number
  batch_name: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  remarks: string
  marked_by_name?: string
  created_at?: string
}

interface AttendanceForm {
  student: string
  batch: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  remarks: string
}

const initialForm: AttendanceForm = {
  student: '',
  batch: '',
  date: new Date().toLocaleDateString('en-CA'),
  status: 'PRESENT',
  remarks: '',
}

function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [viewRecord, setViewRecord] = useState<AttendanceRecord | null>(null)
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null)
  const [form, setForm] = useState<AttendanceForm>(initialForm)
  const [error, setError] = useState('')

  const getList = <T,>(data: unknown): T[] => {
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

  const loadData = async () => {
    try {
      setLoading(true)

      const [attendanceRes, studentsRes, batchesRes] = await Promise.all([
        api.get('attendance/'),
        api.get('students/'),
        api.get('batches/'),
      ])

      setRecords(getList<AttendanceRecord>(attendanceRes.data))
      setStudents(getList<Student>(studentsRes.data))
      setBatches(getList<Batch>(batchesRes.data))
    } catch (err) {
      console.error('Attendance loading error:', err)
      setError('Unable to load attendance data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchText = search.toLowerCase()

      const matchesSearch =
        record.student_name?.toLowerCase().includes(searchText) ||
        record.admission_number?.toLowerCase().includes(searchText) ||
        record.batch_name?.toLowerCase().includes(searchText)

      const matchesStatus =
        statusFilter === 'ALL' || record.status === statusFilter

      const matchesDate =
        !dateFilter || record.date === dateFilter

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [records, search, statusFilter, dateFilter])

  const openAddModal = () => {
    setEditRecord(null)
    setForm(initialForm)
    setError('')
    setModalOpen(true)
  }

  const openEditModal = (record: AttendanceRecord) => {
    setEditRecord(record)
    setForm({
      student: String(record.student),
      batch: String(record.batch),
      date: record.date,
      status: record.status,
      remarks: record.remarks || '',
    })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!form.student || !form.batch || !form.date) {
      setError('Please fill all required fields.')
      return
    }

    const payload = {
      student: Number(form.student),
      batch: Number(form.batch),
      date: form.date,
      status: form.status,
      remarks: form.remarks,
    }

    try {
      setSaving(true)

      if (editRecord) {
        await api.patch(`attendance/${editRecord.id}/`, payload)
      } else {
        await api.post('attendance/create/', payload)
      }

      setModalOpen(false)
      setEditRecord(null)
      setForm(initialForm)
      await loadData()
    } catch (err: any) {
      const responseData = err?.response?.data
      const message =
        typeof responseData === 'string'
          ? responseData
          : responseData
            ? Object.entries(responseData)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join(' | ')
            : 'Unable to save attendance. Please try again.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this attendance record?'
    )

    if (!confirmed) return

    try {
      await api.delete(`attendance/${id}/`)
      await loadData()
    } catch (err) {
      console.error(err)
      window.alert('Unable to delete attendance record.')
    }
  }

  const statusStyle = (status: string) => {
    const styles: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-700',
      ABSENT: 'bg-red-100 text-red-700',
      LATE: 'bg-yellow-100 text-yellow-700',
      EXCUSED: 'bg-blue-100 text-blue-700',
    }

    return styles[status] || 'bg-slate-100 text-slate-700'
  }

  const presentCount = records.filter((r) => r.status === 'PRESENT').length
  const absentCount = records.filter((r) => r.status === 'ABSENT').length
  const lateCount = records.filter((r) => r.status === 'LATE').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Attendance Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage student attendance records.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={18} />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Records</p>
            <ClipboardCheck className="text-indigo-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">
            {records.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Present</p>
            <CheckCircle className="text-green-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-green-600">
            {presentCount}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Absent</p>
            <XCircle className="text-red-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-red-600">
            {absentCount}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Late</p>
            <Users className="text-yellow-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-yellow-600">
            {lateCount}
          </h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, admission number or batch..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Status</option>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="LATE">Late</option>
          <option value="EXCUSED">Excused</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Admission No.</th>
                <th className="px-5 py-4">Batch</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Marked By</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {record.student_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.admission_number}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.batch_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.date}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.marked_by_name || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          title="View"
                          onClick={() => setViewRecord(record)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => openEditModal(record)}
                          className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDelete(record.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
          Showing {filteredRecords.length} of {records.length} records
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editRecord ? 'Edit Attendance' : 'Mark Attendance'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Student *
                </label>
                <select
                  required
                  value={form.student}
                  onChange={(e) => setForm({ ...form, student: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.admission_number})
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
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
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
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Attendance Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Status *
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceForm['status'] })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Remarks
                </label>
                <textarea
                  rows={3}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Optional remarks..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editRecord ? 'Update Attendance' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Attendance Details
              </h2>
              <button
                onClick={() => setViewRecord(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Student</p>
                <p className="font-semibold text-slate-800">{viewRecord.student_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Admission Number</p>
                <p className="font-semibold text-slate-800">{viewRecord.admission_number}</p>
              </div>
              <div>
                <p className="text-slate-500">Batch</p>
                <p className="font-semibold text-slate-800">{viewRecord.batch_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-semibold text-slate-800">{viewRecord.date}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(viewRecord.status)}`}>
                  {viewRecord.status}
                </span>
              </div>
              <div>
                <p className="text-slate-500">Remarks</p>
                <p className="font-semibold text-slate-800">{viewRecord.remarks || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Marked By</p>
                <p className="font-semibold text-slate-800">{viewRecord.marked_by_name || '-'}</p>
              </div>
            </div>

            <button
              onClick={() => setViewRecord(null)}
              className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Attendance