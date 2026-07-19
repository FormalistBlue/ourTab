import { expect, test, type Page } from '@playwright/test'

const customIcon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAARUlEQVRYhe3XsREAMAhC0ezJjgzkMmaLpHmFvXcifM40+3OOBcYJSoTxhsuIhhVXGEUcLyAZSFZQGli+ismoZlVO81wHF8rziKYS99gXAAAAAElFTkSuQmCC', 'base64')

async function enterApp(page: Page) {
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
}

async function addLink(page: Page, title: string) {
  await page.getByRole('button', { name: '添加网址' }).first().click()
  await page.locator('input[type="url"]').fill('https://example.com')
  await page.locator('dialog input').nth(1).fill(title)
  await page.getByRole('button', { name: '保存标签' }).click()
  await expect(page.locator('.link-tile__label').filter({ hasText: title }).last()).toBeVisible()
}

test('first setup and a link survive a reload', async ({ page }, testInfo) => {
  await enterApp(page)
  const title = `Reload ${testInfo.project.name}`
  await addLink(page, title)
  await page.reload()
  await expect(page.locator('.link-tile__label').filter({ hasText: title }).last()).toBeVisible()
})

test('desktop context menus expose actions and a custom icon can be uploaded', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop right-click coverage')
  await enterApp(page)
  const title = `Context Menu Link ${testInfo.retry}`
  await addLink(page, title)
  const tile = page.locator('.link-tile').filter({ hasText: title })

  await tile.click({ button: 'right' })
  const menu = page.getByRole('menu', { name: '快捷操作' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem')).toHaveText(['在新标签页打开', '编辑标签', '编辑图标', '删除标签'])
  await menu.getByRole('menuitem', { name: '编辑图标' }).click()

  const iconDialog = page.getByRole('dialog').filter({ hasText: `编辑“${title}”的图标` })
  await expect(iconDialog).toBeVisible()
  await iconDialog.locator('input[type="file"]').setInputFiles({ name: 'custom-icon.png', mimeType: 'image/png', buffer: customIcon })
  await iconDialog.getByRole('button', { name: '保存图标' }).click()
  await expect(iconDialog).toBeHidden()
  await expect(tile.locator('img[src^="/uploads/icons/"]')).toBeVisible()

  await page.locator('.hero-header__time').click({ button: 'right' })
  await expect(menu.getByRole('menuitem')).toHaveText(['设置', '添加图标', '编辑背景'])
  await menu.getByRole('menuitem', { name: '编辑背景' }).click()
  await expect(page.getByRole('heading', { name: '壁纸' })).toBeVisible()
  await page.getByRole('button', { name: '关闭设置' }).click()

  const workspace = page.locator('.workspace-dock__list button.active')
  await workspace.click({ button: 'right' })
  await expect(menu.getByRole('menuitem')).toHaveText(['编辑工作区', '删除工作区'])
  await menu.getByRole('menuitem', { name: '编辑工作区' }).click()
  await expect(page.getByRole('heading', { name: '重命名工作区' })).toBeVisible()
  await page.getByRole('button', { name: '取消' }).last().click()
})

test('settings apply without a reload and touch has a shortcut action menu', async ({ page }, testInfo) => {
  await enterApp(page)
  await page.getByRole('button', { name: '打开设置' }).click()

  await page.getByRole('tab', { name: /视觉/ }).click()
  const openMode = page.getByLabel('标签默认打开方式')
  await openMode.selectOption('new-tab')
  const shaderToggle = page.locator('.setting-toggle').filter({ hasText: '雾光流域' }).locator('input[type="checkbox"]')
  if (!await shaderToggle.isChecked()) {
    await shaderToggle.check()
    await expect(page.locator('.app-background__shader')).toBeVisible()
    await shaderToggle.uncheck()
    await expect(page.locator('.app-background__shader')).toHaveCount(0)
  }
  await page.getByRole('button', { name: '关闭设置' }).click()

  await page.getByRole('button', { name: '添加网址' }).first().click()
  const editorOpenMode = page.locator('.modal-dialog[open] .field-label').filter({ hasText: '打开方式' }).locator('select')
  await expect(editorOpenMode).toHaveValue('new-tab')
  await page.getByRole('button', { name: '取消' }).click()

  if (testInfo.project.name === 'chromium-mobile') {
    const title = `Touch Menu Link ${testInfo.retry}`
    await addLink(page, title)
    await page.getByRole('button', { name: `打开 ${title} 操作菜单` }).click()
    await expect(page.getByRole('menuitem', { name: '编辑图标' })).toBeVisible()
  }
})

test('desktop wheel switches between workspaces', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop wheel coverage')
  await enterApp(page)

  await page.getByRole('button', { name: '打开设置' }).click()
  const workspaceName = `Wheel ${testInfo.retry}`
  await page.getByPlaceholder('新工作区名称').fill(workspaceName)
  await page.getByRole('tabpanel').getByRole('button', { name: '添加工作区' }).click()
  await expect(page.locator('.workspace-dock__list button')).toHaveCount(2)
  await page.getByRole('button', { name: '关闭设置' }).click()

  const activeWorkspace = page.locator('.workspace-dock__list button.active')
  await expect(activeWorkspace).not.toHaveText(workspaceName)
  await page.locator('.app-shell').dispatchEvent('wheel', { deltaY: 120 })
  await expect(activeWorkspace).toHaveText(workspaceName)

  await page.waitForTimeout(650)
  await page.locator('.app-shell').dispatchEvent('wheel', { deltaY: -120 })
  await expect(activeWorkspace).not.toHaveText(workspaceName)
})

test('uploaded wallpapers can be deleted from the wallpaper settings', async ({ page }, testInfo) => {
  await enterApp(page)
  await page.getByRole('button', { name: '打开设置' }).click()
  await page.getByRole('tab', { name: /壁纸/ }).click()

  const wallpaperName = `e2e-wallpaper-${testInfo.project.name}`
  await page.locator('.settings-panel__body input[type="file"]').setInputFiles({ name: `${wallpaperName}.png`, mimeType: 'image/png', buffer: customIcon })
  const card = page.locator('.wallpaper-card').filter({ hasText: wallpaperName })
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: `删除壁纸 ${wallpaperName}` }).click()

  const confirmation = page.locator('.modal-dialog').filter({ hasText: '删除上传壁纸' })
  await expect(confirmation).toBeVisible()
  await confirmation.getByRole('button', { name: '删除壁纸' }).click()
  await expect(card).toHaveCount(0)
})
