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
    connectionTimeoutMillis: 10000,
    query_timeout: 5000
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');
    
    // Ajouter la colonne date_debut_promotion
    const result = await client.query(`
      ALTER TABLE promotions 
      ADD COLUMN IF NOT EXISTS date_debut_promotion TIMESTAMP;
    `);
    
    console.log('✅ Colonne date_debut_promotion ajoutée avec succès!');
    
    // Vérifier la structure
    const verify = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'promotions' AND column_name = 'date_debut_promotion';
    `);
    
    if (verify.rows.length > 0) {
      console.log('✅ Vérification: colonne date_debut_promotion existe bien');
    } else {
      console.log('⚠️  Avertissement: colonne non trouvée après ajout');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    try { await client.end(); } catch (e) {}
  }
}

addDateDebutColumn();
