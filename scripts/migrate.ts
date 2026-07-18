import { migrateDatabase } from '../server/database/migrate'

migrateDatabase()
console.log('Database migrations applied.')
