<script setup lang="ts">
import type { SessionUser } from '#shared/contracts'

const { user } = useAuth()
const token = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const pending = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  pending.value = true
  try {
    const response = await $fetch<{ user: SessionUser }>('/api/setup', {
      method: 'POST',
      body: { token: token.value, username: username.value, password: password.value }
    })
    user.value = response.user
    await navigateTo('/')
  } catch (cause) {
    error.value = (cause as { data?: { statusMessage?: string } })?.data?.statusMessage || '初始化失败'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <div class="auth-atmosphere" aria-hidden="true" />
    <section class="auth-card auth-card--wide">
      <div class="brand-mark">O</div>
      <p class="eyebrow">FIRST LIGHT</p>
      <h1>建立你的新桌面</h1>
      <p class="auth-copy">这是一次性初始化。创建管理员后，此入口会自动关闭。</p>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>Setup Token</span>
          <input v-model="token" type="password" autocomplete="one-time-code" required>
        </label>
        <label>
          <span>管理员账号</span>
          <input v-model="username" autocomplete="username" minlength="3" required>
        </label>
        <div class="auth-form__split">
          <label>
            <span>密码</span>
            <input v-model="password" type="password" autocomplete="new-password" minlength="12" required>
          </label>
          <label>
            <span>确认密码</span>
            <input v-model="confirmPassword" type="password" autocomplete="new-password" minlength="12" required>
          </label>
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="primary-button" type="submit" :disabled="pending">
          {{ pending ? '正在创建…' : '创建管理员并进入' }}
        </button>
      </form>
    </section>
  </main>
</template>
