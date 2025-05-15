import router from '@adonisjs/core/services/router';
import { middleware } from './kernel.js';
const RegistersController = () => import('#controllers/registers_controller');
router.get('/', async () => {
    return {
        hello: 'world',
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
//# sourceMappingURL=routes.js.map