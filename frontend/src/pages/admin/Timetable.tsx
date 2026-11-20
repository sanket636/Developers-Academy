import { useEffect, useState } from 'react'
import { Search, RefreshCw, Plus, Pencil, Trash2, X, CalendarDays, Clock } from 'lucide-react'
import api from '../../services/api'

interface Batch {
  id: number
  batch_name: string
  batch_code: string
}

interface Teacher {
  id: number
  username: string
  first_name: string
  last_name: string
}

interface TimetableItem {
  id: number
  batch: number
  batch_name?: string
  teacher: number
  teacher_name?: string
  course_name?: string
  subject: string
  day_of_week: string
  start_time: string
  end_time: string
  classroom: string
  effective_from: string
  effective_to?: string | null
  status: string
  description?: string
}

interface FormData {
  batch: string
  teacher: string
  subject: string
  day_of_week: string
  start_time: string
  end_time: string
  classroom: string
  effective_from: string
  effective_to: string
  status: string
  description: string
}

const initialForm: FormData = {
  batch: '',
  teacher: '',
  subject: '',
  day_of_week: 'MONDAY',
  start_time: '09:00',
  end_time: '10:00',
  classroom: '',
  effective_from: new Date().toISOString().split('T')[0],
  effective_to: '',
  status: 'ACTIVE',
  description: '',
}

function getList<T>(data: any): T[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function Timetable() {
  const [items, setItems] = useState<TimetableItem[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [scheduleRes, batchRes, teacherRes] = await Promise.all([
        api.get('timetable/'),
        api.get('batches/'),
        api.get('teachers/'),
      ])
      setItems(getList<TimetableItem>(scheduleRes.data))
      setBatches(getList<Batch>(batchRes.data))
      setTeachers(getList<Teacher>(teacherRes.data))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to load timetable records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredItems = items.filter((item) => {
    const text = `${item.subject} ${item.batch_name || ''} ${item.teacher_name || ''} ${item.classroom}`.toLowerCase()
    const matchesSearch = text.includes(search.toLowerCase())
    const matchesDay = dayFilter === 'ALL' || item.day_of_week === dayFilter
    return matchesSearch && matchesDay
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(initialForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (item: TimetableItem) => {
    setEditingId(item.id)
    setForm({
      batch: String(item.batch),
      teacher: String(item.teacher),
      subject: item.subject,
      day_of_week: item.day_of_week,
      start_time: item.start_time.slice(0, 5),
      end_time: item.end_time.slice(0, 5),
      classroom: item.classroom,
      effective_from: item.effective_from,
      effective_to: item.effective_to || '',
      status: item.status,
      description: item.description || '',
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const payload = {
      ...form,
      batch: Number(form.batch),
      teacher: Number(form.teacher),
      effective_to: form.effective_to || null,
    }

    try {
      if (editingId) {
        await api.patch(`timetable/${editingId}/`, payload)
        setSuccess('Timetable updated successfully.')
      } else {
        await api.post('timetable/create/', payload)
        setSuccess('Timetable created successfully.')
      }
      setShowForm(false)
      setForm(initialForm)
      setEditingId(null)
      await loadData()
    } catch (err: any) {
      const data = err.response?.data
      setError(typeof data === 'string' ? data : data?.detail || JSON.stringify(data || 'Unable to save timetable.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this timetable entry?')) return
    try {
      await api.delete(`timetable/${id}/`)
      setSuccess('Timetable deleted successfully.')
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to delete timetable entry.')
    }
  }

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Timetable Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage academy lecture schedules.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus size={17} /> Add Schedule
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <CalendarDays className="mb-3 text-blue-600" size={23} />
          <p className="text-sm text-slate-500">Total Schedules</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">{items.length}</h2>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <Clock className="mb-3 text-green-600" size={23} />
          <p className="text-sm text-slate-500">Active Schedules</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">{items.filter(i => i.status === 'ACTIVE').length}</h2>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <CalendarDays className="mb-3 text-purple-600" size={23} />
          <p className="text-sm text-slate-500">Days Scheduled</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">{new Set(items.map(i => i.day_of_week)).size}</h2>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 md:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject, batch, teacher or classroom..." className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500" />
          </div>
          <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-blue-500">
            <option value="ALL">All Days</option>
            {days.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading timetable...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Subject</th>
                  <th className="px-5 py-4">Batch / Course</th>
                  <th className="px-5 py-4">Teacher</th>
                  <th className="px-5 py-4">Day</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Classroom</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">{item.subject}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">{item.batch_name || `Batch #${item.batch}`}</p>
                      <p className="text-xs text-slate-500">{item.course_name || ''}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{item.teacher_name || `Teacher #${item.teacher}`}</td>
                    <td className="px-5 py-4 text-slate-600">{item.day_of_week}</td>
                    <td className="px-5 py-4 text-slate-600">{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</td>
                    <td className="px-5 py-4 text-slate-600">{item.classroom || '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100" title="Edit"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">No timetable entries found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Schedule' : 'Add Timetable Schedule'}</h2>
                <p className="text-sm text-slate-500">Enter lecture schedule details.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Batch *</label>
                  <select required value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500">
                    <option value="">Select Batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name} ({b.batch_code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Teacher *</label>
                  <select required value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500">
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.username})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Subject *</label>
                <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" placeholder="Python Programming" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Day *</label>
                  <select required value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500">
                    {days.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start Time *</label>
                  <input required type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End Time *</label>
                  <input required type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Classroom *</label>
                  <input required value={form.classroom} onChange={e => setForm({ ...form, classroom: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" placeholder="Room 101" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500">
                    <option value="ACTIVE">Active</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Effective From *</label>
                  <input required type="date" value={form.effective_from} onChange={e => setForm({ ...form, effective_from: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Effective To</label>
                  <input type="date" value={form.effective_to} onChange={e => setForm({ ...form, effective_to: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border p-3 outline-none focus:border-blue-500" placeholder="Optional schedule details..." />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
                <button disabled={submitting} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Saving...' : editingId ? 'Update Schedule' : 'Create Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Timetable