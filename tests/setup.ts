import { vi } from 'vitest'
import naive from 'naive-ui'
import { config } from '@vue/test-utils'

Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
})

vi.stubGlobal('useMessage', () => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}))

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  locale: { value: 'en-US' },
}))

config.global.plugins = [naive]
config.global.stubs = {
  Teleport: { template: '<slot />' },
  Transition: { template: '<slot />' },
}
