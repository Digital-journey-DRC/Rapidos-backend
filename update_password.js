import { IgnitorFactory } from '@adonisjs/core/factories'

const PHONE = '+243999999999'
const NEW_PASSWORD = '1234'

const ignitor = new IgnitorFactory()
  .withURL(new URL('./', import.meta.url))
  .withAppRoot(import.meta.url)
  .create()

try {
  await ignitor.boot()

  const { default: User } = await import('#models/user')

  const user = await User.findBy('phone', PHONE)
  if (!user) {
    console.log('❌ Utilisateur non trouvé avec le téléphone:', PHONE)
    process.exit(1)
  }

  console.log('👤 Utilisateur trouvé:', user.phone, '| Rôle:', user.role, '| ID:', user.id)

  // Le modèle User utilise withAuthFinder qui hash automatiquement le password au save()
  user.password = NEW_PASSWORD
  await user.save()

  console.log('✅ Mot de passe modifié avec succès pour', PHONE)
  console.log('🔑 Nouveau mot de passe:', NEW_PASSWORD)
} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
} finally {
  process.exit(0)
}
