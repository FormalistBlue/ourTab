# ourTab 开发规范

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Nuxt 3 + Vue 3 + TypeScript |
| UI | Naive UI + Tailwind CSS v4 |
| 状态管理 | Pinia (setup store) |
| 拖拽 | VueDraggablePlus |
| 右键菜单 | vue3-context-menu |
| 数据库 | SQLite + Drizzle ORM |
| 国际化 | @nuxtjs/i18n (zh-CN / en-US) |

## 项目结构

```
app/                  # 前端 (srcDir: 'app')
  components/         # Vue 组件
  composables/        # 组合式函数
  stores/             # Pinia stores
  pages/              # 页面
  layouts/            # 布局
  plugins/            # 客户端插件
  types/              # TypeScript 类型
  constants/          # 常量和默认值
  utils/              # 纯函数工具
  i18n/locales/       # 语言文件
  assets/css/         # 样式入口
server/               # 后端 (serverDir: 'server')
  api/                # Nitro API 路由
  database/           # Drizzle schema 和迁移
  repositories/       # 数据访问层
  utils/              # 服务端工具
tests/                # 测试文件
```

## 核心规范

### Vue 组件
- 使用 `<script setup lang="ts">` + Composition API
- 组件职责单一，超过 3 个独立 UI 区域时拆分
- Props 用 `defineProps`，Events 用 `defineEmits`
- 弹框使用 `<n-modal>` + `<n-card>` 实现，不要使用自定义的 Teleport + CSS 模态框
- `n-modal` 会自动处理 z-index 和弹框层级，避免颜色选择器等组件被遮挡

### 状态管理
- 使用 Pinia setup store（`defineStore('name', () => {...})`）
- Vitest 中需显式 `import { ref, computed } from 'vue'`（无 Nuxt auto-import）
- Store 通过 `$fetch` 调用 API，乐观更新本地状态

### API 路由
- 路由放 `server/api/`，使用 `defineEventHandler`
- 请求校验用 Zod schema + `readValidatedBody`
- 路由层保持薄，逻辑放 `server/repositories/`

### 样式
- Tailwind CSS v4，使用 `@import "tailwindcss"` 而非 `@tailwind` 指令
- Vite 插件: `@tailwindcss/vite`（已配置在 nuxt.config.ts）
- 语义化颜色用 CSS 变量（`--color-primary` 等），不用硬编码色值
- Naive UI 通过 `nuxtjs-naive-ui` 模块集成（支持 SSR 样式收集），组件通过 `NaiveUiResolver` 自动按需导入
- 模板中直接使用 `<n-button>`、`<n-input>`、`<n-select>`、`<n-card>` 等，无需手动 import
- composables（`useDialog`、`useMessage` 等）通过 `unplugin-auto-import` 自动导入

### 国际化
- 页面上所有显示文字禁止硬编码，必须使用 `$t('key')` 或 `useI18n().t('key')`
- 中文放 `app/i18n/locales/zh-CN.json`，英文放 `app/i18n/locales/en-US.json`
- 新增文案时同步更新两个语言文件
- 右键菜单、按钮文字、提示语、占位符等均需走 i18n

## 常用命令

```bash
pnpm dev              # 开发服务器
pnpm test             # 运行测试
pnpm build            # 生产构建
pnpm deploy           # 构建 + 重启服务
pnpm deploy:status    # 查看服务状态
pnpm deploy:logs      # 查看日志
```

## 部署

- 服务: systemd `ourtab.service`，端口 3003
- 反代: OpenResty `ourtab.shandawang.cc` → `127.0.0.1:3003`
- 数据: `data/ourtab.db`（SQLite，已 gitignore）
- Nginx 配置: `/home/ubuntu/apps/reverse-proxy/conf/conf.d/ourtab.shandawang.cc.conf`

## 重要：修改代码后必须重新部署

**服务运行的是 `.output/server/index.mjs` 构建产物，源码修改不会自动生效。** 每次改完代码后必须执行：

```bash
pnpm build && sudo systemctl restart ourtab
```

或直接 `pnpm deploy`（部分环境可能不可用，备用上述命令）。

这条规则适用于所有源码改动（`app/`、`server/`、`nuxt.config.ts` 等），包括前端组件、API 路由、样式、i18n 等。

## 已知问题

- vue3-context-menu 需导入 CSS: `@imengyu/vue3-context-menu/lib/vue3-context-menu.css`
- 编辑标签功能尚未实现（右键菜单"编辑"只输出日志）
