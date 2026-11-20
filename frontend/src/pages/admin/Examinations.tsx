import { useEffect, useMemo, useState } from 'react'
import {
  Search, RefreshCw, Plus, Eye, Pencil, Trash2, X,
  BookOpen, ClipboardList, Award, CheckCircle, XCircle,
} from 'lucide-react'
import api from '../../services/api'

interface Batch {
  id: number
  batch_name: string
  batch_code: string
}

interface Examination {
  id: number
  exam_name: string
  exam_code: string
  batch: number
  batch_name: string
  exam_date: string
  total_marks: number
  passing_marks: number
  description: string
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  created_by_name?: string
}

interface ExamResult {
  id: number
  examination: number
  student: number
  student_name: string
  admission_number: string
  exam_name: string
  total_marks: number
  marks_obtained: number
  percentage: number
  grade: string
  result_status: string
  remarks: string
  entered_by_name?: string
}

interface ExamForm {
  exam_name: string
  exam_code: string
  batch: string
  exam_date: string
  total_marks: string
  passing_marks: string
  description: string
  status: Examination['status']
}

interface ResultForm {
  examination: string
  student: string
  marks_obtained: string
  remarks: string
}

const initialExamForm: ExamForm = {
  exam_name: '',
  exam_code: '',
  batch: '',
  exam_date: '',
  total_marks: '100',
  passing_marks: '40',
  description: '',
  status: 'UPCOMING',
}

const initialResultForm: ResultForm = {
  examination: '',
  student: '',
  marks_obtained: '',
  remarks: '',
}

function Examinations() {
  const [exams, setExams] = useState<Examination[]>([])
  const [results, setResults] = useState<ExamResult[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState<'EXAMS' | 'RESULTS'>('EXAMS')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [examModal, setExamModal] = useState(false)
  const [resultModal, setResultModal] = useState(false)
  const [viewExam, setViewExam] = useState<Examination | null>(null)
  const [viewResult, setViewResult] = useState<ExamResult | null>(null)

  const [editExam, setEditExam] = useState<Examination | null>(null)
  const [examForm, setExamForm] = useState<ExamForm>(initialExamForm)
  const [resultForm, setResultForm] = useState<ResultForm>(initialResultForm)
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

      const [examRes, resultRes, batchRes] = await Promise.all([
        api.get('examinations/'),
        api.get('examinations/results/'),
        api.get('batches/'),
      ])

      setExams(getList<Examination>(examRes.data))
      setResults(getList<ExamResult>(resultRes.data))
      setBatches(getList<Batch>(batchRes.data))
    } catch (err) {
      console.error('Examination loading error:', err)
      setError('Unable to load examination data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const text = search.toLowerCase()

      const matchesSearch =
        exam.exam_name.toLowerCase().includes(text) ||
        exam.exam_code.toLowerCase().includes(text) ||
        exam.batch_name.toLowerCase().includes(text)

      const matchesStatus =
        statusFilter === 'ALL' || exam.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [exams, search, statusFilter])

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const text = search.toLowerCase()

      return (
        result.student_name.toLowerCase().includes(text) ||
        result.admission_number.toLowerCase().includes(text) ||
        result.exam_name.toLowerCase().includes(text)
      )
    })
  }, [results, search])

  const openAddExam = () => {
    setEditExam(null)
    setExamForm(initialExamForm)
    setError('')
    setExamModal(true)
  }

  const openEditExam = (exam: Examination) => {
    setEditExam(exam)
    setExamForm({
      exam_name: exam.exam_name,
      exam_code: exam.exam_code,
      batch: String(exam.batch),
      exam_date: exam.exam_date,
      total_marks: String(exam.total_marks),
      passing_marks: String(exam.passing_marks),
      description: exam.description || '',
      status: exam.status,
    })
    setError('')
    setExamModal(true)
  }

  const handleExamSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const total = Number(examForm.total_marks)
    const passing = Number(examForm.passing_marks)

    if (!examForm.batch || total <= 0 || passing <= 0 || passing > total) {
      setError('Select a batch and enter valid total and passing marks.')
      return
    }

    const payload = {
      ...examForm,
      batch: Number(examForm.batch),
      total_marks: total,
      passing_marks: passing,
    }

    try {
      setSaving(true)

      if (editExam) {
        await api.patch(`examinations/${editExam.id}/`, payload)
      } else {
        await api.post('examinations/create/', payload)
      }

      setExamModal(false)
      setEditExam(null)
      await loadData()
    } catch (err: any) {
      const data = err?.response?.data
      setError(
        data
          ? Object.entries(data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ')
          : 'Unable to save examination.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleExamDelete = async (id: number) => {
    if (!window.confirm('Delete this examination?')) return

    try {
      await api.delete(`examinations/${id}/`)
      await loadData()
    } catch (err) {
      console.error(err)
      window.alert('Unable to delete examination. Check whether results are linked.')
    }
  }

  const openAddResult = () => {
    setResultForm(initialResultForm)
    setError('')
    setResultModal(true)
  }

  const handleResultSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!resultForm.examination || !resultForm.student || resultForm.marks_obtained === '') {
      setError('Please fill all required fields.')
      return
    }

    const selectedExam = exams.find(
      (exam) => exam.id === Number(resultForm.examination)
    )

    const marks = Number(resultForm.marks_obtained)

    if (!selectedExam || marks < 0 || marks > selectedExam.total_marks) {
      setError('Marks must be between 0 and total marks.')
      return
    }

    const payload = {
      examination: Number(resultForm.examination),
      student: Number(resultForm.student),
      marks_obtained: marks,
      remarks: resultForm.remarks,
    }

    try {
      setSaving(true)
      await api.post('examinations/results/create/', payload)
      setResultModal(false)
      setResultForm(initialResultForm)
      await loadData()
      setActiveTab('RESULTS')
    } catch (err: any) {
      const data = err?.response?.data
      setError(
        data
          ? Object.entries(data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ')
          : 'Unable to save exam result.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleResultDelete = async (id: number) => {
    if (!window.confirm('Delete this exam result?')) return

    try {
      await api.delete(`examinations/results/${id}/`)
      await loadData()
    } catch (err) {
      console.error(err)
      window.alert('Unable to delete result. Admin permission may be required.')
    }
  }

  const statusStyle = (status: string) => {
    const styles: Record<string, string> = {
      UPCOMING: 'bg-blue-100 text-blue-700',
      ONGOING: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      PASS: 'bg-green-100 text-green-700',
      FAIL: 'bg-red-100 text-red-700',
    }

    return styles[status] || 'bg-slate-100 text-slate-700'
  }

  const passCount = results.filter((r) => r.result_status === 'PASS').length
  const failCount = results.filter((r) => r.result_status === 'FAIL').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Examinations Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage examinations, marks and student results.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={17} /> Refresh
          </button>

          {activeTab === 'EXAMS' ? (
            <button
              onClick={openAddExam}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={18} /> Add Examination
            </button>
          ) : (
            <button
              onClick={openAddResult}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={18} /> Enter Marks
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Exams</p>
            <BookOpen className="text-indigo-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">{exams.length}</h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Results</p>
            <ClipboardList className="text-blue-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-800">{results.length}</h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Passed</p>
            <CheckCircle className="text-green-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-green-600">{passCount}</h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Failed</p>
            <XCircle className="text-red-600" size={22} />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-red-600">{failCount}</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('EXAMS'); setSearch(''); setStatusFilter('ALL') }}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'EXAMS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          Examinations
        </button>

        <button
          onClick={() => { setActiveTab('RESULTS'); setSearch(''); setStatusFilter('ALL') }}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === 'RESULTS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          Exam Results
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'EXAMS' ? 'Search exam, code or batch...' : 'Search student or exam...'}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        {activeTab === 'EXAMS' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}
      </div>

      {/* Exams Table */}
      {activeTab === 'EXAMS' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Exam Name</th>
                  <th className="px-5 py-4">Exam Code</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Exam Date</th>
                  <th className="px-5 py-4">Total Marks</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Loading exams...</td></tr>
                ) : filteredExams.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">No examinations found.</td></tr>
                ) : filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">{exam.exam_name}</td>
                    <td className="px-5 py-4 text-slate-600">{exam.exam_code}</td>
                    <td className="px-5 py-4 text-slate-600">{exam.batch_name}</td>
                    <td className="px-5 py-4 text-slate-600">{exam.exam_date}</td>
                    <td className="px-5 py-4 text-slate-600">{exam.total_marks}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(exam.status)}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button title="View" onClick={() => setViewExam(exam)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Eye size={17} /></button>
                        <button title="Edit" onClick={() => openEditExam(exam)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"><Pencil size={17} /></button>
                        <button title="Delete" onClick={() => handleExamDelete(exam.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
            Showing {filteredExams.length} of {exams.length} examinations
          </div>
        </div>
      )}

      {/* Results Table */}
      {activeTab === 'RESULTS' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Admission No.</th>
                  <th className="px-5 py-4">Examination</th>
                  <th className="px-5 py-4">Marks</th>
                  <th className="px-5 py-4">Percentage</th>
                  <th className="px-5 py-4">Grade</th>
                  <th className="px-5 py-4">Result</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">Loading results...</td></tr>
                ) : filteredResults.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">No results found.</td></tr>
                ) : filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">{result.student_name}</td>
                    <td className="px-5 py-4 text-slate-600">{result.admission_number}</td>
                    <td className="px-5 py-4 text-slate-600">{result.exam_name}</td>
                    <td className="px-5 py-4 text-slate-600">{result.marks_obtained} / {result.total_marks}</td>
                    <td className="px-5 py-4 text-slate-600">{Number(result.percentage).toFixed(2)}%</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{result.grade}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(result.result_status)}`}>
                        {result.result_status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button title="View" onClick={() => setViewResult(result)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Eye size={17} /></button>
                        <button title="Delete" onClick={() => handleResultDelete(result.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
            Showing {filteredResults.length} of {results.length} results
          </div>
        </div>
      )}

      {/* Add/Edit Exam Modal */}
      {examModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{editExam ? 'Edit Examination' : 'Add Examination'}</h2>
              <button onClick={() => setExamModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>

            <form onSubmit={handleExamSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Exam Name *</label>
                <input required value={examForm.exam_name} onChange={(e) => setExamForm({ ...examForm, exam_name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="e.g. Python Final Exam" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Exam Code *</label>
                <input required value={examForm.exam_code} onChange={(e) => setExamForm({ ...examForm, exam_code: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="e.g. EX-PY-001" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Batch *</label>
                <select required value={examForm.batch} onChange={(e) => setExamForm({ ...examForm, batch: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500">
                  <option value="">Select Batch</option>
                  {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_name} ({batch.batch_code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Exam Date *</label>
                  <input type="date" required value={examForm.exam_date} onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select value={examForm.status} onChange={(e) => setExamForm({ ...examForm, status: e.target.value as Examination['status'] })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500">
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Total Marks *</label>
                  <input type="number" min="1" required value={examForm.total_marks} onChange={(e) => setExamForm({ ...examForm, total_marks: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Passing Marks *</label>
                  <input type="number" min="1" required value={examForm.passing_marks} onChange={(e) => setExamForm({ ...examForm, passing_marks: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea rows={3} value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="Optional exam description..." />
              </div>

              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setExamModal(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving...' : editExam ? 'Update Exam' : 'Create Exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enter Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Enter Student Marks</h2>
              <button onClick={() => setResultModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>

            <form onSubmit={handleResultSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Examination *</label>
                <select required value={resultForm.examination} onChange={(e) => setResultForm({ ...resultForm, examination: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500">
                  <option value="">Select Examination</option>
                  {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.exam_name} - {exam.exam_code}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Student ID *</label>
                <input type="number" min="1" required value={resultForm.student} onChange={(e) => setResultForm({ ...resultForm, student: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="Enter student ID" />
                <p className="mt-1 text-xs text-slate-500">Enter the student ID from Student Management. The backend verifies batch enrollment.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Marks Obtained *</label>
                <input type="number" min="0" step="0.01" required value={resultForm.marks_obtained} onChange={(e) => setResultForm({ ...resultForm, marks_obtained: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="Enter marks" />
                {resultForm.examination && (
                  <p className="mt-1 text-xs text-slate-500">
                    Maximum marks: {exams.find((exam) => exam.id === Number(resultForm.examination))?.total_marks}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Remarks</label>
                <textarea rows={3} value={resultForm.remarks} onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="Optional remarks..." />
              </div>

              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setResultModal(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save Result'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Exam Modal */}
      {viewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Examination Details</h2>
              <button onClick={() => setViewExam(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-500">Name:</span> <strong>{viewExam.exam_name}</strong></p>
              <p><span className="text-slate-500">Code:</span> <strong>{viewExam.exam_code}</strong></p>
              <p><span className="text-slate-500">Batch:</span> <strong>{viewExam.batch_name}</strong></p>
              <p><span className="text-slate-500">Date:</span> <strong>{viewExam.exam_date}</strong></p>
              <p><span className="text-slate-500">Total Marks:</span> <strong>{viewExam.total_marks}</strong></p>
              <p><span className="text-slate-500">Passing Marks:</span> <strong>{viewExam.passing_marks}</strong></p>
              <p><span className="text-slate-500">Status:</span> <strong>{viewExam.status}</strong></p>
              <p><span className="text-slate-500">Description:</span> <strong>{viewExam.description || '-'}</strong></p>
            </div>
            <button onClick={() => setViewExam(null)} className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white">Close</button>
          </div>
        </div>
      )}

      {/* View Result Modal */}
      {viewResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Student Result</h2>
              <button onClick={() => setViewResult(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-500">Student:</span> <strong>{viewResult.student_name}</strong></p>
              <p><span className="text-slate-500">Admission No:</span> <strong>{viewResult.admission_number}</strong></p>
              <p><span className="text-slate-500">Exam:</span> <strong>{viewResult.exam_name}</strong></p>
              <p><span className="text-slate-500">Marks:</span> <strong>{viewResult.marks_obtained} / {viewResult.total_marks}</strong></p>
              <p><span className="text-slate-500">Percentage:</span> <strong>{Number(viewResult.percentage).toFixed(2)}%</strong></p>
              <p><span className="text-slate-500">Grade:</span> <strong>{viewResult.grade}</strong></p>
              <p><span className="text-slate-500">Result:</span> <strong>{viewResult.result_status}</strong></p>
              <p><span className="text-slate-500">Remarks:</span> <strong>{viewResult.remarks || '-'}</strong></p>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-indigo-50 p-3 text-indigo-700">
              <Award size={20} /> Result Details
            </div>
            <button onClick={() => setViewResult(null)} className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white">Close</button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Examinations