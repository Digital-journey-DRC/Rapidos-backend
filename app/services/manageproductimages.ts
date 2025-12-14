import cloudinary from '#services/cloudinary'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { createReadStream } from 'node:fs'

export interface UploadedProductImage {
  imageUrl: string
  imageType: string
}

/**
 * Upload une image de produit sur Cloudinary
 */
export const uploadProductImage = async (file: MultipartFile): Promise<UploadedProductImage | null> => {
  if (!file.isValid || !file.tmpPath) {
    return null
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

    return {
      imageUrl: result.secure_url,
      imageType: result.format,
    }
  } catch (err) {
    throw err
  }
}

/**
 * Upload plusieurs images de produit (image principale + images supplémentaires)
 * Inspiré de manageUploadPromotionImages
 */
export const manageUploadProductImages = async (
  image: MultipartFile | null,
  image1: MultipartFile | null,
  image2: MultipartFile | null,
  image3: MultipartFile | null,
  image4: MultipartFile | null
): Promise<{
  image: UploadedProductImage | null
  image1: UploadedProductImage | null
  image2: UploadedProductImage | null
  image3: UploadedProductImage | null
  image4: UploadedProductImage | null
  errors: any[]
}> => {
  const errors: any[] = []
  let uploadedImage: UploadedProductImage | null = null
  let uploadedImage1: UploadedProductImage | null = null
  let uploadedImage2: UploadedProductImage | null = null
  let uploadedImage3: UploadedProductImage | null = null
  let uploadedImage4: UploadedProductImage | null = null

  // Upload image principale (requis si fournie)
  if (image) {
    try {
      const result = await uploadProductImage(image)
      if (result) {
        uploadedImage = result
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
      const result = await uploadProductImage(image1)
      if (result) {
        uploadedImage1 = result
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
      const result = await uploadProductImage(image2)
      if (result) {
        uploadedImage2 = result
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
      const result = await uploadProductImage(image3)
      if (result) {
        uploadedImage3 = result
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
      const result = await uploadProductImage(image4)
      if (result) {
        uploadedImage4 = result
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

