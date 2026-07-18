<script setup lang="ts">
const { login } = useAuth()
const username = ref('')
const password = ref('')
const pending = ref(false)
const error = ref('')

async function submit() {
  pending.value = true
  error.value = ''
  try {
    await login(username.value, password.value)
    await navigateTo('/')
  } catch (cause) {
    error.value = (cause as { data?: { statusMessage?: string } })?.data?.statusMessage || '登录失败'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <div class="auth-atmosphere" aria-hidden="true" />
    <section class="auth-card">
      <div class="brand-mark">O</div>
      <p class="eyebrow">WELCOME BACK</p>
      <h1>回到你的桌面</h1>
      <p class="auth-copy">登录后，所有工作区和网址标签都会从服务器同步。</p>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>账号</span>
          <input v-model="username" autocomplete="username" required autofocus>
        </label>
        <label>
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="current-password" required>
        </label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="primary-button" type="submit" :disabled="pending">
          {{ pending ? '正在进入…' : '进入 ourTab' }}
        </button>
      </form>
    </section>
  </main>
</template>
