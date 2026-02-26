const { Client } = require('pg');

const client = new Client({
  host: 'db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com',
  port: 25060,
  database: 'defaultdb',
  user: 'doadmin',
  password: 'AVNS_RMJIxzQS_DOFSdl1K3s',
  ssl: { rejectUnauthorized: false }
});

async function testUpdate() {
  try {
    await client.connect();
    console.log('✅ Connecté à la BD\n');
    
    // AVANT
    console.log('📋 AVANT UPDATE:');
    let result = await client.query('SELECT id, statut, delivery_person_id FROM commande_express WHERE id = 34');
    console.log(result.rows[0]);
    console.log('');
    
    // UPDATE DIRECT
    console.log('🔄 Exécution UPDATE SQL direct...');
    const updateResult = await client.query(
      'UPDATE commande_express SET delivery_person_id = $1, statut = $2, updated_at = NOW() WHERE id = $3 RETURNING id, statut, delivery_person_id',
      [999, 'en_cours', 34]
    );
    console.log('✅ UPDATE exécuté, rowCount:', updateResult.rowCount);
    console.log('📊 RETURNING:', updateResult.rows[0]);
    console.log('');
    
    // APRES
    console.log('📋 APRES UPDATE (SELECT):');
    result = await client.query('SELECT id, statut, delivery_person_id FROM commande_express WHERE id = 34');
    console.log(result.rows[0]);
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testUpdate();
