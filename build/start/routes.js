import router from '@adonisjs/core/services/router';
import { middleware } from './kernel.js';
const RegistersController = () => import('#controllers/registers_controller');
const ProductsController = () => import('#controllers/products_controller');
const CategoryController = () => import('#controllers/categories_controller');
const CommandesController = () => import('#controllers/commandes_controller');
const LivraisonsController = () => import('#controllers/livraisons_controller');
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yamljs';
router.get('/docs', async ({ response }) => {
    const swaggerHtml = readFileSync(join(import.meta.dirname, '../resources/swagger.html'), 'utf-8');
    return response.type('text/html').send(swaggerHtml);
});
router.get('/swagger.json', async ({ response }) => {
    const swaggerDocument = YAML.load(join(import.meta.dirname, '../docs/swagger.yaml'));
    return response.json(swaggerDocument);
});
router.get('/', async () => {
    return {
        hello: 'hello wellcome rapidos api',
    };
});
router.post('/register', [RegistersController, 'register']);
router.post('/verify-otp/:userId', [RegistersController, 'verifyOtp']);
router.post('/login', [RegistersController, 'login']);
router.get('/logout', [RegistersController]).use(middleware.auth({ guards: ['api'] }));
router
    .get('/users/editables-fields/:userId', [RegistersController, 'sendDataForUpdate'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .post('/users/update/:userId', [RegistersController, 'updateUser'])
    .use(middleware.auth({ guards: ['api'] }));
router.get('/users/me', [RegistersController, 'getUser']).use(middleware.auth({ guards: ['api'] }));
router.get('/users', [RegistersController, 'getAllUsers']).use(middleware.auth({ guards: ['api'] }));
router
    .get('/users/:userId', [RegistersController, 'getUserById'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .delete('/users/:userId', [RegistersController, 'deleteUser'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .post('/products/store', [ProductsController, 'store'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/products/boutique/:userId', [ProductsController, 'getAllProductByUser'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/products/all', [ProductsController, 'getAllProducts'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/products/adm/all', [ProductsController, 'showAllProducts'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/products/get-products/:productId', [ProductsController, 'getProductById'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/products/category/:categoryId', [ProductsController, 'getProductById'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/category/get-all', [CategoryController, 'getAllCategory'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/products/all-products', [ProductsController, 'showAllProducts'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .post('/products/update/:productId', [ProductsController, 'updateProduct'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .delete('/products/:productId', [ProductsController, 'deleteProduct'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .post('/category/store', [CategoryController, 'createCategory'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .delete('/category/delete/:categoryId', [CategoryController, 'deleteCategory'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .post('/commandes/store', [CommandesController, 'createCommande'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/commandes/vendeur', [CommandesController, 'getCommandesByUser'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/livraison/ma-liste', [LivraisonsController, 'showAllDelivery'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/vendeurs', [ProductsController, 'getVendeurAndTheirProducts'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/commandes/acheteur', [CommandesController, 'getCommandeByAcheteur'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/livraison/accept/:livraisonId', [LivraisonsController, 'accepteDelivery'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .post('/stock/:productId/update', [ProductsController, 'updateStockForProduct'])
    .use(middleware.auth({ guards: ['api'] }));
router.post('/users/forgot-password', [RegistersController, 'forgotPassWord']);
router.post('/users/reset-password', [RegistersController, 'resetPassword']);
router
    .get('/users/:userId/active-account', [RegistersController, 'activeUserAcount'])
    .use(middleware.auth({ guards: ['api'] }));
router
    .get('/users/get-all/status-pending', [RegistersController, 'showAllUserWithStatusPendning'])
    .use(middleware.auth({ guards: ['api'] }));
//# sourceMappingURL=routes.js.map