# ourTab

一个单用户、服务端同步的 Chromium 新标签页应用。

## 本地开发

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

默认开发地址为 `http://localhost:3303`。首次打开 `/setup`，使用 `.env` 中的 setup token 创建管理员账号。

## 检查

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm extension:build
```

部署说明见 `deploy/README.md`。
