import Category from '#models/category'
import Media from '#models/media'
import Product from '#models/product'
import User from '#models/user'
import { manageUploadProductMedias } from '#services/managemedias'

import { createProductValidator } from '#validators/products'

import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  async store({ request, response, auth, bouncer }: HttpContext) {
    const user = auth.user!

    if (!user) {
      return response.status(401).json({ message: "Vous n'êtes pas autorisé à faire cette action" })
    }

    try {
      if (await bouncer.denies('createProduct')) {
        return response
          .status(403)
          .json({ message: "Vous n'êtes pas autorisé à faire cette action" })
      }

      const vendeurId = user.id
      const payload = await request.validateUsing(createProductValidator)
      const category = await Category.query().where('name', payload.category).first()
      if (!category) {
        return response.status(404).json({ message: 'Catégorie non trouvée' })
      }
      const product = await Product.create({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        stock: payload.stock,
        categoryId: category.id,
        vendeurId,
      })

      // Gestion des médias
      const productMedia = request.files('medias')
      const { medias, errors } = await manageUploadProductMedias(productMedia)

      // Enregistrement des médias en base
      for (const media of medias) {
        await product.related('media').create({
          mediaUrl: media.mediaUrl,
          mediaType: media.mediaType,
          productId: product.id,
        })
      }

      // Récupérer le produit avec ses médias
      await product.load('media')

      if (errors.length > 0) {
        return response.status(207).json({
          message: "Produit créé, mais certaines images n'ont pas pu être uploadées.",
          errors,
        })
      }

      const mediasForProduct = await Media.query().where('product_id', product.id)

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
      return response.status(500).json({ message: 'Erreur serveur interne' })
    }
  }

  async getAllProduct({ params, response }: HttpContext) {
    const { userId } = params
    try {
      const product = await Product.query().where('vendeur_id', userId).preload('media')
      if (!product) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }
      return response.status(200).json({ product })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async getAllProductsForAdmin({ response, request, bouncer }: HttpContext) {
    const email = request.input('email')

    try {
      if (await bouncer.denies('showProductToAdmin')) {
        return response
          .status(403)
          .json({ message: "Vous n'êtes pas autorisé à faire cette action" })
      }
      const userProductOwner = await User.query().where('email', email).first()
      if (!userProductOwner) {
        return response.status(404).json({ message: 'Utilisateur non trouvé' })
      }
      const products = await Product.query()
        .where('vendeur_id', userProductOwner.id)
        .preload('media')

      if (!products) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }
      return response.status(200).json({ products })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async showAllProducts({ response, bouncer }: HttpContext) {
    try {
      if (await bouncer.denies('showProductToAdmin')) {
        return response
          .status(403)
          .json({ message: "Vous n'êtes pas autorisé à faire cette action" })
      }
      const products = await Product.query().preload('media')
      if (!products) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }
      return response.status(200).json({ products })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async getProductByCategory({ request, response, auth }: HttpContext) {
    const category = request.input('category')
    try {
      const products = await Product.query().where('category', category).preload('media')
      if (!products) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }
      return response.status(200).json({ products })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }

  async getProductById({ params, response }: HttpContext) {
    const { id } = params
    try {
      const product = await Product.query().where('id', id).preload('media')
      if (!product) {
        return response.status(404).json({ message: 'Produit non trouvé' })
      }
      return response.status(200).json({ product })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Produit non trouvé', error: error.message })
      }

      return response.status(500).json({ message: 'Erreur serveur interne', error: error.message })
    }
  }
}
