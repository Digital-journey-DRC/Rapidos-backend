import Promotion from '#models/promotion'
import Product from '#models/product'
import { createPromotionValidator, updatePromotionValidator } from '#validators/promotion'
import { manageUploadPromotionImages } from '#services/managepromotionimages'
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

      const now = DateTime.now().toISO()
      
      const promotions = await Promotion.query()
        .preload('product', (productQuery) => {
          productQuery.preload('media').preload('category').preload('vendeur')
        })
        .where('delaiPromotion', '>', now)
        .where((query) => {
          // Si dateDebutPromotion est null, la promotion a déjà commencé
          // Sinon, vérifier que la date de début est passée ou égale à maintenant
          query
            .whereNull('dateDebutPromotion')
            .orWhere('dateDebutPromotion', '<=', now)
        })
        .orderBy('createdAt', 'desc')

      if (promotions.length === 0) {
        return response.status(404).json({ message: 'Aucune promotion trouvée' })
      }

      // Formater les données pour inclure toutes les informations requises
      const promotionsFormatted = promotions.map((promotion) => {
        const product = promotion.product
        // Créer un tableau avec les images secondaires (seulement celles qui existent)
        const images = []
        if (promotion.image1) images.push(promotion.image1)
        if (promotion.image2) images.push(promotion.image2)
        if (promotion.image3) images.push(promotion.image3)
        if (promotion.image4) images.push(promotion.image4)

        return {
          id: promotion.id,
          productId: promotion.productId,
          // Images
          image: promotion.image,
          images: images,
          // Autres informations
          libelle: promotion.libelle,
          likes: promotion.likes || 0,
          dateDebutPromotion: promotion.dateDebutPromotion,
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

      const now = DateTime.now().toISO()
      
      const promotion = await Promotion.query()
        .where('id', id)
        .where('delaiPromotion', '>', now)
        .where((query) => {
          // Si dateDebutPromotion est null, la promotion a déjà commencé
          // Sinon, vérifier que la date de début est passée ou égale à maintenant
          query
            .whereNull('dateDebutPromotion')
            .orWhere('dateDebutPromotion', '<=', now)
        })
        .preload('product', (productQuery) => {
          productQuery.preload('media').preload('category').preload('vendeur')
        })
        .firstOrFail()

      const product = promotion.product
      // Créer un tableau avec les images secondaires (seulement celles qui existent)
      const images = []
      if (promotion.image1) images.push(promotion.image1)
      if (promotion.image2) images.push(promotion.image2)
      if (promotion.image3) images.push(promotion.image3)
      if (promotion.image4) images.push(promotion.image4)

      const promotionFormatted = {
        id: promotion.id,
        productId: promotion.productId,
        image: promotion.image,
        images: images,
        libelle: promotion.libelle,
        likes: promotion.likes || 0,
        dateDebutPromotion: promotion.dateDebutPromotion,
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
      const now = DateTime.now().toISO()
      const existingPromotion = await Promotion.query()
        .where('productId', payload.productId)
        .where('delaiPromotion', '>', now)
        .where((query) => {
          // Si dateDebutPromotion est null, la promotion a déjà commencé
          // Sinon, vérifier que la date de début est passée ou égale à maintenant
          query
            .whereNull('dateDebutPromotion')
            .orWhere('dateDebutPromotion', '<=', now)
        })
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

      // Gestion des images (upload sur Cloudinary)
      const image = request.file('image')
      const image1 = request.file('image1')
      const image2 = request.file('image2')
      const image3 = request.file('image3')
      const image4 = request.file('image4')

      // Vérifier que l'image principale est fournie
      if (!image || !image.isValid) {
        return response.status(422).json({
          message: 'L\'image principale est requise',
          errors: image?.errors || ['Image principale manquante ou invalide'],
        })
      }

      // Upload des images
      const { image: uploadedImage, image1: uploadedImage1, image2: uploadedImage2, image3: uploadedImage3, image4: uploadedImage4, errors } = await manageUploadPromotionImages(
        image,
        image1 || null,
        image2 || null,
        image3 || null,
        image4 || null
      )

      // Si l'image principale n'a pas pu être uploadée, retourner une erreur
      if (!uploadedImage) {
        return response.status(422).json({
          message: 'Erreur lors de l\'upload de l\'image principale',
          errors,
        })
      }

      const promotion = await Promotion.create({
        productId: payload.productId,
        image: uploadedImage,
        image1: uploadedImage1 || null,
        image2: uploadedImage2 || null,
        image3: uploadedImage3 || null,
        image4: uploadedImage4 || null,
        libelle: payload.libelle,
        likes: payload.likes || 0,
        dateDebutPromotion: payload.dateDebutPromotion ? DateTime.fromJSDate(payload.dateDebutPromotion) : null,
        delaiPromotion: DateTime.fromJSDate(payload.delaiPromotion),
        nouveauPrix: payload.nouveauPrix,
        ancienPrix: payload.ancienPrix,
      })

      // Si certaines images secondaires n'ont pas pu être uploadées, retourner un warning
      if (errors.length > 0) {
        await promotion.load('product', (productQuery) => {
          productQuery.preload('media').preload('category').preload('vendeur')
        })

      // Formater la promotion avec le tableau images
      const images = []
      if (promotion.image1) images.push(promotion.image1)
      if (promotion.image2) images.push(promotion.image2)
      if (promotion.image3) images.push(promotion.image3)
      if (promotion.image4) images.push(promotion.image4)

      const productData = promotion.product
      const promotionFormatted = {
        id: promotion.id,
        productId: promotion.productId,
        image: promotion.image,
        images: images,
        libelle: promotion.libelle,
        likes: promotion.likes || 0,
        dateDebutPromotion: promotion.dateDebutPromotion,
        delaiPromotion: promotion.delaiPromotion,
        nouveauPrix: promotion.nouveauPrix,
        ancienPrix: promotion.ancienPrix,
        product: {
          id: productData.id,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          category: productData.category,
          media: productData.media,
          vendeur: productData.vendeur,
        },
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
      }

        return response.status(207).json({
          message: 'Promotion créée avec succès, mais certaines images secondaires n\'ont pas pu être uploadées',
          promotion: promotionFormatted,
          errors,
        })
      }

      await promotion.load('product', (productQuery) => {
        productQuery.preload('media').preload('category').preload('vendeur')
      })

      // Formater la promotion avec le tableau images
      const imagesArray = []
      if (promotion.image1) imagesArray.push(promotion.image1)
      if (promotion.image2) imagesArray.push(promotion.image2)
      if (promotion.image3) imagesArray.push(promotion.image3)
      if (promotion.image4) imagesArray.push(promotion.image4)

      const productInfo = promotion.product
      const promotionFormattedFinal = {
        id: promotion.id,
        productId: promotion.productId,
        image: promotion.image,
        images: imagesArray,
        libelle: promotion.libelle,
        likes: promotion.likes || 0,
        dateDebutPromotion: promotion.dateDebutPromotion,
        delaiPromotion: promotion.delaiPromotion,
        nouveauPrix: promotion.nouveauPrix,
        ancienPrix: promotion.ancienPrix,
        product: {
          id: productInfo.id,
          name: productInfo.name,
          description: productInfo.description,
          price: productInfo.price,
          stock: productInfo.stock,
          category: productInfo.category,
          media: productInfo.media,
          vendeur: productInfo.vendeur,
        },
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
      }

      return response.created({
        message: 'Promotion créée avec succès',
        promotion: promotionFormattedFinal,
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
      if (
        error.code === 'E_FILE_INVALID' ||
        error.code === 'E_FILE_TOO_LARGE' ||
        error.code === 'E_FILE_UNSUPPORTED_MEDIA_TYPE'
      ) {
        return response.status(422).json({ message: error.message })
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

      // Gestion des images (upload sur Cloudinary si fournies)
      const image = request.file('image')
      const image1 = request.file('image1')
      const image2 = request.file('image2')
      const image3 = request.file('image3')
      const image4 = request.file('image4')

      // Vérifier si on veut supprimer des images (via paramètres texte)
      const deleteImage1 = request.input('deleteImage1') === 'true'
      const deleteImage2 = request.input('deleteImage2') === 'true'
      const deleteImage3 = request.input('deleteImage3') === 'true'
      const deleteImage4 = request.input('deleteImage4') === 'true'

      const updateData: any = { ...payload }

      // Upload des nouvelles images si fournies
      if (image || image1 || image2 || image3 || image4) {
        const { image: uploadedImage, image1: uploadedImage1, image2: uploadedImage2, image3: uploadedImage3, image4: uploadedImage4, errors } = await manageUploadPromotionImages(
          image || null,
          image1 || null,
          image2 || null,
          image3 || null,
          image4 || null
        )

        if (uploadedImage) updateData.image = uploadedImage
        if (uploadedImage1 !== null) updateData.image1 = uploadedImage1
        if (uploadedImage2 !== null) updateData.image2 = uploadedImage2
        if (uploadedImage3 !== null) updateData.image3 = uploadedImage3
        if (uploadedImage4 !== null) updateData.image4 = uploadedImage4

        // Si l'image principale est fournie mais n'a pas pu être uploadée, retourner une erreur
        if (image && !uploadedImage) {
          return response.status(422).json({
            message: 'Erreur lors de l\'upload de l\'image principale',
            errors,
          })
        }
      }

      // Gérer la suppression d'images secondaires
      if (deleteImage1) updateData.image1 = null
      if (deleteImage2) updateData.image2 = null
      if (deleteImage3) updateData.image3 = null
      if (deleteImage4) updateData.image4 = null

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
      if (payload.dateDebutPromotion) {
        updateData.dateDebutPromotion = DateTime.fromJSDate(payload.dateDebutPromotion)
      }
      if (payload.delaiPromotion) {
        updateData.delaiPromotion = DateTime.fromJSDate(payload.delaiPromotion)
      }

      promotion.merge(updateData)
      await promotion.save()

      await promotion.load('product', (productQuery) => {
        productQuery.preload('media').preload('category').preload('vendeur')
      })

      // Formater la promotion avec le tableau images
      const imagesUpdate = []
      if (promotion.image1) imagesUpdate.push(promotion.image1)
      if (promotion.image2) imagesUpdate.push(promotion.image2)
      if (promotion.image3) imagesUpdate.push(promotion.image3)
      if (promotion.image4) imagesUpdate.push(promotion.image4)

      const productUpdate = promotion.product
      const promotionFormattedUpdate = {
        id: promotion.id,
        productId: promotion.productId,
        image: promotion.image,
        images: imagesUpdate,
        libelle: promotion.libelle,
        likes: promotion.likes || 0,
        dateDebutPromotion: promotion.dateDebutPromotion,
        delaiPromotion: promotion.delaiPromotion,
        nouveauPrix: promotion.nouveauPrix,
        ancienPrix: promotion.ancienPrix,
        product: {
          id: productUpdate.id,
          name: productUpdate.name,
          description: productUpdate.description,
          price: productUpdate.price,
          stock: productUpdate.stock,
          category: productUpdate.category,
          media: productUpdate.media,
          vendeur: productUpdate.vendeur,
        },
        createdAt: promotion.createdAt,
        updatedAt: promotion.updatedAt,
      }

      return response.status(200).json({
        message: 'Promotion mise à jour avec succès',
        promotion: promotionFormattedUpdate,
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
      if (
        error.code === 'E_FILE_INVALID' ||
        error.code === 'E_FILE_TOO_LARGE' ||
        error.code === 'E_FILE_UNSUPPORTED_MEDIA_TYPE'
      ) {
        return response.status(422).json({ message: error.message })
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

