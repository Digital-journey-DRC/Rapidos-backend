import Category from '#models/category'
import { categoryValidator } from '#validators/category'
import type { HttpContext } from '@adonisjs/core/http'

export default class CategoriesController {
  async createCategory({ request, bouncer, response }: HttpContext) {
    const data = request.only(['name', 'description'])
    try {
      if (await bouncer.denies('canCreateOrDeleteCategory')) {
        return response.status(403).json({ message: 'Unauthorized' })
      }

      const payload = await categoryValidator.validate(data)

      const isCategoryExists = await Category.findBy('name', payload.name)
      if (isCategoryExists) {
        return response.status(409).json({
          message: 'Category already exists',
        })
      }
      const category = await Category.create({
        name: payload.name,
        description: payload.description || null,
      })
      return response.status(201).json({
        message: 'Category created successfully',
        data: category,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  }

  async getAllCategory({ response }: HttpContext) {
    try {
      const categories = await Category.all()
      return response.ok({
        categories,
        status: 200,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({
          message: 'pas des catégories existante',
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  }

  async updateCategory({ params, request, bouncer, response }: HttpContext) {
    const data = request.only(['name', 'description'])
    try {
      if (await bouncer.denies('canCreateOrDeleteCategory')) {
        return response.status(403).json({ message: 'Unauthorized' })
      }

      const category = await Category.findOrFail(params.categoryId)
      const payload = await categoryValidator.validate(data)

      // Vérifier si le nom existe déjà pour une autre catégorie
      const isCategoryExists = await Category.query()
        .where('name', payload.name)
        .whereNot('id', params.categoryId)
        .first()

      if (isCategoryExists) {
        return response.status(409).json({
          message: 'Category name already exists',
        })
      }

      category.name = payload.name
      category.description = payload.description || null
      await category.save()

      return response.status(200).json({
        message: 'Category updated successfully',
        data: category,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({
          message: 'Category not found',
        })
      }
      if (error.code === 'E_VALIDATION_FAILURE') {
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  }

  async deleteCategory({ params, bouncer, response }: HttpContext) {
    try {
      if (await bouncer.denies('canCreateOrDeleteCategory')) {
        return response.status(403).json({ message: 'Unauthorized' })
      }
      const category = await Category.findOrFail(params.categoryId)
      await category.delete()
      return response.status(200).json({
        message: 'Category deleted successfully',
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({
          message: 'Category not found',
        })
      }
      return response.status(500).json({
        message: 'Internal server error',
        error: error.message,
      })
    }
  }
}
