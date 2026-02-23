import type { HttpContext } from '@adonisjs/core/http'
import ClientExpress from '#models/client_express'
import { createClientExpressValidator, updateClientExpressValidator } from '#validators/client_express'
import db from '@adonisjs/lucid/services/db'

export default class ClientExpressController {
  /**
   * Endpoint temporaire pour créer la table client_express
   */
  async createTable({ response }: HttpContext) {
    try {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS client_express (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          email VARCHAR(255),
          default_address TEXT,
          default_reference VARCHAR(255),
          vendor_id INTEGER NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_client_express_vendor_id ON client_express(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_client_express_phone ON client_express(phone);
      `)

      return response.status(201).json({
        success: true,
        message: 'Table client_express créée avec succès',
      })
    } catch (error) {
      console.error('Erreur lors de la création de la table client_express:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la table',
        error: error.message,
      })
    }
  }

  /**
   * Créer un nouveau client express
   * POST /client-express/create
   */
  async create({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(createClientExpressValidator)

      // Vérifier que le vendorId correspond à l'utilisateur connecté (sauf si admin)
      if (user.role !== 'admin' && payload.vendorId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Vous ne pouvez créer des clients que pour votre propre compte',
        })
      }

      const client = await ClientExpress.create({
        name: payload.name,
        phone: payload.phone,
        email: payload.email || null,
        defaultAddress: payload.defaultAddress || null,
        defaultReference: payload.defaultReference || null,
        vendorId: payload.vendorId,
        notes: payload.notes || null,
      })

      return response.status(201).json({
        success: true,
        message: 'Client express créé avec succès',
        data: client,
      })
    } catch (error) {
      console.error('Erreur lors de la création du client express:', error)
      if (error.messages) {
        return response.status(422).json({
          success: false,
          message: 'Validation échouée',
          errors: error.messages,
        })
      }
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la création du client',
        error: error.message,
      })
    }
  }

  /**
   * Lister tous les clients d'un vendeur
   * GET /client-express/list?page=1&limit=20&search=
   */
  async list({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const search = request.input('search', '')

      let query = ClientExpress.query()

      // Si pas admin, filtrer par vendorId
      if (user.role !== 'admin') {
        query.where('vendor_id', user.id)
      }

      // Recherche par nom ou téléphone
      if (search) {
        query.where((subQuery) => {
          subQuery.whereILike('name', `%${search}%`)
            .orWhereILike('phone', `%${search}%`)
        })
      }

      const clients = await query
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.status(200).json({
        success: true,
        data: clients,
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des clients',
        error: error.message,
      })
    }
  }

  /**
   * Obtenir les détails d'un client
   * GET /client-express/:id
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const client = await ClientExpress.find(params.id)

      if (!client) {
        return response.status(404).json({
          success: false,
          message: 'Client non trouvé',
        })
      }

      // Vérifier que le client appartient au vendeur (sauf si admin)
      if (user.role !== 'admin' && client.vendorId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Accès non autorisé à ce client',
        })
      }

      return response.status(200).json({
        success: true,
        data: client,
      })
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du client',
        error: error.message,
      })
    }
  }

  /**
   * Mettre à jour un client express
   * PUT /client-express/:id
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const client = await ClientExpress.find(params.id)

      if (!client) {
        return response.status(404).json({
          success: false,
          message: 'Client non trouvé',
        })
      }

      // Vérifier que le client appartient au vendeur (sauf si admin)
      if (user.role !== 'admin' && client.vendorId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que vos propres clients',
        })
      }

      const payload = await request.validateUsing(updateClientExpressValidator)

      // Mettre à jour uniquement les champs fournis
      if (payload.name !== undefined) client.name = payload.name
      if (payload.phone !== undefined) client.phone = payload.phone
      if (payload.email !== undefined) client.email = payload.email
      if (payload.defaultAddress !== undefined) client.defaultAddress = payload.defaultAddress
      if (payload.defaultReference !== undefined) client.defaultReference = payload.defaultReference
      if (payload.notes !== undefined) client.notes = payload.notes

      await client.save()

      return response.status(200).json({
        success: true,
        message: 'Client mis à jour avec succès',
        data: client,
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error)
      if (error.messages) {
        return response.status(422).json({
          success: false,
          message: 'Validation échouée',
          errors: error.messages,
        })
      }
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du client',
        error: error.message,
      })
    }
  }

  /**
   * Supprimer un client express
   * DELETE /client-express/:id
   */
  async delete({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const client = await ClientExpress.find(params.id)

      if (!client) {
        return response.status(404).json({
          success: false,
          message: 'Client non trouvé',
        })
      }

      // Vérifier que le client appartient au vendeur (sauf si admin)
      if (user.role !== 'admin' && client.vendorId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Vous ne pouvez supprimer que vos propres clients',
        })
      }

      await client.delete()

      return response.status(200).json({
        success: true,
        message: 'Client supprimé avec succès',
        data: {
          id: client.id,
          name: client.name,
        },
      })
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du client',
        error: error.message,
      })
    }
  }

  /**
   * Rechercher un client par téléphone
   * GET /client-express/search-by-phone?phone=+243999999999
   */
  async searchByPhone({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const phone = request.input('phone', '')

      if (!phone) {
        return response.status(400).json({
          success: false,
          message: 'Le numéro de téléphone est requis',
        })
      }

      let query = ClientExpress.query().where('phone', phone)

      // Si pas admin, filtrer par vendorId
      if (user.role !== 'admin') {
        query.where('vendor_id', user.id)
      }

      const client = await query.first()

      if (!client) {
        return response.status(404).json({
          success: false,
          message: 'Aucun client trouvé avec ce numéro',
        })
      }

      return response.status(200).json({
        success: true,
        data: client,
      })
    } catch (error) {
      console.error('Erreur lors de la recherche du client:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche',
        error: error.message,
      })
    }
  }
}
