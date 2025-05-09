/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const authController = () => import('#controllers/registers_controller')
const swagger = () => import('#controllers/swaggers_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/register', [authController, 'register'])
router.post('/verify-otp/:userId', [authController, 'verifyOtp'])
router.get('/docs', [swagger, 'show'])
