import { useEffect, useState } from 'react'
import { User, Save, RefreshCw, Settings as SettingsIcon, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../../services/api'

interface Profile {
  id?: number
  username?: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  address: string
  date_of_birth: string
  role?: string
}

const initialProfile: Profile = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  address: '',
  date_of_birth: '',
}

function Settings() {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError('')
      setMessage('')

      const response = await api.get('auth/profile/')
      const data = response.data

      setProfile({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        address: data.address || '',
        date_of_birth: data.date_of_birth || data.dob || '',
        username: data.username || '',
        role: data.role || '',
        id: data.id,
      })
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Unable to load profile information.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone_number: profile.phone_number,
        address: profile.address,
        dob: profile.date_of_birth || null,
      }

      await api.patch('auth/profile/update/', payload)

      setMessage('Profile updated successfully!')
      await fetchProfile()
    } catch (err: any) {
      const data = err.response?.data

      if (data && typeof data === 'object') {
        const firstError = Object.entries(data)
          .map(([key, value]) => {
            const text = Array.isArray(value) ? value.join(', ') : String(value)
            return `${key}: ${text}`
          })
          .join(' | ')

        setError(firstError || 'Unable to update profile.')
      } else {
        setError('Unable to update profile. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <SettingsIcon size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Settings & Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your academy account information.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <User size={25} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                Personal Information
              </h2>
              <p className="text-sm text-gray-500">
                Update your profile details below.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">

          {/* Account Information */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Account Information
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  value={profile.username || ''}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  value={profile.role || 'ADMIN'}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-500"
                />
              </div>

            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Personal Details */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Personal Details
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={profile.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={profile.date_of_birth}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Address */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Address Information
            </h3>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Address
            </label>

            <textarea
              name="address"
              rows={3}
              value={profile.address}
              onChange={handleChange}
              placeholder="Enter your address"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">

            <button
              type="button"
              onClick={fetchProfile}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={17} />
              Reset
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

          </div>

        </form>
      </div>

    </div>
  )
}

export default Settings