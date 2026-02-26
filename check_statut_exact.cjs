const { Client } = require('pg');

const client = new Client({
  host: 'db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com',
  port: 25060,
  database: 'defaultdb',
  user: 'doadmin',
  password: 'AVNS_RMJIxzQS_DOFSdl1K3s',
  ssl: { rejectUnauthorized: false }
});

async function checkStatut() {
  try {
    await client.connect();
    console.log('✅ Connecté à la BD\n');
    
    const result = await client.query(`
      SELECT 
        id, 
        statut, 
        delivery_person_id,
        LENGTH(statut) as statut_length,
        statut = 'pending' as is_pending_direct,
        CASE WHEN statut = 'pending' THEN 'OUI' ELSE 'NON' END as comparaison
      FROM commande_express 
      WHERE id IN (34, 40) 
      ORDER BY id
    `);
    
    console.log('📊 Résultats de la BD:\n');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`  Statut: "${row.statut}"`);
      console.log(`  Statut Length: ${row.statut_length}`);
      console.log(`  Delivery Person ID: ${row.delivery_person_id}`);
      console.log(`  Is Pending Direct: ${row.is_pending_direct}`);
      console.log(`  Comparaison SQL: ${row.comparaison}`);
      console.log(`  Bytes: [${Buffer.from(row.statut).toString('hex')}]`);
      console.log('');
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkStatut();
