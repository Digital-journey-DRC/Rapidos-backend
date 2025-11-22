import cloudinary from '#services/cloudinary'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { createReadStream } from 'node:fs'

export interface UploadedImage {
  imageUrl: string
  imageType: string
}

export interface UploadImageResult {
  images: UploadedImage[]
  errors: any[]
}

/**
 * Upload une image de promotion sur Cloudinary
 */
export const uploadPromotionImage = async (file: MultipartFile): Promise<UploadedImage | null> => {
  if (!file.isValid || !file.tmpPath) {
    return null
  }

  try {
    const stream = createReadStream(file.tmpPath)

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'promotions',
        },
        (error, myResult) => {
          if (error) reject(error)
          else resolve(myResult)
        }
      )

      stream.pipe(uploadStream)
    })

    return {
      imageUrl: result.secure_url,
      imageType: result.format,
    }
  } catch (err) {
    throw err
  }
}

/**
 * Upload plusieurs images de promotion
 */
export const manageUploadPromotionImages = async (
  image: MultipartFile | null,
  image1: MultipartFile | null,
  image2: MultipartFile | null,
  image3: MultipartFile | null,
  image4: MultipartFile | null
): Promise<{
  image: string | null
  image1: string | null
  image2: string | null
  image3: string | null
  image4: string | null
  errors: any[]
}> => {
  const errors: any[] = []
  let uploadedImage: string | null = null
  let uploadedImage1: string | null = null
  let uploadedImage2: string | null = null
  let uploadedImage3: string | null = null
  let uploadedImage4: string | null = null

  // Upload image principale (requis)
  if (image) {
    try {
      const result = await uploadPromotionImage(image)
      if (result) {
        uploadedImage = result.imageUrl
      } else {
        errors.push({
          error: 'Image principale invalide',
          clientName: image.clientName,
        })
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: image.clientName,
        field: 'image',
      })
    }
  }

  // Upload image1 (optionnel)
  if (image1) {
    try {
      const result = await uploadPromotionImage(image1)
      if (result) {
        uploadedImage1 = result.imageUrl
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: image1.clientName,
        field: 'image1',
      })
    }
  }

  // Upload image2 (optionnel)
  if (image2) {
    try {
      const result = await uploadPromotionImage(image2)
      if (result) {
        uploadedImage2 = result.imageUrl
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: image2.clientName,
        field: 'image2',
      })
    }
  }

  // Upload image3 (optionnel)
  if (image3) {
    try {
      const result = await uploadPromotionImage(image3)
      if (result) {
        uploadedImage3 = result.imageUrl
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: image3.clientName,
        field: 'image3',
      })
    }
  }

  // Upload image4 (optionnel)
  if (image4) {
    try {
      const result = await uploadPromotionImage(image4)
      if (result) {
        uploadedImage4 = result.imageUrl
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: image4.clientName,
        field: 'image4',
      })
    }
  }

  return {
    image: uploadedImage,
    image1: uploadedImage1,
    image2: uploadedImage2,
    image3: uploadedImage3,
    image4: uploadedImage4,
    errors,
  }
}

