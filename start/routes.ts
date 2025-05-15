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

/**
 * @swagger
 * /users/editable-fields/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Récupérer les champs modifiables pour la mise à jour
 *     operationId: getUserEditableFields
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur cible
 *     responses:
 *       200:
 *         description: Champs récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   description: Champs modifiables selon le rôle
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur introuvable
 *       500:
 *         description: Erreur interne
 */

router
  .get('/users/editables-fields/:userId', [RegistersController, 'sendDataForUpdate'])
  .use(middleware.auth({ guards: ['api'] }))

/**
 * @swagger
 * /users/update/{userId}:
 *   post:
 *     tags:
 *       - Users
 *     summary: Mettre à jour un utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur cible
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phone
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 example: Dupont
 *               phone:
 *                 type: string
 *                 example: "0612345678"
 *               password:
 *                 type: string
 *                 example: MonMotDePasse123!
 *               email:
 *                 type: string
 *                 example: utilisateur@example.com
 *               role:
 *                 type: string
 *                 example: client
 *               termsAccepted:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur mis à jour avec succès"
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *       400:
 *         description: Données invalides
 *       403:
 *         description: Non autorisé à modifier cet utilisateur
 *       404:
 *         description: Utilisateur introuvable
 *       500:
 *         description: Erreur interne
 */
router
  .post('/users/update/:userId', [RegistersController, 'updateUser'])
  .use(middleware.auth({ guards: ['api'] }))

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Récupérer l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utilisateur récupéré avec succès
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       500:
 *         description: Erreur interne
 */
router.get('/users/me', [RegistersController, 'getUser']).use(middleware.auth({ guards: ['api'] }))

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Récupérer tous les utilisateurs (admin ou superadmin seulement)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateurs récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utilisateurs récupérés avec succès
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur interne
 */

router.get('/users', [RegistersController, 'getAllUsers']).use(middleware.auth({ guards: ['api'] }))

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Récupérer un utilisateur par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à récupérer
 *     responses:
 *       200:
 *         description: Utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utilisateur récupéré avec succès
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Utilisateur introuvable
 *       500:
 *         description: Erreur interne
 */

router
  .get('/users/:userId', [RegistersController, 'getUserById'])
  .use(middleware.auth({ guards: ['api'] }))

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Supprimer un utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *       403:
 *         description: Vous ne pouvez pas supprimer votre propre compte
 *       404:
 *         description: Utilisateur introuvable
 *       500:
 *         description: Erreur interne
 */

router
  .delete('/users/:userId', [RegistersController, 'deleteUser'])
  .use(middleware.auth({ guards: ['api'] }))
