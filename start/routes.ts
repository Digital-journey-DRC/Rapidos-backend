import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const RegistersController = () => import('#controllers/registers_controller')
const ProductsController = () => import('#controllers/products_controller')
const CategoryController = () => import('#controllers/categories_controller')
const CommandesController = () => import('#controllers/commandes_controller')
const LivraisonsController = () => import('#controllers/livraisons_controller')
const PromotionsController = () => import('#controllers/promotions_controller')
const HorairesOuvertureController = () => import('#controllers/horaires_ouverture_controller')
const EventsController = () => import('#controllers/events_controller')

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yamljs'

// Route pour servir la page Swagger UI
router.get('/docs', async ({ response }) => {
  const swaggerHtml = readFileSync(join(import.meta.dirname, '../resources/swagger.html'), 'utf-8')
  return response.type('text/html').send(swaggerHtml)
})

// Route pour servir le fichier swagger.yaml converti en JSON
router.get('/swagger.json', async ({ response }) => {
  const swaggerDocument = YAML.load(join(import.meta.dirname, '../docs/swagger.yaml'))
  return response.json(swaggerDocument)
})

router.get('/', async () => {
  return {
    hello: 'hello wellcome rapidos api',
  }
})

// Analytics / Events - Accessible sans auth (userId peut être null)
router.post('/api/events', [EventsController, 'store'])
router.post('/analytics/events', [EventsController, 'store'])

// Endpoints spécifiques pour chaque type d'événement
router.post('/api/events/view-product', [EventsController, 'logViewProduct'])
router.post('/api/events/add-to-cart', [EventsController, 'logAddToCart'])
router.post('/api/events/add-to-wishlist', [EventsController, 'logAddToWishlist'])
router.post('/api/events/purchase', [EventsController, 'logPurchase'])
router.post('/api/events/search', [EventsController, 'logSearch'])

// Route temporaire pour créer la table product_events
router.get('/api/events/create-table', [EventsController, 'createTable'])

router.post('/register', [RegistersController, 'register'])

router.post('/verify-otp/:userId', [RegistersController, 'verifyOtp'])

router.post('/login', [RegistersController, 'login'])

router.get('/logout', [RegistersController]).use(middleware.auth({ guards: ['api'] }))

router
  .get('/users/editables-fields/:userId', [RegistersController, 'sendDataForUpdate'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .post('/users/update/:userId', [RegistersController, 'updateUser'])
  .use(middleware.auth({ guards: ['api'] }))

router.get('/users/me', [RegistersController, 'getUser']).use(middleware.auth({ guards: ['api'] }))

router.get('/users', [RegistersController, 'getAllUsers']).use(middleware.auth({ guards: ['api'] }))

router
  .get('/users/:userId', [RegistersController, 'getUserById'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .delete('/users/:userId', [RegistersController, 'deleteUser'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .post('/products/store', [ProductsController, 'store'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/boutique/:userId', [ProductsController, 'getAllProductByUser'])
  .use(middleware.auth({ guards: ['api'] }))

// 2. Récupérer tous les produits d'un vendeur donné (admin uniquement, via email dans le body)
router
  .get('/products/all', [ProductsController, 'getAllProducts'])
  .use(middleware.auth({ guards: ['api'] }))

// Produits recommandés basés sur les événements de l'acheteur
router
  .get('/products/recommended', [ProductsController, 'getRecommendedProducts'])
  .use(middleware.auth({ guards: ['api'] }))

// 3. Voir tous les produits (admin uniquement)
router
  .get('/products/adm/all', [ProductsController, 'showAllProducts'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/get-products/:productId', [ProductsController, 'getProductById'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/category/:categoryId', [ProductsController, 'getProductByCategory'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/category/get-all', [CategoryController, 'getAllCategory'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/all-products', [ProductsController, 'showAllProducts'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .post('/products/update/:productId', [ProductsController, 'updateProduct'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .delete('/products/:productId', [ProductsController, 'deleteProduct'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .post('/category/store', [CategoryController, 'createCategory'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .delete('/category/delete/:categoryId', [CategoryController, 'deleteCategory'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .post('/commandes/store', [CommandesController, 'createCommande'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/commandes/vendeur', [CommandesController, 'getCommandesByUser'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/livraison/ma-liste', [LivraisonsController, 'showAllDelivery'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/vendeurs', [ProductsController, 'getVendeurAndTheirProducts'])
  .use(middleware.auth({ guards: ['api'] }))

// Horaires d'ouverture - Routes spécifiques AVANT les routes avec paramètres
router
  .post('/vendeurs/horaires', [HorairesOuvertureController, 'store'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/vendeurs/horaires', [HorairesOuvertureController, 'index'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/vendeurs/horaires/:jour', [HorairesOuvertureController, 'show'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .put('/vendeurs/horaires/:jour', [HorairesOuvertureController, 'update'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .delete('/vendeurs/horaires/:jour', [HorairesOuvertureController, 'destroy'])
  .use(middleware.auth({ guards: ['api'] }))

// Route temporaire pour créer la table (sans auth)
router.get('/vendeurs/horaires/create-table', [HorairesOuvertureController, 'createTable'])

router
  .get('/vendeurs/:id', [ProductsController, 'getVendeurById'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/commandes/acheteur', [CommandesController, 'getCommandeByAcheteur'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/livraison/accept/:livraisonId', [LivraisonsController, 'accepteDelivery'])
  .use(middleware.auth({ guards: ['api'] }))
router
  .post('/stock/:productId/update', [ProductsController, 'updateStockForProduct'])
  .use(middleware.auth({ guards: ['api'] }))

// Routes pour les promotions
// GET /promotions/create-table - Crée la table promotions (DOIT être avant /promotions/:id)
router.get('/promotions/create-table', [PromotionsController, 'createTable'])

// GET /promotions - Récupère tous les produits en promotion
router
  .get('/promotions', [PromotionsController, 'index'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /promotions/:id - Récupère une promotion spécifique
router
  .get('/promotions/:id', [PromotionsController, 'show'])
  .use(middleware.auth({ guards: ['api'] }))

// POST /promotions - Crée une nouvelle promotion (pour le marchand)
router
  .post('/promotions', [PromotionsController, 'store'])
  .use(middleware.auth({ guards: ['api'] }))

// PUT /promotions/:id - Met à jour une promotion
router
  .put('/promotions/:id', [PromotionsController, 'update'])
  .use(middleware.auth({ guards: ['api'] }))

// DELETE /promotions/:id - Supprime une promotion
router
  .delete('/promotions/:id', [PromotionsController, 'destroy'])
  .use(middleware.auth({ guards: ['api'] }))

router.post('/users/forgot-password', [RegistersController, 'forgotPassWord'])
router.post('/users/reset-password', [RegistersController, 'resetPassword'])

// Mise à jour du numéro de téléphone avec OTP
router
  .post('/users/update-phone', [RegistersController, 'updatePhone'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .post('/users/verify-phone-otp', [RegistersController, 'verifyPhoneOtp'])
  .use(middleware.auth({ guards: ['api'] }))

// Endpoint temporaire pour créer la table promotions (sans authentification)
router.get('/create-promotions-table', [PromotionsController, 'createTable'])

// Endpoint temporaire pour activer l'admin
router.post('/activate-admin', async ({ response }) => {
  try {
    const { default: User } = await import('#models/user')
    
    const admin = await User.find(117)
    if (admin) {
      admin.userStatus = 'active' as any
      admin.secureOtp = null
      admin.otpExpiredAt = null
      // S'assurer que le mot de passe est correct
      admin.password = 'Rapidos@1234'
      await admin.save()
      
      return response.json({
        message: 'Compte admin activé avec succès !',
        admin: {
          id: admin.id,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          status: admin.userStatus
        }
      })
    } else {
      return response.status(404).json({ message: 'Compte admin non trouvé' })
    }
  } catch (error) {
    return response.status(500).json({ message: 'Erreur', error: error.message })
  }
})

router
  .get('/users/:userId/active-account', [RegistersController, 'activeUserAcount'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/users/get-all/status-pending', [RegistersController, 'showAllUserWithStatusPendning'])
  .use(middleware.auth({ guards: ['api'] }))

  router.post('/users/update-profil', [RegistersController, 'updateUserProfile']).use(middleware.auth({ guards: ['api'] }))

// Route temporaire pour créer la table promotions (GET pour faciliter avec curl)
const MigrationController = () => import('#controllers/migration_controller')
router.get('/migration/create-promotions-table', [MigrationController, 'createPromotionsTable'])
