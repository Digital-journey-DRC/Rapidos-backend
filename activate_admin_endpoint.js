import { IgnitorFactory } from '@adonisjs/core/factories'

const ignitor = new IgnitorFactory()
  .withURL(new URL('./', import.meta.url))
  .withAppRoot(import.meta.url)
  .create()

try {
  await ignitor.boot()
  
  const { default: User } = await import('#models/user')
  const { UserStatus } = await import('#app/Enum/user_status.js')
  
  // Activer le compte admin (ID 116)
  const admin = await User.find(116)
  if (admin) {
    admin.userStatus = UserStatus.ACTIVE
    admin.secureOtp = null
    admin.otpExpiredAt = null
    await admin.save()
    
    console.log('✅ Compte admin activé avec succès !')
    console.log('📧 Email:', admin.email)
    console.log('📱 Téléphone:', admin.phone)
    console.log('👤 Rôle:', admin.role)
    console.log('🆔 ID:', admin.id)
    console.log('📊 Statut:', admin.userStatus)
  } else {
    console.log('❌ Compte admin non trouvé')
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message)
} finally {
  process.exit(0)
}
