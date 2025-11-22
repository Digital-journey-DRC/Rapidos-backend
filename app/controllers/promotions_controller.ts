import Promotion from '#models/promotion'
import Product from '#models/product'
import { createPromotionValidator, updatePromotionValidator } from '#validators/promotion'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { UserRole } from '../Enum/user_role.js'

export default class PromotionsController {
  /**
   * Crée la table promotions (endpoint temporaire)
   * GET /promotions/create-table
   */
  async createTable({ response }: HttpContext) {
    try {
      // Supprimer la table existante si elle existe
      try {
        await db.rawQuery('DROP TABLE IF EXISTS promotions CASCADE')
      } catch (error) {
        // Ignorer les erreurs si la table n'existe pas
      }

      // Créer la table avec les noms de colonnes que Lucid attend (snake_case)
      const migrationSQL = `
        CREATE TABLE promotions (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          image VARCHAR(255) NOT NULL,
          image_1 VARCHAR(255) NULL,
          image_2 VARCHAR(255) NULL,
          image_3 VARCHAR(255) NULL,
          image_4 VARCHAR(255) NULL,
          libelle VARCHAR(255) NOT NULL,
          likes INTEGER DEFAULT 0,
          delai_promotion TIMESTAMP NOT NULL,
          nouveau_prix DECIMAL(10, 2) NOT NULL,
          ancien_prix DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
      await db.rawQuery(migrationSQL)
      
      // Vérifier que la table a été créée correctement
      const checkTable = await db.rawQuery(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'promotions' 
        ORDER BY column_name;
      `)
      
      return response.ok({
        message: 'Table promotions créée avec succès!',
        status: 200,
        columns: checkTable.rows.map((row: any) => row.column_name),
      })
    } catch (error) {
      if (error.message?.includes('already exists') || error.code === '42P07') {
        return response.ok({
          message: 'La table promotions existe déjà',
          status: 200,
        })
      }

      return response.internalServerError({
        message: 'Erreur lors de la création de la table',
        error: error.message,
        status: 500,
      })
    }
  }

  /**
   * Récupère tous les produits en promotion
   * GET /promotions
   * Accessible à tous les utilisateurs authentifiés (acheteur, vendeur, etc.)
   */
  async index({ response, auth }: HttpContext) {
    try {
      // Vérifier que l'utilisateur est authentifié
      const user = auth.user!
      if (!user) {
        return response.status(401).json({
          message: "Vous devez être connecté pour voir les promotions",
        })
      }

      const promotions = await Promotion.query()
        .preload('product', (productQuery) => {
          productQuery.preload('media').preload('category').preload('vendeur')
        })
        .where('delaiPromotion', '>', new Date().toISOString())
        .orderBy('createdAt', 'desc')

      if (promotions.length === 0) {
        return response.status(404).json({ message: 'Aucune promotion trouvée' })
      }

      // Formater les données pour inclure toutes les informations requises
      const promotionsFormatted = promotions.map((promotion) => {
        const product = promotion.product
        return {
          id: promotion.id,
          productId: promotion.productId,
          // Images
          image: promotion.image,
          image1: promotion.image1,
          image2: promotion.image2,
          image3: promotion.image3,
          image4: promotion.image4,
          // Autres informations
          libelle: promotion.libelle,
          likes: promotion.likes || 0,
          delaiPromotion: promotion.delaiPromotion,
          nouveauPrix: promotion.nouveauPrix,
          ancienPrix: promotion.ancienPrix,
          // Informations du produit
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            media: product.media,
            vendeur: product.vendeur,
          },
          createdAt: promotion.createdAt,
          updatedAt: promotion.updatedAt,
        }
      })

      return response.status(200).json({
        message: 'Produits en promotion récupérés avec succès',
        promotions: promotionsFormatted,
      })
    } catch (error) {
      logger.error({
        message: 'Erreur lors de la récupération des promotions',
        error: error.message,
      })
      return response.status(500).json({
        message: 'Erreur serveur interne',
        error: error.message,
      })
    }
  }

  /**
   * Récupère une promotion spécifique par son ID
   * GET /promotions/:id
   * Accessible à tous les utilisateurs authentifiés (acheteur, vendeur, etc.)
   */
  async show({ params, response, auth }: HttpContext) {
    const { id } = params
    try {
      // Vérifier que l'utilisateur est authentifié
      const user = auth.user!
      if (!user) {
        return response.status(401).json({
          message: "Vous devez être connecté pour voir les promotions",
        })
      }

      const promotion = await Promotion.query()
        .where('id', id)
        .preload('product', (productQuery) => {
          productQuery.preload('media').preload('category').preload('vendeur')
        })
        .firstOrFail()

      const product = promotion.product
      const promotionFormatted = {
        id: promotion.id,
        productId: promotion.productId,
        image: promotion.image,
        image1: promotion.image1,
        image2: promotion.image2,
        image3: promotion.image3,
        image4: promotion.image4,
        libelle: promotion.libelle,
        likes: promotion.likes || 0,
        delaiPromotion: promotion.delaiPromotion,
        nouveauPrix: promotion.nouveauPrix,
        ancienPrix: promotion.ancienPrix,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          media: product.media,
          vendeur: product.vendeur,
        },
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
      }

      return response.status(200).json({
        message: 'Promotion récupérée avec succès',
        promotion: promotionFormatted,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({
          message: 'Promotion non trouvée',
          error: error.message,
        })
      }

      logger.error({
        message: 'Erreur lors de la récupération de la promotion',
        error: error.message,
      })
      return response.status(500).json({
        message: 'Erreur serveur interne',
        error: error.message,
      })
    }
  }

  /**
   * Crée une nouvelle promotion
   * POST /promotions
   * Accessible uniquement aux vendeurs
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      if (!user) {
        return response.status(401).json({
          message: "Vous n'êtes pas autorisé à faire cette action",
        })
      }

      // Vérifier que l'utilisateur est un vendeur
      if (user.role !== UserRole.Vendeur) {
        return response.status(403).json({
          message: "Seuls les vendeurs peuvent créer des promotions",
        })
      }

      const payload = await request.validateUsing(createPromotionValidator)

      // Vérifier que le produit existe et appartient au marchand
      const product = await Product.findOrFail(payload.productId)

      // Vérifier que le produit appartient au marchand connecté
      if (product.vendeurId !== user.id) {
        return response.status(403).json({
          message: "Vous n'êtes pas autorisé à créer une promotion pour ce produit",
        })
      }

      // Vérifier qu'il n'existe pas déjà une promotion active pour ce produit
      const existingPromotion = await Promotion.query()
        .where('productId', payload.productId)
        .where('delaiPromotion', '>', new Date().toISOString())
        .first()

      if (existingPromotion) {
        return response.status(409).json({
          message: 'Une promotion active existe déjà pour ce produit',
        })
      }

      // Vérifier que nouveau_prix < ancien_prix
      if (payload.nouveauPrix >= payload.ancienPrix) {
        return response.status(422).json({
          message: 'Le nouveau prix doit être inférieur à l\'ancien prix',
        })
      }

      const promotion = await Promotion.create({
        productId: payload.productId,
        image: payload.image,
        image1: payload.image1 || null,
        image2: payload.image2 || null,
        image3: payload.image3 || null,
        image4: payload.image4 || null,
        libelle: payload.libelle,
        likes: payload.likes || 0,
        delaiPromotion: DateTime.fromJSDate(payload.delaiPromotion),
        nouveauPrix: payload.nouveauPrix,
        ancienPrix: payload.ancienPrix,
      })

      await promotion.load('product', (productQuery) => {
        productQuery.preload('media').preload('category').preload('vendeur')
      })

      return response.created({
        message: 'Promotion créée avec succès',
        promotion,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_FAILURE' || error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({ 
          message: 'Erreur de validation',
          errors: error.messages || error.errors || error.message 
        })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({
          message: 'Produit non trouvé',
          error: error.message,
        })
      }

      logger.error({
        message: 'Erreur lors de la création de la promotion',
        error: error.message,
      })
      return response.status(500).json({
        message: 'Erreur serveur interne',
        error: error.message,
      })
    }
  }

  /**
   * Met à jour une promotion
   * PUT /promotions/:id
   * Accessible uniquement aux vendeurs
   */
  async update({ params, request, response, auth }: HttpContext) {
    const { id } = params
    try {
      const user = auth.user!
      if (!user) {
        return response.status(401).json({
          message: "Vous n'êtes pas autorisé à faire cette action",
        })
      }

      // Vérifier que l'utilisateur est un vendeur
      if (user.role !== UserRole.Vendeur) {
        return response.status(403).json({
          message: "Seuls les vendeurs peuvent modifier des promotions",
        })
      }

      const promotion = await Promotion.findOrFail(id)

      await promotion.load('product')

      // Vérifier que le produit appartient au vendeur connecté
      if (promotion.product.vendeurId !== user.id) {
        return response.status(403).json({
          message: "Vous n'êtes pas autorisé à modifier cette promotion",
        })
      }

      const payload = await request.validateUsing(updatePromotionValidator)

      // Vérifier que nouveau_prix < ancien_prix si les deux sont fournis
      if (payload.nouveauPrix !== undefined && payload.ancienPrix !== undefined) {
        if (payload.nouveauPrix >= payload.ancienPrix) {
          return response.status(422).json({
            message: 'Le nouveau prix doit être inférieur à l\'ancien prix',
          })
        }
      } else if (payload.nouveauPrix !== undefined) {
        if (payload.nouveauPrix >= promotion.ancienPrix) {
          return response.status(422).json({
            message: 'Le nouveau prix doit être inférieur à l\'ancien prix',
          })
        }
      } else if (payload.ancienPrix !== undefined) {
        if (promotion.nouveauPrix >= payload.ancienPrix) {
          return response.status(422).json({
            message: 'Le nouveau prix doit être inférieur à l\'ancien prix',
          })
        }
      }

      // Convertir delaiPromotion en DateTime si présent
      const updateData: any = { ...payload }
      if (payload.delaiPromotion) {
        updateData.delaiPromotion = DateTime.fromJSDate(payload.delaiPromotion)
      }
      promotion.merge(updateData)
      await promotion.save()

      await promotion.load('product', (productQuery) => {
        productQuery.preload('media').preload('category').preload('vendeur')
      })

      return response.status(200).json({
        message: 'Promotion mise à jour avec succès',
        promotion,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).json({ message: error.messages })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({
          message: 'Promotion non trouvée',
          error: error.message,
        })
      }

      logger.error({
        message: 'Erreur lors de la mise à jour de la promotion',
        error: error.message,
      })
      return response.status(500).json({
        message: 'Erreur serveur interne',
        error: error.message,
      })
    }
  }

  /**
   * Supprime une promotion
   * DELETE /promotions/:id
   * Accessible uniquement aux vendeurs
   */
  async destroy({ params, response, auth }: HttpContext) {
    const { id } = params
    try {
      const user = auth.user!
      if (!user) {
        return response.status(401).json({
          message: "Vous n'êtes pas autorisé à faire cette action",
        })
      }

      // Vérifier que l'utilisateur est un vendeur
      if (user.role !== UserRole.Vendeur) {
        return response.status(403).json({
          message: "Seuls les vendeurs peuvent supprimer des promotions",
        })
      }

      const promotion = await Promotion.findOrFail(id)

      await promotion.load('product')

      // Vérifier que le produit appartient au vendeur connecté
      if (promotion.product.vendeurId !== user.id) {
        return response.status(403).json({
          message: "Vous n'êtes pas autorisé à supprimer cette promotion",
        })
      }

      await promotion.delete()

      return response.status(200).json({
        message: 'Promotion supprimée avec succès',
        status: true,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({
          message: 'Promotion non trouvée',
          error: error.message,
        })
      }

      logger.error({
        message: 'Erreur lors de la suppression de la promotion',
        error: error.message,
      })
      return response.status(500).json({
        message: 'Erreur serveur interne',
        error: error.message,
      })
    }
  }
}

