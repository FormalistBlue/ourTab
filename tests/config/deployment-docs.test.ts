import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('deployment documentation', () => {
  it('defines Docker deployment with persistent data', () => {
    const dockerfile = readFileSync('docker/Dockerfile', 'utf8')
    const compose = readFileSync('docker/docker-compose.yml', 'utf8')

    expect(dockerfile).toContain('FROM node:20-alpine AS builder')
    expect(dockerfile).toContain('ENV DATABASE_PATH=/app/data/ourtab.db')
    expect(dockerfile).toContain('EXPOSE 3000')
    expect(compose).toContain('3000:3000')
    expect(compose).toContain('DATABASE_PATH=/app/data/ourtab.db')
    expect(compose).toContain('./data:/app/data')
  })

  it('documents local development and Docker usage', () => {
    const readme = readFileSync('README.md', 'utf8')
    expect(readme).toContain('pnpm install')
    expect(readme).toContain('pnpm dev')
    expect(readme).toContain('pnpm test')
    expect(readme).toContain('docker compose up -d')
    expect(readme).toContain('DATABASE_PATH')
  })
})
