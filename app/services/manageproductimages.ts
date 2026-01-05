import cloudinary, { initCloudinaryFromDB } from '#services/cloudinary'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { createReadStream } from 'node:fs'
import axios from 'axios'

export interface UploadedProductImage {
  imageUrl: string
  imageType: string
}

/**
 * Upload une image depuis une URL (ex: Unsplash) sur Cloudinary
 * Télécharge l'image depuis l'URL et l'upload sur Cloudinary
 */
export const uploadProductImageFromUrl = async (imageUrl: string): Promise<UploadedProductImage | null> => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null
  }

  try {
    // Charger la config Cloudinary depuis la BD
    await initCloudinaryFromDB()
    
    // Télécharger l'image depuis l'URL
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 secondes de timeout
    })

    // Convertir le buffer en base64 pour Cloudinary
    const base64Image = Buffer.from(response.data, 'binary').toString('base64')
    const dataUri = `data:${response.headers['content-type'] || 'image/jpeg'};base64,${base64Image}`

    // Upload sur Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'image',
      folder: 'products',
    })

    return {
      imageUrl: result.secure_url,
      imageType: result.format,
    }
  } catch (err) {
    console.error('Erreur lors de l\'upload depuis URL:', err)
    throw err
  }
}

/**
 * Upload une image de produit sur Cloudinary (depuis un fichier)
 */
export const uploadProductImage = async (file: MultipartFile): Promise<UploadedProductImage | null> => {
  if (!file.isValid || !file.tmpPath) {
    return null
  }

  try {
    // Charger la config Cloudinary depuis la BD
    await initCloudinaryFromDB()
    
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
 * Supporte à la fois les fichiers multipart et les URLs (ex: Unsplash)
 * Inspiré de manageUploadPromotionImages
 */
export const manageUploadProductImages = async (
  image: MultipartFile | string | null,
  image1: MultipartFile | string | null,
  image2: MultipartFile | string | null,
  image3: MultipartFile | string | null,
  image4: MultipartFile | string | null
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
  // Supporte à la fois les fichiers et les URLs
  if (image) {
    try {
      let result: UploadedProductImage | null = null
      
      // Si c'est une URL (string), utiliser uploadProductImageFromUrl
      if (typeof image === 'string') {
        result = await uploadProductImageFromUrl(image)
      } else {
        // Sinon, c'est un fichier multipart
        result = await uploadProductImage(image)
      }
      
      if (result) {
        uploadedImage = result
      } else {
        errors.push({
          error: 'Image principale invalide',
          clientName: typeof image === 'string' ? image : image.clientName,
        })
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: typeof image === 'string' ? image : image.clientName,
        field: 'image',
      })
    }
  }

  // Upload image1 (optionnel) - Supporte fichiers et URLs
  if (image1) {
    try {
      const result = typeof image1 === 'string' 
        ? await uploadProductImageFromUrl(image1)
        : await uploadProductImage(image1)
      if (result) {
        uploadedImage1 = result
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: typeof image1 === 'string' ? image1 : image1.clientName,
        field: 'image1',
      })
    }
  }

  // Upload image2 (optionnel) - Supporte fichiers et URLs
  if (image2) {
    try {
      const result = typeof image2 === 'string' 
        ? await uploadProductImageFromUrl(image2)
        : await uploadProductImage(image2)
      if (result) {
        uploadedImage2 = result
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: typeof image2 === 'string' ? image2 : image2.clientName,
        field: 'image2',
      })
    }
  }

  // Upload image3 (optionnel) - Supporte fichiers et URLs
  if (image3) {
    try {
      const result = typeof image3 === 'string' 
        ? await uploadProductImageFromUrl(image3)
        : await uploadProductImage(image3)
      if (result) {
        uploadedImage3 = result
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: typeof image3 === 'string' ? image3 : image3.clientName,
        field: 'image3',
      })
    }
  }

  // Upload image4 (optionnel) - Supporte fichiers et URLs
  if (image4) {
    try {
      const result = typeof image4 === 'string' 
        ? await uploadProductImageFromUrl(image4)
        : await uploadProductImage(image4)
      if (result) {
        uploadedImage4 = result
      }
    } catch (err) {
      errors.push({
        error: err,
        clientName: typeof image4 === 'string' ? image4 : image4.clientName,
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

