import cloudinary from '#services/cloudinary'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { createReadStream } from 'node:fs'
import { UploadedMedia, UploadResult } from '../types/products.js'

export const manageUploadProductMedias = async (medias: MultipartFile[]): Promise<UploadResult> => {
  const uploaded: UploadedMedia[] = []
  const errors: any[] = []

  for (const file of medias) {
    if (!file.isValid || !file.tmpPath) {
      errors.push({
        errors: file.errors || ['Invalid file or missing tmpPath'],
        clientName: file.clientName,
      })
      continue
    }

    try {
      const stream = createReadStream(file.tmpPath)

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'products',
          },
          (error, myResult) => {
            if (error) reject(error)
            else resolve(myResult)
          }
        )

        stream.pipe(uploadStream)
      })

      uploaded.push({
        mediaUrl: result.secure_url,
        mediaType: result.format,
      })
    } catch (err) {
      errors.push({ error: err, clientName: file.clientName })
    }
  }

  return {
    medias: uploaded,
    errors,
  }
}
