import cloudinary from '#services/cloudinary';
import { createReadStream } from 'node:fs';
import axios from 'axios';
export const uploadProductImageFromUrl = async (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return null;
    }
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
        });
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        const dataUri = `data:${response.headers['content-type'] || 'image/jpeg'};base64,${base64Image}`;
        const result = await cloudinary.uploader.upload(dataUri, {
            resource_type: 'image',
            folder: 'products',
        });
        return {
            imageUrl: result.secure_url,
            imageType: result.format,
        };
    }
    catch (err) {
        console.error('Erreur lors de l\'upload depuis URL:', err);
        throw err;
    }
};
export const uploadProductImage = async (file) => {
    if (!file.isValid || !file.tmpPath) {
        return null;
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
        return {
            imageUrl: result.secure_url,
            imageType: result.format,
        };
    }
    catch (err) {
        throw err;
    }
};
export const manageUploadProductImages = async (image, image1, image2, image3, image4) => {
    const errors = [];
    let uploadedImage = null;
    let uploadedImage1 = null;
    let uploadedImage2 = null;
    let uploadedImage3 = null;
    let uploadedImage4 = null;
    if (image) {
        try {
            let result = null;
            if (typeof image === 'string') {
                result = await uploadProductImageFromUrl(image);
            }
            else {
                result = await uploadProductImage(image);
            }
            if (result) {
                uploadedImage = result;
            }
            else {
                errors.push({
                    error: 'Image principale invalide',
                    clientName: typeof image === 'string' ? image : image.clientName,
                });
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: typeof image === 'string' ? image : image.clientName,
                field: 'image',
            });
        }
    }
    if (image1) {
        try {
            const result = typeof image1 === 'string'
                ? await uploadProductImageFromUrl(image1)
                : await uploadProductImage(image1);
            if (result) {
                uploadedImage1 = result;
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: typeof image1 === 'string' ? image1 : image1.clientName,
                field: 'image1',
            });
        }
    }
    if (image2) {
        try {
            const result = typeof image2 === 'string'
                ? await uploadProductImageFromUrl(image2)
                : await uploadProductImage(image2);
            if (result) {
                uploadedImage2 = result;
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: typeof image2 === 'string' ? image2 : image2.clientName,
                field: 'image2',
            });
        }
    }
    if (image3) {
        try {
            const result = typeof image3 === 'string'
                ? await uploadProductImageFromUrl(image3)
                : await uploadProductImage(image3);
            if (result) {
                uploadedImage3 = result;
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: typeof image3 === 'string' ? image3 : image3.clientName,
                field: 'image3',
            });
        }
    }
    if (image4) {
        try {
            const result = typeof image4 === 'string'
                ? await uploadProductImageFromUrl(image4)
                : await uploadProductImage(image4);
            if (result) {
                uploadedImage4 = result;
            }
        }
        catch (err) {
            errors.push({
                error: err,
                clientName: typeof image4 === 'string' ? image4 : image4.clientName,
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
//# sourceMappingURL=manageproductimages.js.map