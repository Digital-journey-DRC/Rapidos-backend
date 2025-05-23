import Category from '#models/category'
import { categoryValidator } from '#validators/category'
import type { HttpContext } from '@adonisjs/core/http'

import { LabelParseCategoryFromFrenchInEnglish } from '#services/parsecategoryfromfrenchinenglish'

export default class CategoriesController {
  async createCategory({ request, bouncer, response }: HttpContext) {
    const data = request.only(['name', 'description'])
    try {
      if (await bouncer.denies('canCreateOrDeleteCategory')) {
        return response.status(403).json({ message: 'Unauthorized' })
      }

      const payload = await categoryValidator.validate(LabelParseCategoryFromFrenchInEnglish(data))

      const isCategoryExists = await Category.findBy('name', payload.name)
      if (isCategoryExists) {
        return response.status(409).json({
          message: 'Category already exists',
        })
      }
      const category = await Category.create({
        name: payload.name,
        description: payload.description,
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
