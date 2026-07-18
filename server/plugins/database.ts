import { migrateDatabase } from '../database/migrate'

export default defineNitroPlugin(() => {
  migrateDatabase()
})
