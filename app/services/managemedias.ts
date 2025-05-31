import { MultipartFile } from '@adonisjs/core/bodyparser'
import { cuid } from '@adonisjs/core/helpers'
import path from 'node:path'
import { UploadedMedia, UploadResult } from '../types/products.js'

export const manageUploadProductMedias = async (medias: MultipartFile[]): Promise<UploadResult> => {
  const uploaded: UploadedMedia[] = []
  const errors: any[] = []

  if (medias && medias.length > 0) {
    for (const image of medias) {
      if (!image.isValid) {
        errors.push({
          errors: image.errors,
          clientName: image.clientName,
        })
        continue
      }

      const filename = `${cuid()}.${image.extname}`

      await image.move(path.join('public', 'uploads', 'products'), {
        name: filename,
        overwrite: true,
      })

      uploaded.push({
        mediaUrl: `/uploads/products/${filename}`,
        mediaType: image.extname!,
      })
    }
  }

  return {
    medias: uploaded,
    errors,
  }
}
