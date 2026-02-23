import cloudinary, { initCloudinaryFromDB } from '#services/cloudinary'

export async function uploadProfilePicture(file: string) {
  // Charger la config Cloudinary depuis la BD
  await initCloudinaryFromDB()

  const uploadedResult = await cloudinary.uploader.upload(file, {
    resource_type: 'image',
    folder: 'profiles',
  });

  return uploadedResult;
}
