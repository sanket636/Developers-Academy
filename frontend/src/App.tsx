import { Navigate, Route, Routes } from 'react-router-dom'

import Login from './pages/auth/Login'

import AdminDashboard from './pages/admin/AdminDashboard'
import Students from './pages/admin/Students'
import Teachers from './pages/admin/Teachers'
import Courses from './pages/admin/Courses'
import Batches from './pages/admin/Batches'
import Enrollments from './pages/admin/Enrollments'
import Attendance from './pages/admin/Attendance'
import Examinations from './pages/admin/Examinations'
import Fees from './pages/admin/Fees'
import Timetable from './pages/admin/Timetable'
import Notifications from './pages/admin/Notifications'
import Settings from './pages/admin/Settings'

import TeacherDashboard from './pages/teacher/TeacherDashboard'
import StudentDashboard from './pages/student/StudentDashboard'

import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import { useAuth } from './context/AuthContext'

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (user.role === 'TEACHER') {
    return <Navigate to="/teacher/dashboard" replace />
  }

  if (user.role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>

      {/* Home Route */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>

        <Route path="/admin" element={<AdminLayout />}>

          {/* Dashboard */}
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Students Management */}
          <Route path="students" element={<Students />} />

          {/* Teachers Management */}
          <Route path="teachers" element={<Teachers />} />

          {/* Courses Management */}
          <Route path="courses" element={<Courses />} />

          {/* Batches Management */}
          <Route path="batches" element={<Batches />} />

          {/* Student Enrollment */}
          <Route path="enrollments" element={<Enrollments />} />

          {/* Attendance Management */}
          <Route path="attendance" element={<Attendance />} />

          {/* Examinations Management */}
          <Route path="examinations" element={<Examinations />} />

          {/* Fees & Payments Management */}
          <Route path="fees" element={<Fees />} />

          {/* Timetable Management */}
          <Route path="timetable" element={<Timetable />} />

          {/* Notifications Management */}
          <Route path="notifications" element={<Notifications />} />

          {/* Settings & Profile Management */}
          <Route path="settings" element={<Settings />} />

        </Route>

      </Route>

      {/* Teacher Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
        <Route
          path="/teacher/dashboard"
          element={<TeacherDashboard />}
        />
      </Route>

      {/* Student Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route
          path="/student/dashboard"
          element={<StudentDashboard />}
        />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<HomeRedirect />} />

    </Routes>
  )
}

export default App