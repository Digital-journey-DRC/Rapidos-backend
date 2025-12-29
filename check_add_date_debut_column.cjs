const { Client } = require('pg');
require('dotenv').config();

async function checkAndAddColumn() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    statement_timeout: 30000
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données');
    
    // Vérifier la structure actuelle
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'promotions' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Colonnes actuelles de la table promotions:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Vérifier si date_debut_promotion existe
    const hasColumn = columns.rows.some(col => col.column_name === 'date_debut_promotion');
    
    if (!hasColumn) {
      console.log('\n⚠️  La colonne date_debut_promotion est manquante');
      console.log('➕ Ajout de la colonne...');
      
      await client.query(`
        ALTER TABLE promotions 
        ADD COLUMN IF NOT EXISTS date_debut_promotion TIMESTAMP;
      `);
      
      console.log('✅ Colonne date_debut_promotion ajoutée avec succès!');
    } else {
      console.log('\n✅ La colonne date_debut_promotion existe déjà');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    try { await client.end(); } catch (e) {}
  }
}

checkAndAddColumn();
