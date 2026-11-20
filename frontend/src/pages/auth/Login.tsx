import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login, user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError('')
    setSubmitting(true)

    try {
      await login(username.trim(), password)

      if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user?.role === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true })
      } else if (user?.role === 'STUDENT') {
        navigate('/student/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch {
      setError('Invalid username or password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">

        {/* Left Branding Section */}
        <div className="hidden flex-col justify-between bg-indigo-700 p-12 text-white md:flex">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <GraduationCap size={42} />

              <span className="text-2xl font-bold">
                Developers Academy
              </span>
            </div>

            <h1 className="mb-5 text-4xl font-bold leading-tight">
              Manage Your Learning Journey
            </h1>

            <p className="leading-7 text-indigo-100">
              A smart student management platform connecting students,
              teachers and administrators in one place.
            </p>
          </div>

          <p className="text-sm text-indigo-200">
            © 2026 Developers Academy. All rights reserved.
          </p>
        </div>

        {/* Login Form Section */}
        <div className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md">

            <div className="mb-8 text-center md:text-left">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-100 p-3 text-indigo-700 md:hidden">
                <GraduationCap size={32} />
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>

              <p className="mt-2 text-slate-500">
                Sign in to your Developers Academy account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>

                <div className="flex items-center rounded-lg border border-slate-300 px-3 transition focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100">
                  <User size={19} className="text-slate-400" />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                    className="w-full border-0 bg-transparent p-3 text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="flex items-center rounded-lg border border-slate-300 px-3 transition focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100">
                  <Lock size={19} className="text-slate-400" />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full border-0 bg-transparent p-3 text-slate-900 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="text-slate-500 transition hover:text-indigo-700"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-700 py-3 font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Secure access for Students, Teachers and Administrators.
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}