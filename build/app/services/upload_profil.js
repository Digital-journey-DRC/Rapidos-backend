import cloudinary from '#services/cloudinary';
export async function uploadProfilePicture(file) {
    return cloudinary.uploader.upload(file, {
        resource_type: 'image',
        folder: 'profiles',
    });
}
//# sourceMappingURL=upload_profil.js.map