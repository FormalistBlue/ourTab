FROM node:24-bookworm-slim AS builder

WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY extension ./extension
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec nuxt prepare && pnpm build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NUXT_DATABASE_PATH=/app/data/ourtab.db
ENV NUXT_UPLOADS_DIR=/app/uploads
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts/backup.mjs ./scripts/backup.mjs
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/data /app/uploads /app/backups \
  && chown -R node:node /app

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
