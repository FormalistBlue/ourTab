import type { SessionUser } from '#shared/contracts'
import { useDashboardStore } from '../stores/dashboard'

export function useAuth() {
  const user = useState<SessionUser | null | undefined>('auth-user', () => undefined)

  async function check() {
    try {
      const response = await $fetch<{ user: SessionUser | null }>('/api/auth/session')
      user.value = response.user
    } catch {
      user.value = null
    }
    return user.value
  }

  async function login(username: string, password: string) {
    const response = await $fetch<{ user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    user.value = response.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await useDashboardStore().reset()
    user.value = null
    await navigateTo('/login')
  }

  return { user, check, login, logout }
}
