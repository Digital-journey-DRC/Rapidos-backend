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
const EcommerceOrdersController = () => import('#controllers/ecommerce_orders_controller')
const PaymentMethodsController = () => import('#controllers/payment_methods_controller')
const AdminTransactionsController = () => import('#controllers/admin_transactions_controller')

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

router
  .post('/users/location', [RegistersController, 'updateVendorLocation'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/users/location', [RegistersController, 'getVendorLocation'])
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

// Produits recommandés basés sur les événements de l'acheteur (auth optionnelle)
router.get('/products/recommended', [ProductsController, 'getRecommendedProducts'])

// Produits aléatoires (10 produits)
router.get('/products/random', [ProductsController, 'getRandomProducts'])

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

// Récupérer les produits par slug de catégorie (public, sans accents)
// Ex: /products/by-category/telephones, /products/by-category/electronique
router.get('/products/by-category/:slug', [ProductsController, 'getProductsByCategoryName'])

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
  .group(() => {
    router.post('/category/store', [CategoryController, 'createCategory'])
    router.put('/category/update/:categoryId', [CategoryController, 'updateCategory'])
    router.delete('/category/delete/:categoryId', [CategoryController, 'deleteCategory'])
  })
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

router.get('/vendeurs/:id', [ProductsController, 'getVendeurById'])

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

// GET /promotions/test - Récupère tous les produits en promotion (sans auth pour test)
router.get('/promotions/test', [PromotionsController, 'testIndex'])

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

// Changement de mot de passe
router
  .post('/users/change-password', [RegistersController, 'changePassword'])
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

// ============================================================
// NOUVEAU MODULE E-COMMERCE ORDERS (NE PAS TOUCHER)
// ============================================================

// Endpoint temporaire pour créer les tables
router.get('/ecommerce/create-tables', [EcommerceOrdersController, 'createTables'])

// Créer une commande e-commerce
router
  .post('/ecommerce/commandes/store', [EcommerceOrdersController, 'store'])
  .use(middleware.auth({ guards: ['api'] }))

// Initialiser des commandes multi-vendeurs
router
  .post('/ecommerce/commandes/initialize', [EcommerceOrdersController, 'initialize'])
  .use(middleware.auth({ guards: ['api'] }))

// Voir toutes ses commandes (acheteur connecté)
router
  .get('/ecommerce/commandes/buyer/me', [EcommerceOrdersController, 'getBuyerOrders'])
  .use(middleware.auth({ guards: ['api'] }))

// Modifier le moyen de paiement d'une commande
router
  .patch('/ecommerce/commandes/:id/payment-method', [EcommerceOrdersController, 'updatePaymentMethod'])
  .use(middleware.auth({ guards: ['api'] }))

// Modifier les moyens de paiement de plusieurs commandes en batch
router
  .patch('/ecommerce/commandes/batch-update-payment-methods', [EcommerceOrdersController, 'batchUpdatePaymentMethods'])
  .use(middleware.auth({ guards: ['api'] }))

// Voir ses commandes (acheteur)
router
  .get('/ecommerce/commandes/acheteur', [EcommerceOrdersController, 'getOrdersByBuyer'])
  .use(middleware.auth({ guards: ['api'] }))

// Voir ses commandes (vendeur)
router
  .get('/ecommerce/commandes/vendeur', [EcommerceOrdersController, 'getOrdersByVendor'])
  .use(middleware.auth({ guards: ['api'] }))

// Voir toutes les commandes du système avec pagination (admin uniquement)
// IMPORTANT: Cette route doit être déclarée AVANT les routes avec paramètres dynamiques
router
  .get('/ecommerce/commandes/admin/all', [EcommerceOrdersController, 'getAllOrders'])
  .use(middleware.auth({ guards: ['api'] }))

// Liste des livraisons disponibles (livreur)
router
  .get('/ecommerce/livraison/ma-liste', [EcommerceOrdersController, 'getDeliveriesList'])
  .use(middleware.auth({ guards: ['api'] }))

// Liste des livraisons prêtes à être expédiées (livreur) - uniquement pret_a_expedier
router
  .get('/ecommerce/livraison/disponibles', [EcommerceOrdersController, 'getAvailableDeliveries'])
  .use(middleware.auth({ guards: ['api'] }))

// Mettre à jour le statut d'une commande
router
  .patch('/ecommerce/commandes/:id/status', [EcommerceOrdersController, 'updateStatus'])
  .use(middleware.auth({ guards: ['api'] }))

// Upload photo du colis et générer code (vendeur)
router
  .post('/ecommerce/commandes/:id/upload-package-photo', [EcommerceOrdersController, 'uploadPackagePhoto'])
  .use(middleware.auth({ guards: ['api'] }))

// Prendre en charge une livraison (livreur)
router
  .post('/ecommerce/livraison/:id/take', [EcommerceOrdersController, 'takeDelivery'])
  .use(middleware.auth({ guards: ['api'] }))

// Mettre à jour la localisation du vendeur
router
  .post('/ecommerce/location/vendeur', [RegistersController, 'updateVendorLocation'])
  .use(middleware.auth({ guards: ['api'] }))

// Récupérer la localisation du vendeur
router
  .get('/ecommerce/location/vendeur', [RegistersController, 'getVendorLocation'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE E-COMMERCE ORDERS
// ============================================================

// ============================================================
// MODULE EXPRESS ORDERS
// ============================================================
const ExpressOrdersController = () => import('#controllers/express_orders_controller')

// Gestion des clients express (vendeur)
router
  .post('/express/clients', [ExpressOrdersController, 'createClient'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/express/clients/vendeur', [ExpressOrdersController, 'getVendorClients'])
  .use(middleware.auth({ guards: ['api'] }))

// Initialiser une commande express (vendeur)
router
  .post('/express/commandes/initialize', [ExpressOrdersController, 'initializeOrder'])
  .use(middleware.auth({ guards: ['api'] }))

// Ajouter moyen de paiement (vendeur)
router
  .patch('/express/commandes/:id/payment-method', [ExpressOrdersController, 'updatePaymentMethod'])
  .use(middleware.auth({ guards: ['api'] }))

// Voir ses commandes (vendeur)
router
  .get('/express/commandes/vendeur', [ExpressOrdersController, 'getVendorOrders'])
  .use(middleware.auth({ guards: ['api'] }))

// Mettre à jour le statut
router
  .patch('/express/commandes/:id/status', [ExpressOrdersController, 'updateStatus'])
  .use(middleware.auth({ guards: ['api'] }))

// Upload photo du colis (vendeur)
router
  .post('/express/commandes/:id/upload-package-photo', [ExpressOrdersController, 'uploadPackagePhoto'])
  .use(middleware.auth({ guards: ['api'] }))

// Liste des livraisons disponibles (livreur)
router
  .get('/express/livraison/disponibles', [ExpressOrdersController, 'getAvailableDeliveries'])
  .use(middleware.auth({ guards: ['api'] }))

// Prendre une livraison (livreur)
router
  .post('/express/livraison/:id/take', [ExpressOrdersController, 'takeDelivery'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE EXPRESS ORDERS
// ============================================================

// ============================================================
// MODULE ADMIN TRANSACTIONS E-COMMERCE
// ============================================================

// GET /admin/transactions/stats - Statistiques globales des transactions (admin)
// IMPORTANT: Déclaré AVANT la route avec :id
router
  .get('/admin/transactions/stats', [AdminTransactionsController, 'stats'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /admin/transactions - Lister toutes les transactions e-commerce avec moyen de paiement (admin)
router
  .get('/admin/transactions', [AdminTransactionsController, 'index'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /admin/transactions/:id - Détail d'une transaction (admin)
router
  .get('/admin/transactions/:id', [AdminTransactionsController, 'show'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE ADMIN TRANSACTIONS
// ============================================================

// ============================================================
// MODULE ADMIN USERS (GESTION UTILISATEURS DEPUIS DASHBOARD)
// ============================================================

const AdminUsersController = () => import('#controllers/admin_users_controller')

// POST /admin/users - Créer un utilisateur (admin, acheteur, vendeur, livreur)
router
  .post('/admin/users', [AdminUsersController, 'createUser'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /admin/users - Lister tous les utilisateurs (avec pagination, filtres, recherche)
router
  .get('/admin/users', [AdminUsersController, 'listUsers'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /admin/users/:id - Détails d'un utilisateur
router
  .get('/admin/users/:id', [AdminUsersController, 'getUserById'])
  .use(middleware.auth({ guards: ['api'] }))

// PUT /admin/users/:id - Modifier un utilisateur
router
  .put('/admin/users/:id', [AdminUsersController, 'updateUser'])
  .use(middleware.auth({ guards: ['api'] }))

// PATCH /admin/users/:id/status - Changer le statut d'un utilisateur
router
  .patch('/admin/users/:id/status', [AdminUsersController, 'toggleStatus'])
  .use(middleware.auth({ guards: ['api'] }))

// DELETE /admin/users/:id - Supprimer un utilisateur (soft delete)
router
  .delete('/admin/users/:id', [AdminUsersController, 'deleteUser'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE ADMIN USERS
// ============================================================

// ============================================================
// MODULE MOYENS DE PAIEMENT VENDEUR
// ============================================================

// Endpoint temporaire pour créer la table payment_methods
router.get('/payment-methods/create-table', [PaymentMethodsController, 'createTable'])

// POST /payment-methods - Ajouter un moyen de paiement (vendeur)
router
  .post('/payment-methods', [PaymentMethodsController, 'store'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /payment-methods/vendeur/:vendeurId - Récupérer les moyens de paiement actifs d'un vendeur (pour acheteurs)
router
  .get('/payment-methods/vendeur/:vendeurId', [PaymentMethodsController, 'getByVendeurId'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /payment-methods - Récupérer tous les moyens de paiement du vendeur connecté
router
  .get('/payment-methods', [PaymentMethodsController, 'index'])
  .use(middleware.auth({ guards: ['api'] }))

// PUT /payment-methods/:id - Modifier un moyen de paiement
router
  .put('/payment-methods/:id', [PaymentMethodsController, 'update'])
  .use(middleware.auth({ guards: ['api'] }))

// DELETE /payment-methods/:id - Supprimer un moyen de paiement
router
  .delete('/payment-methods/:id', [PaymentMethodsController, 'destroy'])
  .use(middleware.auth({ guards: ['api'] }))

// PATCH /payment-methods/:id/activate - Activer un moyen de paiement
router
  .patch('/payment-methods/:id/activate', [PaymentMethodsController, 'activate'])
  .use(middleware.auth({ guards: ['api'] }))

// PATCH /payment-methods/:id/deactivate - Désactiver un moyen de paiement
router
  .patch('/payment-methods/:id/deactivate', [PaymentMethodsController, 'deactivate'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /payment-methods/templates - Récupérer tous les moyens de paiement disponibles (templates)
router.get('/payment-methods/templates', [PaymentMethodsController, 'getTemplates'])

// POST /payment-methods/activate-template - Activer un template avec un numéro de compte (vendeur)
router
  .post('/payment-methods/activate-template', [PaymentMethodsController, 'activateTemplate'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE MOYENS DE PAIEMENT VENDEUR
// ============================================================

// Route temporaire pour créer la table promotions (GET pour faciliter avec curl)
const MigrationController = () => import('#controllers/migration_controller')
router.get('/migration/create-promotions-table', [MigrationController, 'createPromotionsTable'])

// ============================================================
// MODULE COMMANDE EXPRESS (INDÉPENDANT)
// ============================================================

const CommandeExpressController = () => import('#controllers/commande_express_controller')

// Endpoint temporaire pour créer la table commande_express
router.get('/commande-express/create-table', [CommandeExpressController, 'createTable'])

// Endpoint temporaire pour ajouter la colonne vendor_id
router.get('/commande-express/add-vendor-column', [CommandeExpressController, 'addVendorColumn'])

// DEBUG ENDPOINT - Test raw SQL update
router.get('/commande-express/debug-update/:id', [CommandeExpressController, 'debugUpdate'])



// POST /commande-express/create - Créer une commande express avec déduction de stock
router
  .post('/commande-express/create', [CommandeExpressController, 'create'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /commande-express/list - Lister toutes les commandes express (avec pagination)
router
  .get('/commande-express/list', [CommandeExpressController, 'list'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /commande-express/mes-commandes - Mes commandes express (client connecté)
router
  .get('/commande-express/mes-commandes', [CommandeExpressController, 'mesCommandes'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /commande-express/livreur/disponibles - Commandes disponibles pour les livreurs
router
  .get('/commande-express/livreur/disponibles', [CommandeExpressController, 'disponiblesPourLivreur'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /commande-express/livreur/mes-livraisons - Mes livraisons (livreur connecté)
router
  .get('/commande-express/livreur/mes-livraisons', [CommandeExpressController, 'mesLivraisons'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /commande-express/vendeur/mes-commandes - Mes commandes express (vendeur connecté)
router
  .get('/commande-express/vendeur/mes-commandes', [CommandeExpressController, 'mesCommandesVendeur'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /commande-express/:id - Détails d'une commande express
router
  .get('/commande-express/:id', [CommandeExpressController, 'show'])
  .use(middleware.auth({ guards: ['api'] }))

// PATCH /commande-express/:id/status - Modifier le statut d'une commande
router
  .patch('/commande-express/:id/status', [CommandeExpressController, 'updateStatus'])
  .use(middleware.auth({ guards: ['api'] }))

// PATCH /commande-express/:id/assign-livreur - Assigner un livreur
router
  .patch('/commande-express/:id/assign-livreur', [CommandeExpressController, 'assignLivreur'])
  .use(middleware.auth({ guards: ['api'] }))

// DELETE /commande-express/:id - Supprimer une commande et restaurer le stock
router
  .delete('/commande-express/:id', [CommandeExpressController, 'delete'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE COMMANDE EXPRESS
// ============================================================

// ============================================================
// MODULE CLIENT EXPRESS (GESTION DES CLIENTS)
// ============================================================

const ClientExpressController = () => import('#controllers/client_express_controller')

// Endpoint temporaire pour créer la table client_express
router.get('/client-express/create-table', [ClientExpressController, 'createTable'])

// Endpoint pour ajouter les colonnes d'adresse structurée
router.get('/client-express/add-address-columns', [ClientExpressController, 'addAddressColumns'])

// POST /client-express/create - Créer un nouveau client express
router
  .post('/client-express/create', [ClientExpressController, 'create'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /client-express/list - Lister tous les clients du vendeur (avec pagination et recherche)
router
  .get('/client-express/list', [ClientExpressController, 'list'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /client-express/search-by-phone - Rechercher un client par téléphone
router
  .get('/client-express/search-by-phone', [ClientExpressController, 'searchByPhone'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /client-express/:id - Détails d'un client express
router
  .get('/client-express/:id', [ClientExpressController, 'show'])
  .use(middleware.auth({ guards: ['api'] }))

// PUT /client-express/:id - Modifier un client express
router
  .put('/client-express/:id', [ClientExpressController, 'update'])
  .use(middleware.auth({ guards: ['api'] }))

// DELETE /client-express/:id - Supprimer un client express
router
  .delete('/client-express/:id', [ClientExpressController, 'delete'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE CLIENT EXPRESS
// ============================================================

// ============================================================
// MODULE LOCATIONS (PAYS, PROVINCES, VILLES, COMMUNES)
// ============================================================

const LocationsController = () => import('#controllers/locations_controller')

// GET /locations/pays - Liste de tous les pays
router.get('/locations/pays', [LocationsController, 'getPays'])

// GET /locations/provinces?paysId=1 - Liste des provinces (filtrable par paysId)
router.get('/locations/provinces', [LocationsController, 'getProvinces'])

// GET /locations/villes?provinceId=1 - Liste des villes (filtrable par provinceId)
router.get('/locations/villes', [LocationsController, 'getVilles'])

// GET /locations/communes?villeId=1 - Liste des communes (filtrable par villeId)
router.get('/locations/communes', [LocationsController, 'getCommunes'])

// ============================================================
// FIN MODULE LOCATIONS
// ============================================================

// ============================================================
// MODULE STATISTIQUES VENDEUR
// ============================================================

const StatistiquesVendeurController = () => import('#controllers/statistiques_vendeur_controller')

// GET /statistiques/vendeur/express - Stats ventes commandes express du vendeur connecté
router
  .get('/statistiques/vendeur/express', [StatistiquesVendeurController, 'statsCommandeExpress'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /statistiques/vendeur/ecommerce - Stats ventes commandes normales du vendeur connecté
router
  .get('/statistiques/vendeur/ecommerce', [StatistiquesVendeurController, 'statsCommandeEcommerce'])
  .use(middleware.auth({ guards: ['api'] }))

// GET /statistiques/vendeur/global - Résumé combiné express + ecommerce du vendeur connecté
router
  .get('/statistiques/vendeur/global', [StatistiquesVendeurController, 'statsGlobal'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE STATISTIQUES VENDEUR
// ============================================================

// ============================================================
// MODULE STATISTIQUES LIVREUR
// ============================================================

const StatistiquesLivreurController = () => import('#controllers/statistiques_livreur_controller')

// GET /statistiques/livreur/global - Résumé combiné express + ecommerce du livreur connecté
router
  .get('/statistiques/livreur/global', [StatistiquesLivreurController, 'statsGlobal'])
  .use(middleware.auth({ guards: ['api'] }))

// ============================================================
// FIN MODULE STATISTIQUES LIVREUR
// ============================================================
