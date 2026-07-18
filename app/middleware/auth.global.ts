export default defineNuxtRouteMiddleware(async (to) => {
  const { user, check } = useAuth()
  if (user.value === undefined) await check()

  if (to.path === '/setup') {
    const { configured } = await $fetch<{ configured: boolean }>('/api/setup/status')
    if (configured) return navigateTo(user.value ? '/' : '/login')
    return
  }

  if (to.path === '/login') {
    if (user.value) return navigateTo('/')
    const { configured } = await $fetch<{ configured: boolean }>('/api/setup/status')
    if (!configured) return navigateTo('/setup')
    return
  }

  if (!user.value) {
    const { configured } = await $fetch<{ configured: boolean }>('/api/setup/status')
    return navigateTo(configured ? '/login' : '/setup')
  }
})
