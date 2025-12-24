import cloudinary from '#services/cloudinary';
import { createReadStream } from 'node:fs';
export const uploadPromotionImage = async (file) => {
    if (!file.isValid || !file.tmpPath) {
        return null;
    }
    try {
        const stream = createReadStream(file.tmpPath);
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                resource_type: 'image',
                folder: 'promotions',
            }, (error, myResult) => {
                if (error)
                    reject(error);
                else
                    resolve(myResult);
            });
            stream.pipe(uploadStream);
        });
        return {
            imageUrl: result.secure_url,
            imageType: result.format,
        };
    }
    catch (err) {
        throw err;
    }
};
export const manageUploadPromotionImages = async (image, image1, image2, image3, image4) => {
    const errors = [];
    let uploadedImage = null;
    let uploadedImage1 = null;
    let uploadedImage2 = null;
    let uploadedImage3 = null;
    let uploadedImage4 = null;
    if (image) {
        try {
            const result = await uploadPromotionImage(image);
            if (result) {
                uploadedImage = result.imageUrl;
            }
            else {
                errors.push({
                    error: 'Image principale invalide',
                    clientName: image.clientName,
                });
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: image.clientName,
                field: 'image',
            });
        }
    }
    if (image1) {
        try {
            const result = await uploadPromotionImage(image1);
            if (result) {
                uploadedImage1 = result.imageUrl;
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: image1.clientName,
                field: 'image1',
            });
        }
    }
    if (image2) {
        try {
            const result = await uploadPromotionImage(image2);
            if (result) {
                uploadedImage2 = result.imageUrl;
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: image2.clientName,
                field: 'image2',
            });
        }
    }
    if (image3) {
        try {
            const result = await uploadPromotionImage(image3);
            if (result) {
                uploadedImage3 = result.imageUrl;
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: image3.clientName,
                field: 'image3',
            });
        }
    }
    if (image4) {
        try {
            const result = await uploadPromotionImage(image4);
            if (result) {
                uploadedImage4 = result.imageUrl;
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: image4.clientName,
                field: 'image4',
            });
        }
    }
    return {
        image: uploadedImage,
        image1: uploadedImage1,
        image2: uploadedImage2,
        image3: uploadedImage3,
        image4: uploadedImage4,
        errors,
    };
};
//# sourceMappingURL=managepromotionimages.js.map