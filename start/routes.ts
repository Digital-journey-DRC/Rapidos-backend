import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const RegistersController = () => import('#controllers/registers_controller')

/**
 * @swagger
 * /:
 *   get:
 *     summary: Vérifie que l’API fonctionne
 *     responses:
 *       200:
 *         description: API opérationnelle
 */
router.get('/', async () => {
  return {
    hello: 'world',
  }
})

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Enregistrement d’un utilisateur
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - phone
 *               - role
 *               - termsAccepted
 *             properties:
 *               email:
 *                 type: string
 *                 example: utilisateur@example.com
 *               password:
 *                 type: string
 *                 example: monMotDePasse123
 *               firstName:
 *                 type: string
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 example: Dupont
 *               phone:
 *                 type: string
 *                 example: "+2250700000000"
 *               role:
 *                 type: string
 *                 example: client
 *               termsAccepted:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Utilisateur enregistré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: integer
 *                 id:
 *                   type: string
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur interne
 */
router.post('/register', [RegistersController, 'register'])

/**
 * @swagger
 * /verify-otp/{userId}:
 *   post:
 *     summary: Vérifie le code OTP d’un utilisateur
 *     tags:
 *       - Authentification
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l’utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: bearer
 *                 value:
 *                   type: string
 *                   description: Jeton JWT
 *                 expiresIn:
 *                   type: string
 *                 userId:
 *                   type: string
 *       400:
 *         description: Code OTP invalide
 *       404:
 *         description: Utilisateur introuvable
 *       500:
 *         description: Erreur interne
 */
router.post('/verify-otp/:userId', [RegistersController, 'verifyOtp'])

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authentification d’un utilisateur
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: utilisateur@example.com
 *               password:
 *                 type: string
 *                 example: MonMotDePasse123!
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: bearer
 *                 value:
 *                   type: string
 *                   description: Jeton JWT
 *                 expiresIn:
 *                   type: string
 *                   example: 2025-12-31T23:59:59.000Z
 *                 userId:
 *                   type: string
 *                   example: "abc123"
 *       400:
 *         description: Identifiants invalides
 *       404:
 *         description: Utilisateur introuvable
 *       500:
 *         description: Erreur interne
 */

router.post('/login', [RegistersController, 'login'])

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Déconnexion d’un utilisateur
 *     tags:
 *       - Authentification
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Non autorisé
 */
router.get('/logout', [RegistersController]).use(middleware.auth({ guards: ['api'] }))
