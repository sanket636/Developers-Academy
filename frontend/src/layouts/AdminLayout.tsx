import { NavLink, Outlet } from 'react-router-dom'

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  ClipboardCheck,
  FileText,
  IndianRupee,
  CalendarDays,
  Bell,
  Settings,
  LogOut,
  GraduationCap as AcademyIcon,
  UserPlus,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'

const navigation = [
  {
    name: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Students',
    path: '/admin/students',
    icon: Users,
  },
  {
    name: 'Teachers',
    path: '/admin/teachers',
    icon: GraduationCap,
  },
  {
    name: 'Courses',
    path: '/admin/courses',
    icon: BookOpen,
  },
  {
    name: 'Batches',
    path: '/admin/batches',
    icon: Layers,
  },
  {
    name: 'Student Enrollment',
    path: '/admin/enrollments',
    icon: UserPlus,
  },
  {
    name: 'Attendance',
    path: '/admin/attendance',
    icon: ClipboardCheck,
  },
  {
    name: 'Examinations',
    path: '/admin/examinations',
    icon: FileText,
  },
  {
    name: 'Fees & Payments',
    path: '/admin/fees',
    icon: IndianRupee,
  },
  {
    name: 'Timetable',
    path: '/admin/timetable',
    icon: CalendarDays,
  },
  {
    name: 'Notifications',
    path: '/admin/notifications',
    icon: Bell,
  },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: Settings,
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-white">

        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-700 px-5 py-6">

          <div className="rounded-xl bg-indigo-600 p-2">
            <AcademyIcon size={25} />
          </div>

          <div>
            <h2 className="text-lg font-bold">
              Developers
            </h2>
            <p className="text-xs text-slate-400">
              Academy Management
            </p>
          </div>

        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            )
          })}

        </nav>

        {/* Admin Information */}
        <div className="border-t border-slate-700 px-4 py-4">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.username || 'Administrator'}
              </p>

              <p className="text-xs text-slate-400">
                Administrator
              </p>
            </div>

          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut size={19} />
            Logout
          </button>

        </div>

      </aside>

      {/* Main Area */}
      <div className="min-w-0 flex-1">

        {/* Header */}
        <header className="flex min-h-[73px] items-center justify-between border-b border-slate-200 bg-white px-6 py-4">

          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              Developers Academy
            </h1>

            <p className="text-xs text-slate-500">
              Student Management System
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user?.username || 'Admin'}
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>

          </div>

        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>

      </div>

    </div>
  )
}