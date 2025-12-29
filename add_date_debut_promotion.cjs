const { Client } = require('pg');
require('dotenv').config();

async function addDateDebutColumn() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');
    
    // Ajouter la colonne date_debut_promotion
    await client.query(`
      ALTER TABLE promotions 
      ADD COLUMN IF NOT EXISTS date_debut_promotion TIMESTAMP;
    `);
    
    console.log('✅ Colonne date_debut_promotion ajoutée avec succès!');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    try { await client.end(); } catch (e) {}
  }
}

addDateDebutColumn();
