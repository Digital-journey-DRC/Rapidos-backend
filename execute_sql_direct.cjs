const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_RMJIxzQS_DOFSdl1K3s',
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeMigration() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await client.connect();
    console.log('✅ Connecté!\n');

    // Lire le fichier SQL
    const sql = fs.readFileSync('execute_migration.sql', 'utf8');
    
    // Séparer les requêtes (simple split par point-virgule)
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    console.log(`📝 Exécution de ${queries.length} requêtes...\n`);

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.toLowerCase().startsWith('select')) {
        console.log(`\n🔍 Requête ${i + 1}: Vérification...`);
        const result = await client.query(query);
        console.table(result.rows);
      } else {
        console.log(`⚙️  Requête ${i + 1}: ${query.substring(0, 80)}...`);
        await client.query(query);
        console.log('   ✅ Succès');
      }
    }

    console.log('\n🎉 Toutes les migrations ont été exécutées avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

executeMigration();
