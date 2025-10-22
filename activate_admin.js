import { createConnection } from 'mysql2/promise'

const activateAdmin = async () => {
  const connection = await createConnection({
    host: 'db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_RMJIxzQS_DOFSdl1K3s',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  })

  try {
    // Activer le compte admin (ID 116)
    await connection.execute(
      'UPDATE users SET user_status = ?, secure_otp = NULL, otp_expired_at = NULL WHERE id = ?',
      ['active', 116]
    )
    
    console.log('✅ Compte admin activé avec succès !')
    console.log('📧 Email: admin2@rapidos.com')
    console.log('📱 Téléphone: +243825287451')
    console.log('🔑 Mot de passe: Rapidos@1234')
    console.log('👤 Rôle: admin')
    console.log('🆔 ID: 116')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await connection.end()
  }
}

activateAdmin()
