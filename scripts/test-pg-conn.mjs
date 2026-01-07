import 'dotenv/config'
import { Client } from 'pg'

const conn = process.env.DATABASE_URL
console.log('Using DATABASE_URL:', conn ? conn.replace(/:[^:@]+@/, ':****@') : conn)

const client = new Client({
  connectionString: conn,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
})

;(async () => {
  try {
    await client.connect()
    console.log('PG: connected successfully')
    await client.end()
    process.exit(0)
  } catch (err) {
    console.error('PG: connection error:')
    console.error(err)
    process.exit(1)
  }
})()
