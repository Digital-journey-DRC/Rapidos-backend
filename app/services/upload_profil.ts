import cloudinary from '#services/cloudinary'

export async function uploadProfilePicture(file: string) {

  const uploadedResult = await cloudinary.uploader.upload(file, {
    resource_type: 'image',
    folder: 'profiles',
  });

  return uploadedResult;
}
