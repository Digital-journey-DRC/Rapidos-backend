// Script Node.js simple pour créer la table promotions
import pg from 'pg'
const { Client } = pg

const client = new Client({
  host: process.env.DB_HOST || 'db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com',
  port: process.env.DB_PORT || 25060,
  user: process.env.DB_USER || 'doadmin',
  password: process.env.DB_PASSWORD || 'AVNS_RMJIxzQS_DOFSdl1K3s',
  database: process.env.DB_DATABASE || 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  }
})

const migrationSQL = `
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image VARCHAR(255) NOT NULL,
  image1 VARCHAR(255) NULL,
  image2 VARCHAR(255) NULL,
  image3 VARCHAR(255) NULL,
  image4 VARCHAR(255) NULL,
  libelle VARCHAR(255) NOT NULL,
  likes INTEGER DEFAULT 0,
  delai_promotion TIMESTAMP NOT NULL,
  nouveau_prix DECIMAL(10, 2) NOT NULL,
  ancien_prix DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

try {
  console.log('Connexion à la base de données...')
  await client.connect()
  console.log('✅ Connexion réussie')
  
  console.log('Création de la table promotions...')
  await client.query(migrationSQL)
  console.log('✅ Table promotions créée avec succès!')
  
  await client.end()
  process.exit(0)
} catch (error) {
  console.error('❌ Erreur:', error.message)
  await client.end()
  process.exit(1)
}




