import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import BetterSqlite3 from 'better-sqlite3'

const databasePath = resolve(process.env.NUXT_DATABASE_PATH || './data/ourtab.db')
const backupDirectory = resolve(process.env.OURTAB_BACKUP_DIR || './backups')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', 'Z')
const backupPath = resolve(backupDirectory, `ourtab-${timestamp}.db`)

await mkdir(backupDirectory, { recursive: true })
const database = new BetterSqlite3(databasePath, { readonly: true })
await database.backup(backupPath)
database.close()
console.log(`Database backup written to ${backupPath}`)
