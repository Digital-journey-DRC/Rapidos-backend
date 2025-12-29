const { Client } = require('pg');
require('dotenv').config();

async function activateBuyer() {
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
    console.log('✅ Connecté');
    
    const result = await client.query(`
      UPDATE users 
      SET user_status = 'active', 
          secure_otp = NULL, 
          otp_expired_at = NULL
      WHERE phone = '+243999888777'
      RETURNING id, phone, user_status, role;
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Acheteur activé:', result.rows[0]);
    } else {
      console.log('⚠️ Aucun utilisateur trouvé');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    try { await client.end(); } catch (e) {}
  }
}

activateBuyer();
