import { test, expect } from '@playwright/test'

test('first setup and a link survive a reload', async ({ page }) => {
  await page.goto('/setup')
  await expect(page.locator('.auth-card')).toBeVisible()
  const inputs = page.locator('input')
  if (await page.getByRole('button', { name: '创建管理员并进入' }).count()) {
    await inputs.nth(0).fill('e2e-setup-token-1234567890')
    await inputs.nth(1).fill('e2eadmin')
    await inputs.nth(2).fill('e2e-password-123')
    await inputs.nth(3).fill('e2e-password-123')
    await page.getByRole('button', { name: '创建管理员并进入' }).click()
  } else {
    await inputs.nth(0).fill('e2eadmin')
    await inputs.nth(1).fill('e2e-password-123')
    await page.getByRole('button', { name: '进入 ourTab' }).click()
  }
  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: '添加网址' }).first().click()
  await page.locator('input[type="url"]').fill('https://example.com')
  await page.locator('dialog input').nth(1).fill('Example')
  await page.getByRole('button', { name: '保存标签' }).click()
  await expect(page.getByText('Example')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Example')).toBeVisible()
})
