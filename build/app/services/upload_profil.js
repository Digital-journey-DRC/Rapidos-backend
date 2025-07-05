import cloudinary from '#services/cloudinary';
export async function uploadProfilePicture(file) {
    const uploadedResult = await cloudinary.uploader.upload(file, {
        resource_type: 'image',
        folder: 'profiles',
    });
    return uploadedResult;
}
//# sourceMappingURL=upload_profil.js.map