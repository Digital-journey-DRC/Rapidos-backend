import cloudinary from '#services/cloudinary';
import { createReadStream } from 'node:fs';
export const manageUploadProductMedias = async (medias) => {
    const uploaded = [];
    const errors = [];
    for (const file of medias) {
        if (!file.isValid || !file.tmpPath) {
            errors.push({
                errors: file.errors || ['Invalid file or missing tmpPath'],
                clientName: file.clientName,
            });
            continue;
        }
        try {
            const stream = createReadStream(file.tmpPath);
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    resource_type: 'image',
                    folder: 'products',
                }, (error, myResult) => {
                    if (error)
                        reject(error);
                    else
                        resolve(myResult);
                });
                stream.pipe(uploadStream);
            });
            uploaded.push({
                mediaUrl: result.secure_url,
                mediaType: result.format,
            });
        }
        catch (err) {
            errors.push({ error: err, clientName: file.clientName });
        }
    }
    return {
        medias: uploaded,
        errors,
    };
};
//# sourceMappingURL=managemedias.js.map