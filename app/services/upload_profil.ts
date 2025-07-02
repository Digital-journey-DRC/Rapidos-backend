import cloudinary from '#services/cloudinary'

export async function uploadProfilePicture(file: string) {
  return cloudinary.uploader.upload(file, {
    resource_type: 'image',
    folder: 'profiles',
  })
}
