import type { HttpContext } from '@adonisjs/core/http'
import DeliveryFeeSettings from '#models/delivery_fee_settings'
import CommuneDeliveryFee from '#models/commune_delivery_fee'
import { 
  updateDeliveryFeeSettingsValidator,
  createCommuneValidator,
  updateCommuneValidator 
} from '#validators/delivery_fee_settings'
import logger from '@adonisjs/core/services/logger'

export default class DeliveryFeeSettingsController {
  /**
   * GET /admin/delivery-fee-settings
   * Récupérer la configuration actuelle
   */
  async show({ response }: HttpContext) {
    try {
      const settings = await DeliveryFeeSettings.first()

      if (!settings) {
        return response.status(404).json({
          success: false,
          message: 'Configuration non trouvée',
        })
      }

      return response.json({
        success: true,
        settings: {
          activeType: settings.activeType,
          flatFee: settings.flatFee,
          distanceBaseFee: settings.distanceBaseFee,
          distancePerKmFee: settings.distancePerKmFee,
          communeDefaultFee: settings.communeDefaultFee,
        },
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des settings:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la configuration',
      })
    }
  }

  /**
   * PUT /admin/delivery-fee-settings
   * Mettre à jour la configuration
   */
  async update({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateDeliveryFeeSettingsValidator)
      const user = auth.user!

      const settings = await DeliveryFeeSettings.first()

      if (!settings) {
        return response.status(404).json({
          success: false,
          message: 'Configuration non trouvée',
        })
      }

      settings.activeType = payload.activeType
      settings.flatFee = payload.flatFee || null
      settings.distanceBaseFee = payload.distanceBaseFee || null
      settings.distancePerKmFee = payload.distancePerKmFee || null
      settings.communeDefaultFee = payload.communeDefaultFee || settings.communeDefaultFee
      settings.updatedBy = user.id

      await settings.save()

      logger.info(`Admin ${user.id} a modifié la config des frais de livraison: type=${payload.activeType}`)

      return response.json({
        success: true,
        message: 'Configuration mise à jour avec succès',
        settings: {
          activeType: settings.activeType,
          flatFee: settings.flatFee,
          distanceBaseFee: settings.distanceBaseFee,
          distancePerKmFee: settings.distancePerKmFee,
          communeDefaultFee: settings.communeDefaultFee,
        },
      })
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des settings:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration',
      })
    }
  }

  /**
   * GET /admin/communes
   * Lister toutes les communes
   */
  async indexCommunes({ response }: HttpContext) {
    try {
      const communes = await CommuneDeliveryFee.query().orderBy('commune_name', 'asc')

      return response.json({
        success: true,
        communes: communes.map((c) => ({
          id: c.id,
          communeName: c.communeName,
          fee: c.fee,
          isActive: c.isActive,
        })),
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des communes:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des communes',
      })
    }
  }

  /**
   * POST /admin/communes
   * Créer une nouvelle commune
   */
  async createCommune({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(createCommuneValidator)
      const user = auth.user!

      const commune = await CommuneDeliveryFee.create({
        communeName: payload.communeName,
        fee: payload.fee,
        isActive: true,
        createdBy: user.id,
      })

      logger.info(`Admin ${user.id} a créé la commune ${payload.communeName} avec frais ${payload.fee} FC`)

      return response.status(201).json({
        success: true,
        message: 'Commune créée avec succès',
        commune: {
          id: commune.id,
          communeName: commune.communeName,
          fee: commune.fee,
          isActive: commune.isActive,
        },
      })
    } catch (error) {
      logger.error('Erreur lors de la création de la commune:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la commune',
      })
    }
  }

  /**
   * PUT /admin/communes/:id
   * Mettre à jour une commune
   */
  async updateCommune({ request, response, params, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateCommuneValidator)
      const user = auth.user!

      const commune = await CommuneDeliveryFee.find(params.id)

      if (!commune) {
        return response.status(404).json({
          success: false,
          message: 'Commune non trouvée',
        })
      }

      if (payload.fee !== undefined) commune.fee = payload.fee
      if (payload.isActive !== undefined) commune.isActive = payload.isActive
      commune.updatedBy = user.id

      await commune.save()

      logger.info(`Admin ${user.id} a modifié la commune ${commune.communeName}`)

      return response.json({
        success: true,
        message: 'Commune mise à jour avec succès',
        commune: {
          id: commune.id,
          communeName: commune.communeName,
          fee: commune.fee,
          isActive: commune.isActive,
        },
      })
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la commune:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la commune',
      })
    }
  }

  /**
   * DELETE /admin/communes/:id
   * Supprimer une commune
   */
  async deleteCommune({ response, params, auth }: HttpContext) {
    try {
      const user = auth.user!
      const commune = await CommuneDeliveryFee.find(params.id)

      if (!commune) {
        return response.status(404).json({
          success: false,
          message: 'Commune non trouvée',
        })
      }

      const communeName = commune.communeName
      await commune.delete()

      logger.info(`Admin ${user.id} a supprimé la commune ${communeName}`)

      return response.json({
        success: true,
        message: 'Commune supprimée avec succès',
      })
    } catch (error) {
      logger.error('Erreur lors de la suppression de la commune:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la commune',
      })
    }
  }
}
