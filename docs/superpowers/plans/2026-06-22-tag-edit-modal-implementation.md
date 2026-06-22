# 标签编辑/新增弹框实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现标签编辑和新增功能，包括编辑弹框、空白区域右键菜单和图标配置功能

**Architecture:** 创建独立的TabEditModal组件支持编辑和新增模式，扩展数据模型支持图标颜色配置，在MainContent中实现空白区域右键菜单

**Tech Stack:** Vue 3 + Composition API + TypeScript + Naive UI + Tailwind CSS v4 + Pinia + vue3-context-menu

## Global Constraints

- 使用`<script setup lang="ts">` + Composition API
- 弹框使用`<Teleport to="body">` + CSS模态框
- 所有显示文字使用`$t('key')`国际化
- 使用现有`createTab`和`updateTab` API
- 使用`n-color-picker`支持透明度选择
- 前端实现favicon抓取功能

---

## 文件结构

### 需要修改的文件
- `app/types/ourtab.ts` - 扩展Tab接口，添加iconColor和iconBackgroundColor字段
- `server/database/schema.ts` - 扩展tabs表，添加icon_color和icon_background_color字段
- `app/utils/validators.ts` - 更新Zod验证schema支持新字段
- `server/repositories/tabs.ts` - 更新createTab和updateTab函数支持新字段
- `app/components/tabs/TabGrid.vue` - 处理编辑事件，集成TabEditModal
- `app/components/layout/MainContent.vue` - 添加空白区域右键菜单
- `app/i18n/locales/zh-CN.json` - 添加中文国际化键值
- `app/i18n/locales/en-US.json` - 添加英文国际化键值

### 需要创建的文件
- `app/components/tabs/TabEditModal.vue` - 标签编辑/新增弹框组件

---

### Task 1: 扩展数据模型

**Files:**
- Modify: `app/types/ourtab.ts:18-22`
- Modify: `server/database/schema.ts:13-25`
- Modify: `app/utils/validators.ts:11-12`
- Modify: `server/repositories/tabs.ts:10-20`

**Interfaces:**
- Consumes: 现有Tab接口，CreateTabInput，UpdateTabInput
- Produces: 扩展后的Tab接口，支持iconColor和iconBackgroundColor字段

- [ ] **Step 1: 扩展Tab接口**

```typescript
// app/types/ourtab.ts
export interface Tab {
  id: string
  groupId: string
  name: string
  url: string
  icon: string | null
  iconType: IconType
  iconColor?: string | null
  iconBackgroundColor?: string | null
  isFolder: boolean
  folderId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateTabInput {
  groupId: string
  name: string
  url: string
  icon?: string | null
  iconType: IconType
  iconColor?: string | null
  iconBackgroundColor?: string | null
  isFolder: boolean
  folderId?: string | null
  sortOrder?: number
}

export interface UpdateTabInput {
  groupId?: string
  name?: string
  url?: string
  icon?: string | null
  iconType?: IconType
  iconColor?: string | null
  iconBackgroundColor?: string | null
  isFolder?: boolean
  folderId?: string | null
  sortOrder?: number
}
```

- [ ] **Step 2: 扩展数据库schema**

```typescript
// server/database/schema.ts
export const tabs = sqliteTable('tabs', {
  // ... 现有字段
  iconColor: text('icon_color'),
  iconBackgroundColor: text('icon_background_color'),
  // ... 其他字段
})
```

- [ ] **Step 3: 更新Zod验证schema**

```typescript
// app/utils/validators.ts
export const createTabSchema = z.object({
  // ... 现有字段
  iconColor: z.string().trim().min(1).nullable().optional(),
  iconBackgroundColor: z.string().trim().min(1).nullable().optional(),
  // ... 其他字段
})

export const updateTabSchema = createTabSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one tab field is required' }
)
```

- [ ] **Step 4: 更新仓库函数**

```typescript
// server/repositories/tabs.ts
export function createTab(db: OurTabDatabase, input: CreateTabInput) {
  const timestamp = now()
  const scopedTabs = listTabs(db).filter(
    (tab) => tab.groupId === input.groupId && tab.folderId === (input.folderId ?? null)
  )
  const row = {
    id: randomUUID(),
    groupId: input.groupId,
    name: input.name,
    url: input.url,
    icon: input.icon ?? null,
    iconType: input.iconType,
    iconColor: input.iconColor ?? null,
    iconBackgroundColor: input.iconBackgroundColor ?? null,
    isFolder: input.isFolder,
    folderId: input.folderId ?? null,
    sortOrder: input.sortOrder ?? scopedTabs.length,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  db.insert(tabs).values(row).run()
  return row
}

export function updateTab(db: OurTabDatabase, id: string, input: UpdateTabInput) {
  db.update(tabs)
    .set({
      groupId: input.groupId,
      name: input.name,
      url: input.url,
      icon: input.icon,
      iconType: input.iconType,
      iconColor: input.iconColor,
      iconBackgroundColor: input.iconBackgroundColor,
      isFolder: input.isFolder,
      folderId: input.folderId,
      sortOrder: input.sortOrder,
      updatedAt: now(),
    })
    .where(eq(tabs.id, id))
    .run()
  return getTab(db, id)
}
```

- [ ] **Step 5: 生成并运行数据库迁移**

```bash
pnpm db:generate
pnpm db:migrate
```

- [ ] **Step 6: 提交更改**

```bash
git add app/types/ourtab.ts server/database/schema.ts app/utils/validators.ts server/repositories/tabs.ts
git commit -m "feat: extend tab model with icon color fields"
```

---

### Task 2: 创建TabEditModal组件

**Files:**
- Create: `app/components/tabs/TabEditModal.vue`

**Interfaces:**
- Consumes: Tab接口，CreateTabInput，UpdateTabInput
- Produces: TabEditModal组件，支持编辑和新增模式

- [ ] **Step 1: 创建TabEditModal组件基础结构**

```vue
<!-- app/components/tabs/TabEditModal.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Tab, CreateTabInput, UpdateTabInput } from '~/types/ourtab'
import { useTabsStore } from '~/stores/tabs'

const props = defineProps<{
  tab?: Tab
  groupId: string
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [tab: Tab]
}>()

const tabsStore = useTabsStore()
const formData = ref({
  name: '',
  url: '',
  iconType: 'auto' as 'auto' | 'text' | 'custom',
  iconColor: '',
  iconBackgroundColor: '',
})

const isEditing = computed(() => !!props.tab)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.tab) {
      formData.value = {
        name: props.tab.name,
        url: props.tab.url,
        iconType: props.tab.iconType,
        iconColor: props.tab.iconColor || '',
        iconBackgroundColor: props.tab.iconBackgroundColor || '',
      }
    } else {
      formData.value = {
        name: '',
        url: '',
        iconType: 'auto',
        iconColor: '',
        iconBackgroundColor: '',
      }
    }
  }
})

function close() {
  emit('update:open', false)
}

async function save() {
  // 保存逻辑将在Step 5中实现
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="ourtab-modal-overlay" @click.self="close">
        <n-card :title="isEditing ? $t('tabEdit.title.edit') : $t('tabEdit.title.add')" closable segmented style="max-width: 32rem; width: 100%" @close="close">
          <!-- 表单内容将在这里实现 -->
          <template #footer>
            <div class="flex justify-end gap-3">
              <n-button @click="close">{{ $t('tabEdit.cancel') }}</n-button>
              <n-button type="primary" @click="save">{{ $t('tabEdit.save') }}</n-button>
            </div>
          </template>
        </n-card>
      </div>
    </Transition>
  </Teleport>
</template>
```

- [ ] **Step 2: 实现表单字段**

```vue
<!-- app/components/tabs/TabEditModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="ourtab-modal-overlay" @click.self="close">
        <n-card :title="isEditing ? $t('tabEdit.title.edit') : $t('tabEdit.title.add')" closable segmented style="max-width: 32rem; width: 100%" @close="close">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.name') }}</label>
              <n-input v-model:value="formData.name" placeholder="请输入标签名称" />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.url') }}</label>
              <n-input v-model:value="formData.url" placeholder="请输入网址" />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.iconType') }}</label>
              <n-radio-group v-model:value="formData.iconType">
                <n-radio value="auto">{{ $t('tabEdit.iconType.auto') }}</n-radio>
                <n-radio value="text">{{ $t('tabEdit.iconType.text') }}</n-radio>
              </n-radio-group>
            </div>
            
            <!-- 图标配置区域将在这里实现 -->
          </div>
          
          <template #footer>
            <div class="flex justify-end gap-3">
              <n-button @click="close">{{ $t('tabEdit.cancel') }}</n-button>
              <n-button type="primary" @click="save">{{ $t('tabEdit.save') }}</n-button>
            </div>
          </template>
        </n-card>
      </div>
    </Transition>
  </Teleport>
</template>
```

- [ ] **Step 3: 实现图标配置区域**

```vue
<!-- app/components/tabs/TabEditModal.vue -->
<template>
  <!-- ... 前面的代码 -->
  
  <!-- 图标配置区域 -->
  <div v-if="formData.iconType === 'text'" class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.iconColor') }}</label>
      <n-color-picker v-model:value="formData.iconColor" :show-alpha="true" />
    </div>
    
    <div>
      <label class="block text-sm font-medium mb-1">{{ $t('tabEdit.iconBackgroundColor') }}</label>
      <n-color-picker v-model:value="formData.iconBackgroundColor" :show-alpha="true" />
    </div>
  </div>
  
  <!-- ... 后面的代码 -->
</template>
```

- [ ] **Step 4: 实现favicon抓取功能**

```vue
<!-- app/components/tabs/TabEditModal.vue -->
<script setup lang="ts">
// ... 前面的代码

const faviconUrl = ref<string | null>(null)
const loadingFavicon = ref(false)

async function fetchFavicon(url: string) {
  if (!url) return
  
  loadingFavicon.value = true
  faviconUrl.value = null
  
  try {
    // 尝试常见的favicon路径
    const domain = new URL(url).origin
    const faviconPaths = [
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/apple-touch-icon-precomposed.png',
      '/favicon.png',
    ]
    
    for (const path of faviconPaths) {
      try {
        const response = await fetch(`${domain}${path}`, { method: 'HEAD' })
        if (response.ok) {
          faviconUrl.value = `${domain}${path}`
          break
        }
      } catch {
        // 继续尝试下一个路径
      }
    }
  } catch (error) {
    console.error('Failed to fetch favicon:', error)
  } finally {
    loadingFavicon.value = false
  }
}

watch(() => formData.value.url, (newUrl) => {
  if (formData.value.iconType === 'auto' && newUrl) {
    fetchFavicon(newUrl)
  }
})
</script>

<template>
  <!-- ... 前面的代码 -->
  
  <!-- 自动抓取模式预览 -->
  <div v-if="formData.iconType === 'auto'" class="flex items-center gap-3">
    <div class="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-white/70">
      <img v-if="faviconUrl" :src="faviconUrl" class="size-8 object-contain" @error="faviconUrl = null" />
      <span v-else class="text-lg font-bold text-[var(--color-primary)]">
        {{ loadingFavicon ? '...' : formData.name.slice(0, 1) }}
      </span>
    </div>
    <span class="text-sm text-gray-500">
      {{ loadingFavicon ? '正在抓取favicon...' : (faviconUrl ? '已找到favicon' : '未找到favicon，将使用首字母') }}
    </span>
  </div>
  
  <!-- ... 后面的代码 -->
</template>
```

- [ ] **Step 5: 实现保存逻辑**

```vue
<!-- app/components/tabs/TabEditModal.vue -->
<script setup lang="ts">
// ... 前面的代码

async function save() {
  if (!formData.value.name || !formData.value.url) {
    // 验证失败
    return
  }
  
  const tabData = {
    name: formData.value.name,
    url: formData.value.url,
    iconType: formData.value.iconType,
    iconColor: formData.value.iconType === 'text' ? formData.value.iconColor : null,
    iconBackgroundColor: formData.value.iconType === 'text' ? formData.value.iconBackgroundColor : null,
    icon: formData.value.iconType === 'auto' ? faviconUrl.value : null,
  }
  
  if (isEditing.value && props.tab) {
    await tabsStore.updateTab(props.tab.id, tabData)
  } else {
    await tabsStore.createTab({ ...tabData, groupId: props.groupId, isFolder: false })
  }
  
  emit('save', tabData as Tab)
  close()
}
</script>
```

- [ ] **Step 6: 提交TabEditModal组件**

```bash
git add app/components/tabs/TabEditModal.vue
git commit -m "feat: add TabEditModal component"
```

---

### Task 3: 集成TabEditModal到TabGrid

**Files:**
- Modify: `app/components/tabs/TabGrid.vue`

**Interfaces:**
- Consumes: TabEditModal组件
- Produces: 编辑事件处理，TabEditModal集成

- [ ] **Step 1: 导入TabEditModal**

```vue
<!-- app/components/tabs/TabGrid.vue -->
<script setup lang="ts">
// ... 现有导入
import TabEditModal from './TabEditModal.vue'
import type { Tab } from '~/types/ourtab'

// ... 现有代码

const editModalOpen = ref(false)
const editingTab = ref<Tab | undefined>()
const editingGroupId = ref('')
```

- [ ] **Step 2: 更新handleEdit函数**

```vue
<!-- app/components/tabs/TabGrid.vue -->
<script setup lang="ts">
// ... 前面的代码

function handleEdit(tab: Tab) {
  editingTab.value = tab
  editingGroupId.value = tab.groupId
  editModalOpen.value = true
}

function handleAdd() {
  editingTab.value = undefined
  editingGroupId.value = groupsStore.currentGroupId
  editModalOpen.value = true
}

function handleSave(tab: Tab) {
  // 刷新标签列表
  tabsStore.fetchTabs()
}
</script>
```

- [ ] **Step 3: 更新模板**

```vue
<!-- app/components/tabs/TabGrid.vue -->
<template>
  <section class="w-full max-w-5xl px-2">
    <VueDraggable v-model="orderedTabs" class="grid grid-cols-3 justify-items-center gap-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8" :animation="180">
      <template v-for="tab in orderedTabs" :key="tab.id">
        <FolderTab v-if="tab.isFolder" :tab="tab" @open="openFolder" @delete="handleDelete" />
        <TabItem v-else :tab="tab" @delete="handleDelete" @edit="handleEdit" />
      </template>
    </VueDraggable>
    <FolderModal v-model:open="folderOpen" :folder="activeFolder" />
    <TabEditModal 
      v-model:open="editModalOpen" 
      :tab="editingTab" 
      :group-id="editingGroupId" 
      @save="handleSave" 
    />
  </section>
</template>
```

- [ ] **Step 4: 提交更改**

```bash
git add app/components/tabs/TabGrid.vue
git commit -m "feat: integrate TabEditModal into TabGrid"
```

---

### Task 4: 实现空白区域右键菜单

**Files:**
- Modify: `app/components/layout/MainContent.vue`

**Interfaces:**
- Consumes: ContextMenu库，TabEditModal组件
- Produces: 空白区域右键菜单，新增标签功能

- [ ] **Step 1: 导入依赖**

```vue
<!-- app/components/layout/MainContent.vue -->
<script setup lang="ts">
import ContextMenu from '@imengyu/vue3-context-menu'
import TabEditModal from '~/components/tabs/TabEditModal.vue'
import SearchBar from './SearchBar.vue'
import TabGrid from '~/components/tabs/TabGrid.vue'
import { useGroupsStore } from '~/stores/groups'
import { useTabsStore } from '~/stores/tabs'

defineEmits<{ openSettings: []; openImportExport: [] }>()

const groupsStore = useGroupsStore()
const tabsStore = useTabsStore()
const editModalOpen = ref(false)
const editingGroupId = ref('')
```

- [ ] **Step 2: 实现右键菜单处理函数**

```vue
<!-- app/components/layout/MainContent.vue -->
<script setup lang="ts">
// ... 前面的代码

function handleContextMenu(event: MouseEvent) {
  event.preventDefault()
  
  ContextMenu.showContextMenu({
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        label: '新增标签',
        onClick: () => {
          editingGroupId.value = groupsStore.currentGroupId
          editModalOpen.value = true
        }
      },
      {
        label: '设置',
        onClick: () => {
          // 触发打开设置事件
        }
      }
    ]
  })
}

function handleSave(tab: Tab) {
  // 刷新标签列表
  tabsStore.fetchTabs()
}
</script>
```

- [ ] **Step 3: 更新模板**

```vue
<!-- app/components/layout/MainContent.vue -->
<template>
  <main class="flex min-w-0 flex-1 flex-col items-center gap-10 pt-10 md:pt-16" @contextmenu="handleContextMenu">
    <div class="flex w-full max-w-5xl justify-end gap-3 px-2">
      <n-button @click="$emit('openImportExport')">{{ $t('importExport.title') }}</n-button>
      <n-button @click="$emit('openSettings')">{{ $t('settings.title') }}</n-button>
    </div>
    <SearchBar />
    <TabGrid />
    <TabEditModal 
      v-model:open="editModalOpen" 
      :group-id="editingGroupId" 
      @save="handleSave" 
    />
  </main>
</template>
```

- [ ] **Step 4: 提交更改**

```bash
git add app/components/layout/MainContent.vue
git commit -m "feat: add context menu for adding new tabs"
```

---

### Task 5: 更新国际化文件

**Files:**
- Modify: `app/i18n/locales/zh-CN.json`
- Modify: `app/i18n/locales/en-US.json`

**Interfaces:**
- Consumes: 现有国际化结构
- Produces: 新增的国际化键值

- [ ] **Step 1: 更新中文国际化文件**

```json
// app/i18n/locales/zh-CN.json
{
  "common": { "add": "添加", "edit": "编辑", "delete": "删除", "save": "保存", "cancel": "取消", "confirm": "确认", "close": "关闭", "loading": "加载中...", "success": "成功", "error": "错误" },
  "sidebar": { "title": "标签分组", "addGroup": "新建分组", "editGroup": "编辑分组", "deleteGroup": "删除分组", "deleteConfirm": "确定要删除这个分组吗？" },
  "search": { "placeholder": "搜索网页...", "engines": { "google": "Google", "bing": "Bing", "duckduckgo": "DuckDuckGo" } },
  "tabs": { "addTab": "新建标签", "editTab": "编辑标签", "deleteTab": "删除标签", "deleteConfirm": "确定要删除这个标签吗？", "name": "名称", "url": "网址", "icon": "图标" },
  "folder": { "title": "文件夹", "addTab": "添加标签", "empty": "文件夹为空" },
  "settings": { "title": "设置", "search": "搜索设置", "theme": "主题设置", "language": "语言设置", "background": "背景设置", "searchEngine": "默认搜索引擎", "currentTheme": "当前主题", "currentLanguage": "当前语言", "backgroundType": "背景类型" },
  "importExport": { "title": "导入导出", "export": "导出数据", "import": "导入数据", "exportSuccess": "导出成功", "importSuccess": "导入成功", "importError": "导入失败，请检查文件格式" },
  "tabEdit": {
    "title": {
      "edit": "编辑标签",
      "add": "新增标签"
    },
    "name": "名称",
    "url": "URL",
    "iconType": "图标类型",
    "iconType.auto": "自动抓取favicon",
    "iconType.text": "字体图标",
    "iconColor": "字体颜色",
    "iconBackgroundColor": "背景颜色",
    "save": "保存",
    "cancel": "取消"
  },
  "contextMenu": {
    "addTag": "新增标签",
    "settings": "设置"
  }
}
```

- [ ] **Step 2: 更新英文国际化文件**

```json
// app/i18n/locales/en-US.json
{
  "common": { "add": "Add", "edit": "Edit", "delete": "Delete", "save": "Save", "cancel": "Cancel", "confirm": "Confirm", "close": "Close", "loading": "Loading...", "success": "Success", "error": "Error" },
  "sidebar": { "title": "Tab Groups", "addGroup": "New Group", "editGroup": "Edit Group", "deleteGroup": "Delete Group", "deleteConfirm": "Are you sure you want to delete this group?" },
  "search": { "placeholder": "Search the web...", "engines": { "google": "Google", "bing": "Bing", "duckduckgo": "DuckDuckGo" } },
  "tabs": { "addTab": "New Tab", "editTab": "Edit Tab", "deleteTab": "Delete Tab", "deleteConfirm": "Are you sure you want to delete this tab?", "name": "Name", "url": "URL", "icon": "Icon" },
  "folder": { "title": "Folder", "addTab": "Add Tab", "empty": "Folder is empty" },
  "settings": { "title": "Settings", "search": "Search Settings", "theme": "Theme Settings", "language": "Language Settings", "background": "Background Settings", "searchEngine": "Default Search Engine", "currentTheme": "Current Theme", "currentLanguage": "Current Language", "backgroundType": "Background Type" },
  "importExport": { "title": "Import/Export", "export": "Export Data", "import": "Import Data", "exportSuccess": "Export successful", "importSuccess": "Import successful", "importError": "Import failed, please check file format" },
  "tabEdit": {
    "title": {
      "edit": "Edit Tab",
      "add": "Add Tab"
    },
    "name": "Name",
    "url": "URL",
    "iconType": "Icon Type",
    "iconType.auto": "Auto fetch favicon",
    "iconType.text": "Text icon",
    "iconColor": "Icon Color",
    "iconBackgroundColor": "Background Color",
    "save": "Save",
    "cancel": "Cancel"
  },
  "contextMenu": {
    "addTag": "Add Tab",
    "settings": "Settings"
  }
}
```

- [ ] **Step 3: 提交更改**

```bash
git add app/i18n/locales/zh-CN.json app/i18n/locales/en-US.json
git commit -m "feat: add i18n keys for tab edit modal"
```

---

### Task 6: 测试和验证

**Files:**
- Test: 运行现有测试确保没有破坏现有功能
- Test: 手动测试编辑和新增功能

**Interfaces:**
- Consumes: 所有前面的任务
- Produces: 测试验证

- [ ] **Step 1: 运行现有测试**

```bash
pnpm test
```

Expected: 所有测试通过

- [ ] **Step 2: 手动测试编辑功能**

1. 右键点击标签，选择"编辑"
2. 验证弹框显示正确
3. 修改标签信息
4. 点击保存
5. 验证标签更新成功

- [ ] **Step 3: 手动测试新增功能**

1. 在空白区域右键点击
2. 选择"新增标签"
3. 填写标签信息
4. 点击保存
5. 验证标签创建成功

- [ ] **Step 4: 手动测试图标配置**

1. 编辑或新增标签
2. 选择"字体图标"类型
3. 配置字体颜色和背景颜色
4. 验证颜色选择器支持透明度
5. 保存并验证图标显示正确

- [ ] **Step 5: 提交最终更改**

```bash
git add .
git commit -m "feat: complete tab edit modal implementation"
```

---

## 实现顺序

1. **Task 1**: 扩展数据模型（必须首先完成）
2. **Task 2**: 创建TabEditModal组件
3. **Task 3**: 集成TabEditModal到TabGrid
4. **Task 4**: 实现空白区域右键菜单
5. **Task 5**: 更新国际化文件
6. **Task 6**: 测试和验证

## 注意事项

1. **数据库迁移**：Task 1完成后需要运行数据库迁移
2. **API兼容性**：确保新字段是可选的，保持向后兼容
3. **错误处理**：在favicon抓取和API调用中添加适当的错误处理
4. **用户体验**：添加加载状态和错误提示
5. **国际化**：所有显示文字必须使用`$t('key')`
6. **样式一致性**：遵循现有的设计规范和样式变量