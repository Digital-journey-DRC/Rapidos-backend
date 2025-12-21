import cloudinary from './cloudinary.js'
import logger from '@adonisjs/core/services/logger'

export class EcommerceCloudinaryService {
  /**
   * Upload package photo to Cloudinary
   */
  async uploadPackagePhoto(filePath: string, orderId: string): Promise<{
    url: string
    publicId: string
  }> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'rapidos/ecommerce-packages',
        public_id: `order_${orderId}_${Date.now()}`,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto:good' },
        ],
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      })

      return {
        url: result.secure_url,
        publicId: result.public_id,
      }
    } catch (error) {
      logger.error('Erreur lors de l\'upload Cloudinary', {
        error: error.message,
        stack: error.stack,
      })
      throw new Error('Échec de l\'upload de la photo')
    }
  }

  /**
   * Delete photo from Cloudinary
   */
  async deletePhoto(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (error) {
      logger.error('Erreur lors de la suppression Cloudinary', {
        error: error.message,
        publicId,
      })
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/)
    return matches ? matches[1] : ''
  }
}

export default new EcommerceCloudinaryService()
