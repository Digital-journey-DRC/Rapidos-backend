import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const RegistersController = () => import('#controllers/registers_controller')
const ProductsController = () => import('#controllers/products_controller')

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
  .post('/products/admin/by-email', [ProductsController, 'getAllProductsForAdmin'])
  .use(middleware.auth({ guards: ['api'] }))

// 3. Voir tous les produits (admin uniquement)
router
  .get('/products/admin/all', [ProductsController, 'showAllProducts'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/get-products/:productId', [ProductsController, 'getProductById'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/category/:categoryId', [ProductsController, 'getProductById'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/all-products', [ProductsController, 'showAllProducts'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .get('/products/update/:productId', [ProductsController, 'updateProduct'])
  .use(middleware.auth({ guards: ['api'] }))

router
  .delete('/products/:productId', [ProductsController, 'deleteProduct'])
  .use(middleware.auth({ guards: ['api'] }))
