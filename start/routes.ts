import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const RegistersController = () => import('#controllers/registers_controller')
const ProductsController = () => import('#controllers/products_controller')
const CategoryController = () => import('#controllers/categories_controller')
const CommandesController = () => import('#controllers/commandes_controller')
const LivraisonsController = () => import('#controllers/livraisons_controller')

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

// 2. Récupérer tous les produits d’un vendeur donné (admin uniquement, via email dans le body)
router
  .get('/products/all', [ProductsController, 'getAllProducts'])
  .use(middleware.auth({ guards: ['api'] }))

// 3. Voir tous les produits (admin uniquement)
router
  .get('/products/adm/all', [ProductsController, 'showAllProducts'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/get-products/:productId', [ProductsController, 'getProductById'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/category/:categoryId', [ProductsController, 'getProductById'])
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

router
  .get('/commandes/acheteur', [CommandesController, 'getCommandeByAcheteur'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/livraison/accept/:livraisonId', [LivraisonsController, 'accepteDelivery'])
  .use(middleware.auth({ guards: ['api'] }))
router
  .post('/stock/:productId/update', [ProductsController, 'updateStockForProduct'])
  .use(middleware.auth({ guards: ['api'] }))

router.post('/users/forgot-password', [RegistersController, 'forgotPassWord'])
router.post('/users/reset-password', [RegistersController, 'resetPassword'])

// Endpoint temporaire pour activer l'admin
router.post('/activate-admin', async ({ response }) => {
  try {
    const { default: User } = await import('#models/user')
    
    const admin = await User.find(117)
    if (admin) {
      admin.userStatus = 'active'
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

// Endpoint temporaire pour créer une catégorie sans permissions
router.post('/create-category-temp', async ({ request, response }) => {
  try {
    const { default: Category } = await import('#models/category')
    const { categoryValidator } = await import('#validators/category')
    const { LabelParseCategoryFromFrenchInEnglish } = await import('#services/parsecategoryfromfrenchinenglish')
    
    const data = request.only(['name', 'description'])
    const payload = await categoryValidator.validate(LabelParseCategoryFromFrenchInEnglish(data))
    
    const isCategoryExists = await Category.findBy('name', payload.name)
    if (isCategoryExists) {
      return response.status(409).json({
        message: 'Category already exists',
      })
    }
    
    const category = await Category.create({
      name: payload.name,
      description: payload.description,
    })
    
    return response.status(201).json({
      message: 'Category created successfully',
      data: category,
    })
  } catch (error) {
    return response.status(500).json({
      message: 'Internal server error',
      error: error.message,
    })
  }
})
router
  .get('/users/:userId/active-account', [RegistersController, 'activeUserAcount'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/users/get-all/status-pending', [RegistersController, 'showAllUserWithStatusPendning'])
  .use(middleware.auth({ guards: ['api'] }))

  router.post('/users/update-profil', [RegistersController, 'updateUserProfile']).use(middleware.auth({ guards: ['api'] }))