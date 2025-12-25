import pg from 'pg'
const { Client } = pg
import { readFileSync } from 'fs'

const envContent = readFileSync('.env', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const client = new Client({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
})

async function addLocationColumns() {
  try {
    await client.connect()
    console.log('✅ Connecté à la base de données')
    
    // Vérifier si les colonnes existent déjà
    const check = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('latitude', 'longitude');
    `)
    
    const existingColumns = check.rows.map(r => r.column_name)
    
    if (!existingColumns.includes('latitude')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN latitude DECIMAL(10, 8) NULL;
      `)
      console.log('✅ Colonne latitude ajoutée')
    } else {
      console.log('ℹ️  Colonne latitude existe déjà')
    }
    
    if (!existingColumns.includes('longitude')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN longitude DECIMAL(11, 8) NULL;
      `)
      console.log('✅ Colonne longitude ajoutée')
    } else {
      console.log('ℹ️  Colonne longitude existe déjà')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    throw error
  } finally {
    await client.end()
  }
}

addLocationColumns()

