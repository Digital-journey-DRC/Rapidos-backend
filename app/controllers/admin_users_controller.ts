import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { UserRole } from '../Enum/user_role.js'
import { UserStatus } from '../Enum/user_status.js'
import {
  adminCreateUserValidator,
  adminUpdateUserValidator,
  adminToggleStatusValidator,
} from '#validators/admin_users'

export default class AdminUsersController {
  /**
   * Vérifier que l'utilisateur connecté est admin ou superadmin
   */
  private isAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN || user.role === UserRole.SuperAdmin
  }

  /**
   * POST /admin/users
   * Créer un utilisateur depuis le dashboard admin
   * Le compte est créé directement en status "active" (pas d'OTP)
   */
  async createUser({ request, response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent créer des utilisateurs',
          status: 403,
        })
      }

      const payload = await request.validateUsing(adminCreateUserValidator)

      const user = await User.create({
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        role: payload.role,
        userStatus: payload.userStatus || UserStatus.ACTIVE,
        termsAccepted: true,
      })

      logger.info(`[AdminUsers] Utilisateur créé par admin #${currentUser.id}`, {
        newUserId: user.id,
        role: user.role,
      })

      return response.created({
        success: true,
        message: 'Utilisateur créé avec succès',
        status: 201,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          userStatus: user.userStatus,
          createdAt: user.createdAt,
        },
      })
    } catch (err) {
      if (err.code === 'E_VALIDATION_ERROR') {
        logger.warn('[AdminUsers] Erreur de validation lors de la création', err.messages)
        return response.status(422).json({
          success: false,
          message: 'Données invalides',
          errors: err.messages,
          status: 422,
        })
      }

      logger.error('[AdminUsers] Erreur lors de la création utilisateur', {
        message: err.message,
        stack: err.stack,
      })

      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }

  /**
   * GET /admin/users
   * Lister tous les utilisateurs avec pagination et filtres
   *
   * Query params:
   *  - page (default 1)
   *  - limit (default 20)
   *  - role (optionnel) : filtrer par rôle (admin, vendeur, acheteur, livreur, superadmin)
   *  - status (optionnel) : filtrer par statut (active, inactive, banned, pending, suspended, deleted)
   *  - search (optionnel) : recherche par nom, prénom, email ou téléphone
   */
  async listUsers({ request, response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent lister les utilisateurs',
          status: 403,
        })
      }

      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const role = request.input('role')
      const status = request.input('status')
      const search = request.input('search')

      let query = User.query().orderBy('created_at', 'desc')

      if (role) {
        query = query.where('role', role)
      }

      if (status) {
        query = query.where('user_status', status)
      }

      if (search) {
        query = query.where((builder) => {
          builder
            .whereILike('first_name', `%${search}%`)
            .orWhereILike('last_name', `%${search}%`)
            .orWhereILike('email', `%${search}%`)
            .orWhereILike('phone', `%${search}%`)
        })
      }

      const users = await query.paginate(page, limit)

      return response.ok({
        success: true,
        status: 200,
        data: users.all().map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          userStatus: u.userStatus,
          latitude: u.latitude,
          longitude: u.longitude,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
        meta: users.getMeta(),
      })
    } catch (err) {
      logger.error('[AdminUsers] Erreur lors du listing', {
        message: err.message,
        stack: err.stack,
      })

      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }

  /**
   * GET /admin/users/:id
   * Détails d'un utilisateur
   */
  async getUserById({ params, response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent voir les détails utilisateur',
          status: 403,
        })
      }

      const user = await User.find(params.id)

      if (!user) {
        return response.notFound({
          success: false,
          message: 'Utilisateur non trouvé',
          status: 404,
        })
      }

      // Charger les relations disponibles (sans bloquer si table absente)
      let profil = null
      let adresses: any[] = []
      let wallet = null

      try {
        await user.load('profil')
        profil = user.profil || null
      } catch (_e) {
        // Table profil absente ou erreur de relation
      }

      try {
        await user.load('adresses')
        adresses = user.adresses || []
      } catch (_e) {
        // Table adresses absente ou erreur de relation
      }

      try {
        await user.load('wallet')
        wallet = user.wallet || null
      } catch (_e) {
        // Table wallet absente ou erreur de relation
      }

      return response.ok({
        success: true,
        status: 200,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          userStatus: user.userStatus,
          latitude: user.latitude,
          longitude: user.longitude,
          termsAccepted: user.termsAccepted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profil,
          adresses,
          wallet,
        },
      })
    } catch (err) {
      logger.error('[AdminUsers] Erreur lors de la récupération utilisateur', {
        message: err.message,
        stack: err.stack,
      })

      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }

  /**
   * PUT /admin/users/:id
   * Modifier un utilisateur
   */
  async updateUser({ params, request, response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent modifier des utilisateurs',
          status: 403,
        })
      }

      const user = await User.find(params.id)

      if (!user) {
        return response.notFound({
          success: false,
          message: 'Utilisateur non trouvé',
          status: 404,
        })
      }

      const payload = await request.validateUsing(adminUpdateUserValidator)

      // Vérifier unicité email si modifié
      if (payload.email && payload.email !== user.email) {
        const existingEmail = await User.query()
          .where('email', payload.email)
          .whereNot('id', user.id)
          .first()
        if (existingEmail) {
          return response.conflict({
            success: false,
            message: 'Cet email est déjà utilisé par un autre compte',
            status: 409,
          })
        }
      }

      // Vérifier unicité téléphone si modifié
      if (payload.phone && payload.phone !== user.phone) {
        const existingPhone = await User.query()
          .where('phone', payload.phone)
          .whereNot('id', user.id)
          .first()
        if (existingPhone) {
          return response.conflict({
            success: false,
            message: 'Ce numéro de téléphone est déjà utilisé par un autre compte',
            status: 409,
          })
        }
      }

      // Appliquer les modifications
      if (payload.firstName) user.firstName = payload.firstName
      if (payload.lastName) user.lastName = payload.lastName
      if (payload.email) user.email = payload.email
      if (payload.phone) user.phone = payload.phone
      if (payload.role) user.role = payload.role
      if (payload.userStatus) user.userStatus = payload.userStatus

      await user.save()

      logger.info(`[AdminUsers] Utilisateur #${user.id} modifié par admin #${currentUser.id}`)

      return response.ok({
        success: true,
        message: 'Utilisateur modifié avec succès',
        status: 200,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          userStatus: user.userStatus,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
    } catch (err) {
      if (err.code === 'E_VALIDATION_ERROR') {
        logger.warn('[AdminUsers] Erreur de validation lors de la mise à jour', err.messages)
        return response.status(422).json({
          success: false,
          message: 'Données invalides',
          errors: err.messages,
          status: 422,
        })
      }

      logger.error('[AdminUsers] Erreur lors de la modification utilisateur', {
        message: err.message,
        stack: err.stack,
      })

      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }

  /**
   * PATCH /admin/users/:id/status
   * Changer le statut d'un utilisateur (activer, désactiver, bannir, suspendre...)
   */
  async toggleStatus({ params, request, response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent modifier le statut',
          status: 403,
        })
      }

      const user = await User.find(params.id)

      if (!user) {
        return response.notFound({
          success: false,
          message: 'Utilisateur non trouvé',
          status: 404,
        })
      }

      // Empêcher un admin de se désactiver lui-même
      if (user.id === currentUser.id) {
        return response.badRequest({
          success: false,
          message: 'Vous ne pouvez pas modifier votre propre statut',
          status: 400,
        })
      }

      const payload = await request.validateUsing(adminToggleStatusValidator)

      const oldStatus = user.userStatus
      user.userStatus = payload.userStatus
      await user.save()

      logger.info(
        `[AdminUsers] Statut utilisateur #${user.id} changé de ${oldStatus} à ${payload.userStatus} par admin #${currentUser.id}`
      )

      return response.ok({
        success: true,
        message: `Statut de l'utilisateur modifié de "${oldStatus}" à "${payload.userStatus}"`,
        status: 200,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          oldStatus,
          newStatus: user.userStatus,
        },
      })
    } catch (err) {
      if (err.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          success: false,
          message: 'Données invalides',
          errors: err.messages,
          status: 422,
        })
      }

      logger.error('[AdminUsers] Erreur lors du changement de statut', {
        message: err.message,
        stack: err.stack,
      })

      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }

  /**
   * DELETE /admin/users/:id
   * Supprimer un utilisateur (soft delete via status "deleted")
   */
  async deleteUser({ params, response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent supprimer des utilisateurs',
          status: 403,
        })
      }

      const user = await User.find(params.id)

      if (!user) {
        return response.notFound({
          success: false,
          message: 'Utilisateur non trouvé',
          status: 404,
        })
      }

      // Empêcher un admin de se supprimer lui-même
      if (user.id === currentUser.id) {
        return response.badRequest({
          success: false,
          message: 'Vous ne pouvez pas supprimer votre propre compte',
          status: 400,
        })
      }

      // Empêcher de supprimer un superadmin (sauf si on est superadmin)
      if (user.role === UserRole.SuperAdmin && currentUser.role !== UserRole.SuperAdmin) {
        return response.forbidden({
          success: false,
          message: 'Seul un superadmin peut supprimer un compte superadmin',
          status: 403,
        })
      }

      // Soft delete : on passe le statut à "deleted"
      user.userStatus = UserStatus.DELETED
      await user.save()

      logger.info(`[AdminUsers] Utilisateur #${user.id} supprimé (soft) par admin #${currentUser.id}`)

      return response.ok({
        success: true,
        message: 'Utilisateur supprimé avec succès',
        status: 200,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          userStatus: user.userStatus,
        },
      })
    } catch (err) {
      logger.error('[AdminUsers] Erreur lors de la suppression', {
        message: err.message,
        stack: err.stack,
      })

      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }

  /**
   * PATCH /admin/livreurs/:id/communes
   * Assigner une ou plusieurs communes à un livreur
   * Body: { "communes": ["Gombe", "Kalamu"] }
   * Si communes est un tableau vide [], le livreur voit toutes les commandes (aucune restriction)
   */
  async assignCommunes({ params, request, response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent assigner des communes',
          status: 403,
        })
      }

      const user = await User.find(params.id)

      if (!user) {
        return response.notFound({
          success: false,
          message: 'Utilisateur non trouvé',
          status: 404,
        })
      }

      if (user.role !== UserRole.Livreur) {
        return response.badRequest({
          success: false,
          message: 'Cet utilisateur n\'est pas un livreur',
          status: 400,
        })
      }

      const communes = request.input('communes')

      if (!Array.isArray(communes)) {
        return response.badRequest({
          success: false,
          message: 'Le champ "communes" doit être un tableau (ex: ["Gombe", "Kalamu"])',
          status: 400,
        })
      }

      // Nettoyer et dédupliquer les communes
      const communesPropres = [...new Set(
        communes
          .filter((c) => typeof c === 'string' && c.trim().length > 0)
          .map((c) => c.trim())
      )]

      user.communes = communesPropres
      await user.save()

      logger.info(
        `[AdminUsers] Communes assignées au livreur #${user.id} par admin #${currentUser.id}`,
        { communes: communesPropres }
      )

      return response.ok({
        success: true,
        message: communesPropres.length === 0
          ? 'Restrictions supprimées : le livreur voit toutes les commandes'
          : `${communesPropres.length} commune(s) assignée(s) au livreur`,
        status: 200,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          statut: user.userStatus,
          communes: user.communes,
          nbCommunes: user.communes.length,
          updatedAt: user.updatedAt,
        },
      })
    } catch (err) {
      logger.error('[AdminUsers] Erreur lors de l\'assignation des communes', {
        message: err.message,
        stack: err.stack,
      })

      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }

  async listLivreurs({ response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Accès réservé aux administrateurs',
          status: 403,
        })
      }

      const livreurs = await User.query()
        .where('role', UserRole.Livreur)
        .orderBy('id', 'asc')
        .select('id', 'first_name', 'last_name', 'phone', 'email', 'user_status', 'communes')

      return response.ok({
        success: true,
        message: `${livreurs.length} livreur(s) trouvé(s)`,
        status: 200,
        data: livreurs.map((l) => ({
          id: l.id,
          firstName: l.firstName,
          lastName: l.lastName,
          phone: l.phone,
          email: l.email,
          statut: l.userStatus,
          communes: l.communes ?? [],
          nbCommunes: (l.communes ?? []).length,
        })),
      })
    } catch (err) {
      logger.error('[AdminUsers] Erreur listLivreurs', { message: err.message })
      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }

  async getLivreurById({ params, response, auth }: HttpContext) {
    try {
      const currentUser = auth.user!

      if (!this.isAdmin(currentUser)) {
        return response.forbidden({
          success: false,
          message: 'Accès réservé aux administrateurs',
          status: 403,
        })
      }

      const livreur = await User.query()
        .where('id', params.id)
        .where('role', UserRole.Livreur)
        .select('id', 'first_name', 'last_name', 'phone', 'email', 'user_status', 'communes', 'latitude', 'longitude', 'created_at', 'updated_at')
        .first()

      if (!livreur) {
        return response.notFound({
          success: false,
          message: 'Livreur non trouvé',
          status: 404,
        })
      }

      return response.ok({
        success: true,
        status: 200,
        data: {
          id: livreur.id,
          firstName: livreur.firstName,
          lastName: livreur.lastName,
          phone: livreur.phone,
          email: livreur.email,
          statut: livreur.userStatus,
          latitude: livreur.latitude,
          longitude: livreur.longitude,
          communes: livreur.communes ?? [],
          nbCommunes: (livreur.communes ?? []).length,
          createdAt: livreur.createdAt,
          updatedAt: livreur.updatedAt,
        },
      })
    } catch (err) {
      logger.error('[AdminUsers] Erreur getLivreurById', { message: err.message })
      return response.internalServerError({
        success: false,
        message: 'Erreur interne du serveur',
        status: 500,
        error: err.message,
      })
    }
  }
}
