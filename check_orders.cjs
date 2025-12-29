const { Client } = require('pg')

const connectionString = `postgresql://doadmin:AVNS_RMJIxzQS_DOFSdl1K3s@db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com:25060/defaultdb?sslmode=require`

async function checkOrders() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  })

  // Désactiver la vérification SSL stricte
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  try {
    await client.connect()
    console.log('✅ Connecté à la base de données\n')

    // Vérifier les commandes du vendeur ID 3
    const result = await client.query(`
      SELECT id, order_id, status, vendor_id, client_id, total, created_at
      FROM ecommerce_orders
      WHERE vendor_id = 3
      ORDER BY created_at DESC
    `)

    console.log('📦 Commandes du vendeur (ID: 3):')
    console.log(JSON.stringify(result.rows, null, 2))
    console.log(`\n📊 Total: ${result.rows.length} commande(s)`)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await client.end()
  }
}

checkOrders()
