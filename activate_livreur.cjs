const { Client } = require('pg')

const connectionString = `postgresql://doadmin:AVNS_RMJIxzQS_DOFSdl1K3s@db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com:25060/defaultdb?sslmode=require`

async function activateLivreur() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  })

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  try {
    await client.connect()
    console.log('✅ Connecté à la base de données\n')

    // Activer le livreur
    const result = await client.query(`
      UPDATE users 
      SET user_status = 'active', 
          secure_otp = NULL, 
          otp_expired_at = NULL
      WHERE phone = '+243888777666'
      RETURNING id, first_name, last_name, phone, role, user_status
    `)

    if (result.rows.length > 0) {
      console.log('✅ Livreur activé avec succès:')
      console.log(JSON.stringify(result.rows[0], null, 2))
    } else {
      console.log('❌ Livreur non trouvé')
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await client.end()
  }
}

activateLivreur()
