export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  phone_number?: string | null
  profile_picture?: string | null
}

export interface LoginResponse {
  access: string
  refresh: string
}