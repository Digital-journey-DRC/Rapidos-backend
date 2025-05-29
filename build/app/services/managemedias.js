import { cuid } from '@adonisjs/core/helpers';
import path from 'node:path';
export const manageUploadProductMedias = async (medias) => {
    const uploaded = [];
    const errors = [];
    if (medias && medias.length > 0) {
        for (const image of medias) {
            if (!image.isValid) {
                errors.push({
                    errors: image.errors,
                    clientName: image.clientName,
                });
                continue;
            }
            const filename = `${cuid()}.${image.extname}`;
            const uploadPath = path.join('uploads', 'products', filename);
            await image.move(path.join('public', 'uploads', 'products'), {
                name: filename,
                overwrite: true,
            });
            uploaded.push({
                mediaUrl: uploadPath,
                mediaType: image.extname,
            });
        }
    }
    return {
        medias: uploaded,
        errors,
    };
};
//# sourceMappingURL=managemedias.js.map