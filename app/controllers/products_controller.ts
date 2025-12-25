import Category from '#models/category'
import Media from '#models/media'
import Product from '#models/product'
import User from '#models/user'
import ProductEvent from '#models/product_event'
import { manageUploadProductMedias } from '#services/managemedias'
import { manageUploadProductImages } from '#services/manageproductimages'
import { categoryValidator } from '#validators/category'

import { createProductValidator, validateProductStock } from '#validators/products'

import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class ProductsController {
  async store({ request, response, auth, bouncer }: HttpContext) {
    const user = auth.user!
    const data = request.only(['description', 'category'])

    if (!user) {
      return response.status(401).json({ message: "Vous n'êtes pas autorisé à faire cette action" })
    }

    try {
      if (await bouncer.denies('createProduct')) {
        return response
          .status(403)
          .json({ message: "Vous n'êtes pas autorisé à faire cette action" })
      }

      const dataForCategory = {
        name: data.category,
        description: data.description,
      }

      const vendeurId = user.id
      const payload = await request.validateUsing(createProductValidator)
      // Garder le nom original sans conversion
      const catData = await categoryValidator.validate(dataForCategory)
      // Chercher la catégorie ou la créer automatiquement si elle n'existe pas
      let category = await Category.findBy('name', catData.name)
      if (!category) {
        // Créer automatiquement la catégorie si elle n'existe pas
        category = await Category.create({
          name: catData.name,
          description: catData.description || `Catégorie ${catData.name}`,
        })
      }
      const product = await Product.create({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        stock: payload.stock,
        categorieId: category.id,
        vendeurId,
      })

      // Gestion des images (image principale + images supplémentaires)
      // Support à la fois de l'ancienne méthode (medias) et de la nouvelle (image, image1, image2, image3, image4)
      // Supporte aussi les URLs d'images (ex: Unsplash) en plus des fichiers
      const image = request.file('image') || request.input('image') // Fichier ou URL
      const image1 = request.file('image1') || request.input('image1') // Fichier ou URL
      const image2 = request.file('image2') || request.input('image2') // Fichier ou URL
      const image3 = request.file('image3') || request.input('image3') // Fichier ou URL
      const image4 = request.file('image4') || request.input('image4') // Fichier ou URL
      const productMedia = request.files('medias') // Ancienne méthode pour compatibilité

      let errors: any[] = []

      // Si on utilise la nouvelle méthode (image, image1, etc.) - supporte fichiers ET URLs
      if (image || image1 || image2 || image3 || image4) {
        const {
          image: uploadedImage,
          image1: uploadedImage1,
          image2: uploadedImage2,
          image3: uploadedImage3,
          image4: uploadedImage4,
          errors: uploadErrors,
        } = await manageUploadProductImages(image || null, image1 || null, image2 || null, image3 || null, image4 || null)

        errors = uploadErrors

        // Enregistrement de l'image principale
        if (uploadedImage) {
          await product.related('media').create({
            mediaUrl: uploadedImage.imageUrl,
            mediaType: uploadedImage.imageType,
            productId: product.id,
          })
        }

        // Enregistrement des images supplémentaires
        if (uploadedImage1) {
          await product.related('media').create({
            mediaUrl: uploadedImage1.imageUrl,
            mediaType: uploadedImage1.imageType,
            productId: product.id,
          })
        }
        if (uploadedImage2) {
          await product.related('media').create({
            mediaUrl: uploadedImage2.imageUrl,
            mediaType: uploadedImage2.imageType,
            productId: product.id,
          })
        }
        if (uploadedImage3) {
          await product.related('media').create({
            mediaUrl: uploadedImage3.imageUrl,
            mediaType: uploadedImage3.imageType,
            productId: product.id,
          })
        }
        if (uploadedImage4) {
          await product.related('media').create({
            mediaUrl: uploadedImage4.imageUrl,
            mediaType: uploadedImage4.imageType,
            productId: product.id,
          })
        }
      } else if (productMedia && productMedia.length > 0) {
        // Ancienne méthode pour compatibilité
        const { medias, errors: mediasErrors } = await manageUploadProductMedias(productMedia)
        errors = mediasErrors

      // Enregistrement des médias en base
      for (const media of medias) {
        await product.related('media').create({
          mediaUrl: media.mediaUrl,
          mediaType: media.mediaType,
          productId: product.id,
        })
        }
      }

      // Récupérer le produit avec ses médias et catégorie
      await product.load('media')
      await product.load('category')

      if (errors.length > 0) {
        return response.status(207).json({
          message: "Produit créé, mais certaines images n'ont pas pu être uploadées.",
          errors,
        })
      }

      const mediasForProduct = await Media.query().where('productId', product.id)

      return response.created({
        message: 'Produit créé avec succès',
        product,
        medias: mediasForProduct,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).json({ message: error.messages })
      }
      if (error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.status(403).json({ message: error.message })
      }
      if (
        error.code === 'E_FILE_INVALID' ||
        error.code === 'E_FILE_TOO_LARGE' ||
        error.code === 'E_FILE_UNSUPPORTED_MEDIA_TYPE'
      ) {
        return response.status(422).json({ message: error.message })
      }

      console.error(error)
      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async getAllProductByUser({ params, response }: HttpContext) {
    const { userId } = params
    try {
      const products = await Product.query()
        .where('vendeur_id', userId)
        .preload('category')
        .preload('vendeur')
      
      if (products.length === 0) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }

      // Formater exactement comme getAllProducts (même structure)
      const productsFormatted = await Promise.all(
        products.map(async (product) => {
          // Récupérer tous les médias du produit
          const allMedias = await Media.query()
            .where('productId', product.id)
            .orderBy('created_at', 'asc')

          // Image principale (première image ou null)
          const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null

          // Tableau des images supplémentaires (toutes sauf la première)
          const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : []

          // Utiliser serialize() puis extraire uniquement les champs souhaités
          const serialized = product.serialize()
          return {
            id: serialized.id,
            name: serialized.name,
            description: serialized.description,
            price: serialized.price,
            stock: serialized.stock,
            category: serialized.category,
            image: mainImage, // Image principale Cloudinary
            images: images, // Tableau des images supplémentaires Cloudinary
            vendeur: serialized.vendeur,
          }
        })
      )

      return response.status(200).json({ products: productsFormatted })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async getAllProducts({ response }: HttpContext) {
    try {
      const products = await Product.query()
        .preload('category')
        .preload('vendeur')

      if (products.length === 0) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }

      // Formater exactement comme dans les promotions (même structure)
      const productsFormatted = await Promise.all(
        products.map(async (product) => {
          // Récupérer tous les médias du produit
          const allMedias = await Media.query()
            .where('productId', product.id)
            .orderBy('created_at', 'asc')

          // Image principale (première image ou null)
          const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null

          // Tableau des images supplémentaires (toutes sauf la première)
          const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : []

          // Utiliser serialize() puis extraire uniquement les champs souhaités
          const serialized = product.serialize()
          return {
            id: serialized.id,
            name: serialized.name,
            description: serialized.description,
            price: serialized.price,
            stock: serialized.stock,
            category: serialized.category,
            image: mainImage, // Image principale
            images: images, // Tableau des images supplémentaires
            vendeur: serialized.vendeur,
          }
        })
      )

      return response.status(200).json({ products: productsFormatted })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async showAllProducts({ response, auth }: HttpContext) {
    try {
      const products = await Product.query()
        .where('vendeur_id', auth.user!.id)
        .preload('category')
        .preload('vendeur', (vendeurQuery) => {
          vendeurQuery.preload('profil', (profilQuery) => {
            profilQuery.preload('media')
          })
        })

      if (products.length === 0) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }

      // Formater les produits avec image principale et images secondaires
      const productsFormatted = await Promise.all(
        products.map(async (product) => {
          // Récupérer tous les médias du produit
          const allMedias = await Media.query()
            .where('productId', product.id)
            .orderBy('created_at', 'asc')
          
          // Image principale (première image ou null)
          const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null
          
          // Tableau des images supplémentaires (toutes sauf la première)
          const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : []

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            image: mainImage,
            images: images,
            vendeur: product.vendeur,
          }
        })
      )

      return response.status(200).json({ products: productsFormatted })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async getProductByCategory({ response, params }: HttpContext) {
    const { categoryId } = params
    try {
      const CategoryById = await Category.findOrFail(categoryId)
      if (!CategoryById) {
        return response.status(404).json({ message: 'Catégorie non trouvée' })
      }
      const products = await Product.query()
        .where('categorieId', categoryId)
        .preload('category')
        .preload('vendeur')
        .preload('commandes')
      
      if (products.length === 0) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }

      // Formater les produits avec les images Cloudinary
      const productsFormatted = await Promise.all(
        products.map(async (product) => {
          // Récupérer tous les médias du produit
          const allMedias = await Media.query()
            .where('productId', product.id)
            .orderBy('created_at', 'asc')

          // Image principale (première image ou null)
          const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null

          // Tableau des images supplémentaires (toutes sauf la première)
          const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : []

          const serialized = product.serialize()
          return {
            id: serialized.id,
            name: serialized.name,
            description: serialized.description,
            price: serialized.price,
            stock: serialized.stock,
            category: serialized.category,
            image: mainImage, // Image principale Cloudinary
            images: images, // Tableau des images supplémentaires Cloudinary
            vendeur: serialized.vendeur,
            commandes: serialized.commandes,
          }
        })
      )

      return response.status(200).json({ products: productsFormatted })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async getProductById({ params, response }: HttpContext) {
    const { productId, id } = params
    const productIdValue = productId || id
    try {
      const product = await Product.query()
        .where('id', productIdValue)
        .preload('category')
        .preload('vendeur')
        .preload('commandes')
        .first()
      
      if (!product) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }
      // Récupérer tous les médias du produit
      const allMedias = await Media.query()
        .where('productId', product.id)
        .orderBy('created_at', 'asc')

      // Image principale (première image ou null)
      const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null

      // Tableau des images supplémentaires (toutes sauf la première)
      const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : []

      // Formater le produit avec les images Cloudinary
      const serialized = product.serialize()
      const productFormatted = {
        id: serialized.id,
        name: serialized.name,
        description: serialized.description,
        price: serialized.price,
        stock: serialized.stock,
        category: serialized.category,
        image: mainImage, // Image principale Cloudinary
        images: images, // Tableau des images supplémentaires Cloudinary
        vendeur: serialized.vendeur,
        commandes: serialized.commandes,
      }

      return response.status(200).json({ product: productFormatted })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async updateProduct({ params, response, bouncer, request }: HttpContext) {
    const { productId } = params
    try {
      const product = await Product.findOrFail(productId)
      if (!product) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }
      
      if (await bouncer.denies('canUpdateOrDeleteProduct', product.vendeurId)) {
        return response
          .status(403)
          .json({ message: "Vous n'êtes pas autorisé à faire cette action" })
      }
      const payload = await request.validateUsing(createProductValidator)
      let category
      if (payload.category) {
        category = await Category.findBy('name', payload.category)
        if (!category) {
          // Créer automatiquement la catégorie si elle n'existe pas
          category = await Category.create({
            name: payload.category,
            description: `Catégorie ${payload.category}`,
          })
        }
      }
      product.name = payload.name
      product.description = payload.description
      product.price = payload.price
      product.stock = payload.stock
      if (category) {
        product.categorieId = category.id
      }
      await product.save()

      // Gestion des images (image principale + images supplémentaires)
      // Support à la fois de l'ancienne méthode (medias) et de la nouvelle (image, image1, image2, image3, image4)
      const image = request.file('image')
      const image1 = request.file('image1')
      const image2 = request.file('image2')
      const image3 = request.file('image3')
      const image4 = request.file('image4')
      const productMedia = request.files('medias') // Ancienne méthode pour compatibilité

      let errors: any[] = []

      // Si on utilise la nouvelle méthode (image, image1, etc.)
      if (image || image1 || image2 || image3 || image4) {
        const {
          image: uploadedImage,
          image1: uploadedImage1,
          image2: uploadedImage2,
          image3: uploadedImage3,
          image4: uploadedImage4,
          errors: uploadErrors,
        } = await manageUploadProductImages(image || null, image1 || null, image2 || null, image3 || null, image4 || null)

        errors = uploadErrors

        // Enregistrement de l'image principale
        if (uploadedImage) {
          await product.related('media').create({
            mediaUrl: uploadedImage.imageUrl,
            mediaType: uploadedImage.imageType,
            productId: product.id,
          })
        }

        // Enregistrement des images supplémentaires
        if (uploadedImage1) {
          await product.related('media').create({
            mediaUrl: uploadedImage1.imageUrl,
            mediaType: uploadedImage1.imageType,
            productId: product.id,
          })
        }
        if (uploadedImage2) {
          await product.related('media').create({
            mediaUrl: uploadedImage2.imageUrl,
            mediaType: uploadedImage2.imageType,
            productId: product.id,
          })
        }
        if (uploadedImage3) {
          await product.related('media').create({
            mediaUrl: uploadedImage3.imageUrl,
            mediaType: uploadedImage3.imageType,
            productId: product.id,
          })
        }
        if (uploadedImage4) {
          await product.related('media').create({
            mediaUrl: uploadedImage4.imageUrl,
            mediaType: uploadedImage4.imageType,
            productId: product.id,
          })
        }
      } else if (productMedia && productMedia.length > 0) {
        // Ancienne méthode pour compatibilité
        const { medias, errors: mediasErrors } = await manageUploadProductMedias(productMedia)
        errors = mediasErrors

      // Enregistrement des médias en base
      for (const media of medias) {
        await product.related('media').create({
          mediaUrl: media.mediaUrl,
          mediaType: media.mediaType,
          productId: product.id,
        })
      }
      }

      // Récupérer le produit avec ses relations
      await product.load('category')
      await product.load('vendeur', (vendeurQuery) => {
        vendeurQuery.preload('profil', (profilQuery) => {
          profilQuery.preload('media')
        })
      })
      
      // Récupérer toutes les images avec la même structure que les autres endpoints
      const allMedias = await Media.query()
        .where('productId', product.id)
        .orderBy('created_at', 'asc')
      
      const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null
      const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : []
      
      const productFormatted = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image: mainImage,
        images: images,
        vendeur: product.vendeur,
      }
      
      if (errors.length > 0) {
        return response.status(207).json({
          message: "Produit mis à jour, mais certaines images n'ont pas pu être uploadées.",
          product: productFormatted,
          errors,
        })
      }
      
      return response.status(200).json({
        message: 'Produit mis à jour avec succès',
        product: productFormatted,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).json({ message: error.messages })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }
      if (error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.status(403).json({ message: error.message })
      }
      if (
        error.code === 'E_FILE_INVALID' ||
        error.code === 'E_FILE_TOO_LARGE' ||
        error.code === 'E_FILE_UNSUPPORTED_MEDIA_TYPE'
      ) {
        return response.status(422).json({ message: error.message })
      }

      console.error(error)
      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async deleteProduct({ params, response, bouncer }: HttpContext) {
    const { productId } = params
    try {
      // Récupérer le produit d'abord pour obtenir le vendeurId
      const product = await Product.findOrFail(productId)
      
      // Vérifier les permissions avec le vendeurId du produit
      if (await bouncer.denies('canUpdateOrDeleteProduct', product.vendeurId)) {
        return response
          .status(403)
          .json({ message: "Vous n'êtes pas autorisé à faire cette action" })
      }
      
      await product.delete()
      return response.status(200).json({ message: 'Produit supprimé avec succès', status: true })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

 async getVendeurAndTheirProducts({ response }: HttpContext) {
  try {
    const vendeurs = await User.query().where('role', 'vendeur')
    const vendeurWITHProduct = []

    for (const vendeur of vendeurs) {
      // Récupérer les produits du vendeur
      const products = await Product.query().where('vendeur_id', vendeur.id).preload('media')

      if (!products || products.length === 0) {
        continue
      }

      // Récupérer le profil et media du vendeur
      let vendeurMedia = null
      try {
        const userWithProfile = await User.query()
          .where('id', vendeur.id)
          .preload('profil', (query) => {
            query.preload('media')
          })
          .first()

        // Vérifier si le profil et media existent
        if (userWithProfile?.profil?.media) {
          vendeurMedia = userWithProfile.profil.media
        }
      } catch (profileError) {
        // Si erreur lors de la récupération du profil, continuer avec media = null
        console.warn(`Erreur lors de la récupération du profil pour le vendeur ${vendeur.id}:`, profileError.message)
      }

      vendeurWITHProduct.push({
        vendeur,
        products,
        media: vendeurMedia,
      })
    }

    return response.ok({ vendeurWITHProduct })
  } catch (error) {
    if (error.code === 'E_ROW_NOT_FOUND') {
      return response.status(404).json({ message: 'Aucun vendeur trouvé', error: error.message })
    }

    return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
  }
}

  async getVendeurById({ response, params }: HttpContext) {
    try {
      const vendeurId = params.id

      // Récupérer le vendeur avec son profil, media et horaires d'ouverture
      const vendeur = await User.query()
        .where('id', vendeurId)
        .where('role', 'vendeur')
        .preload('profil', (query) => {
          query.preload('media')
        })
        .preload('horairesOuverture')
        .first()

      if (!vendeur) {
        return response.status(404).json({ message: 'Vendeur non trouvé' })
      }

      // Récupérer les produits du vendeur
      const products = await Product.query()
        .where('vendeur_id', vendeur.id)
        .preload('media')
        .preload('category')

      // Récupérer le media du profil si disponible
      let vendeurMedia = null
      if (vendeur.profil?.media) {
        vendeurMedia = vendeur.profil.media
      }
      return response.ok({
        message: 'Vendeur récupéré avec succès',
        vendeur: {
          id: vendeur.id,
          firstName: vendeur.firstName,
          lastName: vendeur.lastName,
          email: vendeur.email,
          phone: vendeur.phone,
          role: vendeur.role,
          userStatus: vendeur.userStatus,
          createdAt: vendeur.createdAt,
          updatedAt: vendeur.updatedAt,
        },
        profil: vendeur.profil,
        media: vendeurMedia,
        horairesOuverture: vendeur.horairesOuverture || [],
        products: products,
        totalProducts: products.length,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Vendeur non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async updateStockForProduct({ params, response, request, bouncer }: HttpContext) {
    const productId = params.productId
    try {
      const payload = await request.validateUsing(validateProductStock)
      const product = await Product.findOrFail(productId)

      if (await bouncer.denies('canUpdateStock', product.vendeurId)) {
        return response
          .status(403)
          .json({ message: "Vous n'êtes pas autorisé à faire cette action" })
      }

      // Remplacement du stock (pas d'addition)
      product.stock = payload.stock
      await product.save()
      return response.status(200).json({
        message: 'Stock mis à jour avec succès',
        product: {
          id: product.id,
          name: product.name,
          stock: product.stock,
        },
      })
    } catch (error) {
      logger.error({
        message: 'Erreur lors de la mise à jour du stock',
        error: error.message,
      })
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }
      if (error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.status(403).json({ message: error.message })
      }
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).json({ message: error.messages })
      }

      console.error(error)
      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  /**
   * Endpoint pour récupérer 5 produits recommandés basés sur l'historique de l'utilisateur
   * GET /products/recommended
   */
  async getRecommendedProducts({ response, auth }: HttpContext) {
    try {
      const userId = auth.user?.id

      // Si pas d'utilisateur connecté, retourner les 5 produits les plus récents
      if (!userId) {
        const recentProducts = await Product.query()
          .where('stock', '>', 0)
          .preload('category')
          .preload('vendeur')
          .orderBy('created_at', 'desc')
          .limit(5)

        const productIds = recentProducts.map((p) => p.id)
        const allMedias = await Media.query()
          .whereIn('productId', productIds)
          .orderBy('product_id', 'asc')
          .orderBy('created_at', 'asc')

        const mediasByProduct: Record<number, typeof allMedias> = {}
        for (const media of allMedias) {
          if (!mediasByProduct[media.productId]) {
            mediasByProduct[media.productId] = []
          }
          mediasByProduct[media.productId].push(media)
        }

        const productsFormatted = recentProducts.map((product) => {
          const productMedias = mediasByProduct[product.id] || []
          const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null
          const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : []

          const serialized = product.serialize()
          return {
            id: serialized.id,
            name: serialized.name,
            description: serialized.description,
            price: serialized.price,
            stock: serialized.stock,
            category: serialized.category,
            image: mainImage,
            images: images,
            vendeur: serialized.vendeur,
          }
        })

        return response.status(200).json({ products: productsFormatted })
      }

      // Récupérer les événements de l'utilisateur (30 derniers jours)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      let userEvents: ProductEvent[] = []
      try {
        userEvents = await ProductEvent.query()
          .where('userId', userId)
          .where('createdAt', '>=', thirtyDaysAgo.toISOString())
          .whereNotNull('productCategoryId')
          .orderBy('createdAt', 'desc')
        .limit(100)
      } catch (error) {
        // Si la table n'existe pas, retourner les produits récents
        logger.warn('Table product_events non disponible, retour des produits récents')
        
        const recentProducts = await Product.query()
          .where('stock', '>', 0)
          .preload('category')
          .preload('vendeur')
          .orderBy('created_at', 'desc')
          .limit(5)

        const productIds = recentProducts.map((p) => p.id)
        const allMedias = await Media.query()
          .whereIn('productId', productIds)
          .orderBy('product_id', 'asc')
          .orderBy('created_at', 'asc')

        const mediasByProduct: Record<number, typeof allMedias> = {}
        for (const media of allMedias) {
          if (!mediasByProduct[media.productId]) {
            mediasByProduct[media.productId] = []
          }
          mediasByProduct[media.productId].push(media)
        }

        const productsFormatted = recentProducts.map((product) => {
          const productMedias = mediasByProduct[product.id] || []
          const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null
          const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : []

          const serialized = product.serialize()
          return {
            id: serialized.id,
            name: serialized.name,
            description: serialized.description,
            price: serialized.price,
            stock: serialized.stock,
            category: serialized.category,
            image: mainImage,
            images: images,
            vendeur: serialized.vendeur,
          }
        })

        return response.status(200).json({ products: productsFormatted })
      }

      // Si pas d'événements, retourner les produits récents
      if (userEvents.length === 0) {
        const recentProducts = await Product.query()
          .where('stock', '>', 0)
          .preload('category')
          .preload('vendeur')
          .orderBy('created_at', 'desc')
          .limit(5)

        const productIds = recentProducts.map((p) => p.id)
        const allMedias = await Media.query()
          .whereIn('productId', productIds)
          .orderBy('product_id', 'asc')
          .orderBy('created_at', 'asc')

        const mediasByProduct: Record<number, typeof allMedias> = {}
        for (const media of allMedias) {
          if (!mediasByProduct[media.productId]) {
            mediasByProduct[media.productId] = []
          }
          mediasByProduct[media.productId].push(media)
        }

        const productsFormatted = recentProducts.map((product) => {
          const productMedias = mediasByProduct[product.id] || []
          const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null
          const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : []

          const serialized = product.serialize()
          return {
            id: serialized.id,
            name: serialized.name,
            description: serialized.description,
            price: serialized.price,
            stock: serialized.stock,
            category: serialized.category,
            image: mainImage,
            images: images,
            vendeur: serialized.vendeur,
          }
        })

        return response.status(200).json({ products: productsFormatted })
      }

      // Analyser les catégories consultées par l'utilisateur
      const categoryCounts: Record<number, number> = {}
      const viewedProductIds: Set<number> = new Set()

      for (const event of userEvents) {
        if (event.productCategoryId) {
          categoryCounts[event.productCategoryId] = (categoryCounts[event.productCategoryId] || 0) + 1
        }
            if (event.productId) {
              viewedProductIds.add(event.productId)
        }
      }

      // Trier les catégories par nombre de vues
      const topCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([categoryId]) => parseInt(categoryId))

      // Récupérer des produits récents dans ces catégories
      const recommendedProducts: Product[] = []
      const excludedIds = Array.from(viewedProductIds)

      for (const categoryId of topCategories) {
        if (recommendedProducts.length >= 5) break

        const productsInCategory = await Product.query()
          .where('categorieId', categoryId)
          .whereNotIn('id', excludedIds)
          .where('stock', '>', 0)
          .preload('category')
          .preload('vendeur')
          .orderBy('created_at', 'desc')
          .limit(5 - recommendedProducts.length)

        for (const product of productsInCategory) {
          if (recommendedProducts.length >= 5) break
          recommendedProducts.push(product)
          excludedIds.push(product.id)
        }
      }

      // Compléter avec des produits récents si nécessaire
      if (recommendedProducts.length < 5) {
        const additionalProducts = await Product.query()
          .whereNotIn('id', excludedIds)
          .where('stock', '>', 0)
          .preload('category')
          .preload('vendeur')
          .orderBy('created_at', 'desc')
          .limit(5 - recommendedProducts.length)

        recommendedProducts.push(...additionalProducts)
      }

      // Formater les produits
      const productIds = recommendedProducts.map((p) => p.id)
      const allMedias = await Media.query()
        .whereIn('productId', productIds)
        .orderBy('product_id', 'asc')
        .orderBy('created_at', 'asc')

      const mediasByProduct: Record<number, typeof allMedias> = {}
      for (const media of allMedias) {
        if (!mediasByProduct[media.productId]) {
          mediasByProduct[media.productId] = []
        }
        mediasByProduct[media.productId].push(media)
      }

      const productsFormatted = recommendedProducts.map((product) => {
        const productMedias = mediasByProduct[product.id] || []
        const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null
        const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : []

        const serialized = product.serialize()
        return {
          id: serialized.id,
          name: serialized.name,
          description: serialized.description,
          price: serialized.price,
          stock: serialized.stock,
          category: serialized.category,
          image: mainImage,
          images: images,
          vendeur: serialized.vendeur,
        }
      })

      return response.status(200).json({ products: productsFormatted })
    } catch (error) {
      logger.error('Erreur lors de la récupération des produits recommandés', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        message: 'Erreur serveur interne',
        error: error.message,
      })
    }
  }

  /**
   * Endpoint pour récupérer 10 produits aléatoires
   * GET /products/random
   */
  async getRandomProducts({ response }: HttpContext) {
    try {
      // Récupérer 10 produits aléatoires en stock avec catégorie
      // Ne pas utiliser preload pour éviter les problèmes de chargement automatique
      const randomProducts = await Product.query()
        .where('stock', '>', 0)
        .whereNotNull('categorieId')
        .orderByRaw('RANDOM()')
        .limit(10)

      // Charger les catégories séparément pour éviter les erreurs de preload
      const categoryIds = randomProducts
        .map((p) => p.categorieId)
        .filter((id): id is number => id !== null && id !== undefined)
      
      let categoriesMap = new Map()
      if (categoryIds.length > 0) {
        const categories = await Category.query().whereIn('id', categoryIds)
        categoriesMap = new Map(categories.map((c) => [c.id, c]))
      }

      // Les catégories seront utilisées directement depuis categoriesMap lors du formatage

      if (randomProducts.length === 0) {
        return response.status(404).json({ message: 'Aucun produit trouvé', products: [] })
      }

      // Charger tous les vendeurs en une seule requête pour éviter le pool de connexions
      const vendeurIds = randomProducts
        .map((p) => p.vendeurId)
        .filter((id): id is number => id !== null && id !== undefined)
      
      let vendeursMap = new Map()
      if (vendeurIds.length > 0) {
        const vendeurs = await User.query().whereIn('id', vendeurIds)
        vendeursMap = new Map(vendeurs.map((v) => [v.id, v]))
      }

      // Récupérer tous les médias en une seule requête pour éviter le pool de connexions
      const productIds = randomProducts.map((p) => p.id)
      const allMedias = await Media.query()
        .whereIn('productId', productIds)
        .orderBy('product_id', 'asc')
        .orderBy('created_at', 'asc')

      // Grouper les médias par produit
      const mediasByProduct: Record<number, typeof allMedias> = {}
      for (const media of allMedias) {
        if (!mediasByProduct[media.productId]) {
          mediasByProduct[media.productId] = []
        }
        mediasByProduct[media.productId].push(media)
      }

      // Formater exactement comme getAllProducts (même structure)
      const productsFormatted = randomProducts.map((product) => {
        const productMedias = mediasByProduct[product.id] || []
        const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null
        const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : []

        // Utiliser serialize() pour avoir exactement la même structure que getAllProducts
        // Utiliser la category chargée manuellement et la sérialiser
        const categoryData = product.categorieId && categoriesMap.has(product.categorieId)
          ? categoriesMap.get(product.categorieId)!
          : null
        const category = categoryData ? categoryData.serialize() : null
        
        // Utiliser le vendeur chargé manuellement depuis vendeursMap et le sérialiser
        const vendeur = product.vendeurId && vendeursMap.has(product.vendeurId)
          ? vendeursMap.get(product.vendeurId)!.serialize()
          : null
        
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: category,
          image: mainImage, // Image principale Cloudinary
          images: images, // Tableau des images supplémentaires Cloudinary
          vendeur: vendeur,
        }
      })

      return response.status(200).json({ products: productsFormatted })
    } catch (error) {
      logger.error('Erreur lors de la récupération des produits aléatoires', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        message: 'Erreur serveur interne',
        error: error.message,
      })
    }
  }
}
