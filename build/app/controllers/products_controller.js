import Category from '#models/category';
import Media from '#models/media';
import Product from '#models/product';
import User from '#models/user';
import ProductEvent from '#models/product_event';
import { manageUploadProductMedias } from '#services/managemedias';
import { manageUploadProductImages } from '#services/manageproductimages';
import { categoryValidator } from '#validators/category';
import { createProductValidator, validateProductStock } from '#validators/products';
import logger from '@adonisjs/core/services/logger';
export default class ProductsController {
    async store({ request, response, auth, bouncer }) {
        const user = auth.user;
        const data = request.only(['description', 'category']);
        if (!user) {
            return response.status(401).json({ message: "Vous n'êtes pas autorisé à faire cette action" });
        }
        try {
            if (await bouncer.denies('createProduct')) {
                return response
                    .status(403)
                    .json({ message: "Vous n'êtes pas autorisé à faire cette action" });
            }
            const dataForCategory = {
                name: data.category,
                description: data.description,
            };
            const vendeurId = user.id;
            const payload = await request.validateUsing(createProductValidator);
            const catData = await categoryValidator.validate(dataForCategory);
            let category = await Category.findBy('name', catData.name);
            if (!category) {
                category = await Category.create({
                    name: catData.name,
                    description: catData.description || `Catégorie ${catData.name}`,
                });
            }
            const product = await Product.create({
                name: payload.name,
                description: payload.description,
                price: payload.price,
                stock: payload.stock,
                categorieId: category.id,
                vendeurId,
            });
            const image = request.file('image') || request.input('image');
            const image1 = request.file('image1') || request.input('image1');
            const image2 = request.file('image2') || request.input('image2');
            const image3 = request.file('image3') || request.input('image3');
            const image4 = request.file('image4') || request.input('image4');
            const productMedia = request.files('medias');
            let errors = [];
            if (image || image1 || image2 || image3 || image4) {
                const { image: uploadedImage, image1: uploadedImage1, image2: uploadedImage2, image3: uploadedImage3, image4: uploadedImage4, errors: uploadErrors, } = await manageUploadProductImages(image || null, image1 || null, image2 || null, image3 || null, image4 || null);
                errors = uploadErrors;
                if (uploadedImage) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage.imageUrl,
                        mediaType: uploadedImage.imageType,
                        productId: product.id,
                    });
                }
                if (uploadedImage1) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage1.imageUrl,
                        mediaType: uploadedImage1.imageType,
                        productId: product.id,
                    });
                }
                if (uploadedImage2) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage2.imageUrl,
                        mediaType: uploadedImage2.imageType,
                        productId: product.id,
                    });
                }
                if (uploadedImage3) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage3.imageUrl,
                        mediaType: uploadedImage3.imageType,
                        productId: product.id,
                    });
                }
                if (uploadedImage4) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage4.imageUrl,
                        mediaType: uploadedImage4.imageType,
                        productId: product.id,
                    });
                }
            }
            else if (productMedia && productMedia.length > 0) {
                const { medias, errors: mediasErrors } = await manageUploadProductMedias(productMedia);
                errors = mediasErrors;
                for (const media of medias) {
                    await product.related('media').create({
                        mediaUrl: media.mediaUrl,
                        mediaType: media.mediaType,
                        productId: product.id,
                    });
                }
            }
            await product.load('media');
            await product.load('category');
            if (errors.length > 0) {
                return response.status(207).json({
                    message: "Produit créé, mais certaines images n'ont pas pu être uploadées.",
                    errors,
                });
            }
            const mediasForProduct = await Media.query().where('productId', product.id);
            return response.created({
                message: 'Produit créé avec succès',
                product,
                medias: mediasForProduct,
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({ message: error.messages });
            }
            if (error.code === 'E_UNAUTHORIZED_ACCESS') {
                return response.status(403).json({ message: error.message });
            }
            if (error.code === 'E_FILE_INVALID' ||
                error.code === 'E_FILE_TOO_LARGE' ||
                error.code === 'E_FILE_UNSUPPORTED_MEDIA_TYPE') {
                return response.status(422).json({ message: error.message });
            }
            console.error(error);
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async getAllProductByUser({ params, response }) {
        const { userId } = params;
        try {
            const products = await Product.query()
                .where('vendeur_id', userId)
                .preload('category')
                .preload('vendeur');
            if (products.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            const productsFormatted = await Promise.all(products.map(async (product) => {
                const allMedias = await Media.query()
                    .where('productId', product.id)
                    .orderBy('created_at', 'asc');
                const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null;
                const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : [];
                const serialized = product.serialize();
                return {
                    id: serialized.id,
                    name: serialized.name,
                    description: serialized.description,
                    price: serialized.price,
                    stock: serialized.stock,
                    category: serialized.category,
                    image: mainImage,
                    images: images,
                    vendeur: serialized.vendeur,
                };
            }));
            return response.status(200).json({ products: productsFormatted });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async getAllProducts({ response }) {
        try {
            const products = await Product.query()
                .preload('category')
                .preload('vendeur');
            if (products.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            const productsFormatted = await Promise.all(products.map(async (product) => {
                const allMedias = await Media.query()
                    .where('productId', product.id)
                    .orderBy('created_at', 'asc');
                const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null;
                const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : [];
                const serialized = product.serialize();
                return {
                    id: serialized.id,
                    name: serialized.name,
                    description: serialized.description,
                    price: serialized.price,
                    stock: serialized.stock,
                    category: serialized.category,
                    image: mainImage,
                    images: images,
                    vendeur: serialized.vendeur,
                };
            }));
            return response.status(200).json({ products: productsFormatted });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async showAllProducts({ response, auth }) {
        try {
            const products = await Product.query()
                .where('vendeur_id', auth.user.id)
                .preload('category')
                .preload('vendeur', (vendeurQuery) => {
                vendeurQuery.preload('profil', (profilQuery) => {
                    profilQuery.preload('media');
                });
            });
            if (products.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            const productsFormatted = await Promise.all(products.map(async (product) => {
                const allMedias = await Media.query()
                    .where('productId', product.id)
                    .orderBy('created_at', 'asc');
                const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null;
                const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : [];
                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    category: product.category,
                    image: mainImage,
                    images: images,
                    vendeur: product.vendeur,
                };
            }));
            return response.status(200).json({ products: productsFormatted });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async getProductByCategory({ response, params }) {
        const { categoryId } = params;
        try {
            const CategoryById = await Category.findOrFail(categoryId);
            if (!CategoryById) {
                return response.status(404).json({ message: 'Catégorie non trouvée' });
            }
            const products = await Product.query()
                .where('categorieId', categoryId)
                .preload('category')
                .preload('vendeur')
                .preload('commandes');
            if (products.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            const productsFormatted = await Promise.all(products.map(async (product) => {
                const allMedias = await Media.query()
                    .where('productId', product.id)
                    .orderBy('created_at', 'asc');
                const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null;
                const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : [];
                const serialized = product.serialize();
                return {
                    id: serialized.id,
                    name: serialized.name,
                    description: serialized.description,
                    price: serialized.price,
                    stock: serialized.stock,
                    category: serialized.category,
                    image: mainImage,
                    images: images,
                    vendeur: serialized.vendeur,
                    commandes: serialized.commandes,
                };
            }));
            return response.status(200).json({ products: productsFormatted });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async getProductById({ params, response }) {
        const { productId, id } = params;
        const productIdValue = productId || id;
        try {
            const product = await Product.query()
                .where('id', productIdValue)
                .preload('category')
                .preload('vendeur')
                .preload('commandes')
                .first();
            if (!product) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            const allMedias = await Media.query()
                .where('productId', product.id)
                .orderBy('created_at', 'asc');
            const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null;
            const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : [];
            const serialized = product.serialize();
            const productFormatted = {
                id: serialized.id,
                name: serialized.name,
                description: serialized.description,
                price: serialized.price,
                stock: serialized.stock,
                category: serialized.category,
                image: mainImage,
                images: images,
                vendeur: serialized.vendeur,
                commandes: serialized.commandes,
            };
            return response.status(200).json({ product: productFormatted });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async updateProduct({ params, response, bouncer, request }) {
        const { productId } = params;
        try {
            const product = await Product.findOrFail(productId);
            if (!product) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            if (await bouncer.denies('canUpdateOrDeleteProduct', product.vendeurId)) {
                return response
                    .status(403)
                    .json({ message: "Vous n'êtes pas autorisé à faire cette action" });
            }
            const payload = await request.validateUsing(createProductValidator);
            let category;
            if (payload.category) {
                category = await Category.findBy('name', payload.category);
                if (!category) {
                    category = await Category.create({
                        name: payload.category,
                        description: `Catégorie ${payload.category}`,
                    });
                }
            }
            product.name = payload.name;
            product.description = payload.description;
            product.price = payload.price;
            product.stock = payload.stock;
            if (category) {
                product.categorieId = category.id;
            }
            await product.save();
            const image = request.file('image');
            const image1 = request.file('image1');
            const image2 = request.file('image2');
            const image3 = request.file('image3');
            const image4 = request.file('image4');
            const productMedia = request.files('medias');
            let errors = [];
            if (image || image1 || image2 || image3 || image4) {
                const { image: uploadedImage, image1: uploadedImage1, image2: uploadedImage2, image3: uploadedImage3, image4: uploadedImage4, errors: uploadErrors, } = await manageUploadProductImages(image || null, image1 || null, image2 || null, image3 || null, image4 || null);
                errors = uploadErrors;
                if (uploadedImage) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage.imageUrl,
                        mediaType: uploadedImage.imageType,
                        productId: product.id,
                    });
                }
                if (uploadedImage1) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage1.imageUrl,
                        mediaType: uploadedImage1.imageType,
                        productId: product.id,
                    });
                }
                if (uploadedImage2) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage2.imageUrl,
                        mediaType: uploadedImage2.imageType,
                        productId: product.id,
                    });
                }
                if (uploadedImage3) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage3.imageUrl,
                        mediaType: uploadedImage3.imageType,
                        productId: product.id,
                    });
                }
                if (uploadedImage4) {
                    await product.related('media').create({
                        mediaUrl: uploadedImage4.imageUrl,
                        mediaType: uploadedImage4.imageType,
                        productId: product.id,
                    });
                }
            }
            else if (productMedia && productMedia.length > 0) {
                const { medias, errors: mediasErrors } = await manageUploadProductMedias(productMedia);
                errors = mediasErrors;
                for (const media of medias) {
                    await product.related('media').create({
                        mediaUrl: media.mediaUrl,
                        mediaType: media.mediaType,
                        productId: product.id,
                    });
                }
            }
            await product.load('category');
            await product.load('vendeur', (vendeurQuery) => {
                vendeurQuery.preload('profil', (profilQuery) => {
                    profilQuery.preload('media');
                });
            });
            const allMedias = await Media.query()
                .where('productId', product.id)
                .orderBy('created_at', 'asc');
            const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null;
            const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : [];
            const productFormatted = {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock,
                category: product.category,
                image: mainImage,
                images: images,
                vendeur: product.vendeur,
            };
            if (errors.length > 0) {
                return response.status(207).json({
                    message: "Produit mis à jour, mais certaines images n'ont pas pu être uploadées.",
                    product: productFormatted,
                    errors,
                });
            }
            return response.status(200).json({
                message: 'Produit mis à jour avec succès',
                product: productFormatted,
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({ message: error.messages });
            }
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            if (error.code === 'E_UNAUTHORIZED_ACCESS') {
                return response.status(403).json({ message: error.message });
            }
            if (error.code === 'E_FILE_INVALID' ||
                error.code === 'E_FILE_TOO_LARGE' ||
                error.code === 'E_FILE_UNSUPPORTED_MEDIA_TYPE') {
                return response.status(422).json({ message: error.message });
            }
            console.error(error);
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async deleteProduct({ params, response, bouncer }) {
        const { productId } = params;
        try {
            const product = await Product.findOrFail(productId);
            if (await bouncer.denies('canUpdateOrDeleteProduct', product.vendeurId)) {
                return response
                    .status(403)
                    .json({ message: "Vous n'êtes pas autorisé à faire cette action" });
            }
            await product.delete();
            return response.status(200).json({ message: 'Produit supprimé avec succès', status: true });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async getVendeurAndTheirProducts({ response }) {
        try {
            const vendeurs = await User.query().where('role', 'vendeur');
            const vendeurWITHProduct = [];
            for (const vendeur of vendeurs) {
                const products = await Product.query().where('vendeur_id', vendeur.id).preload('media');
                if (!products || products.length === 0) {
                    continue;
                }
                let vendeurMedia = null;
                try {
                    const userWithProfile = await User.query()
                        .where('id', vendeur.id)
                        .preload('profil', (query) => {
                        query.preload('media');
                    })
                        .first();
                    if (userWithProfile?.profil?.media) {
                        vendeurMedia = userWithProfile.profil.media;
                    }
                }
                catch (profileError) {
                    console.warn(`Erreur lors de la récupération du profil pour le vendeur ${vendeur.id}:`, profileError.message);
                }
                vendeurWITHProduct.push({
                    vendeur,
                    products,
                    media: vendeurMedia,
                });
            }
            return response.ok({ vendeurWITHProduct });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Aucun vendeur trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async getVendeurById({ response, params }) {
        try {
            const vendeurId = params.id;
            const vendeur = await User.query()
                .where('id', vendeurId)
                .where('role', 'vendeur')
                .preload('profil', (query) => {
                query.preload('media');
            })
                .preload('horairesOuverture')
                .first();
            if (!vendeur) {
                return response.status(404).json({ message: 'Vendeur non trouvé' });
            }
            const products = await Product.query()
                .where('vendeur_id', vendeur.id)
                .preload('media')
                .preload('category');
            let vendeurMedia = null;
            if (vendeur.profil?.media) {
                vendeurMedia = vendeur.profil.media;
            }
            return response.ok({
                message: 'Vendeur récupéré avec succès',
                vendeur: {
                    id: vendeur.id,
                    firstName: vendeur.firstName,
                    lastName: vendeur.lastName,
                    email: vendeur.email,
                    phone: vendeur.phone,
                    role: vendeur.role,
                    userStatus: vendeur.userStatus,
                    createdAt: vendeur.createdAt,
                    updatedAt: vendeur.updatedAt,
                },
                profil: vendeur.profil,
                media: vendeurMedia,
                horairesOuverture: vendeur.horairesOuverture || [],
                products: products,
                totalProducts: products.length,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Vendeur non trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async updateStockForProduct({ params, response, request, bouncer }) {
        const productId = params.productId;
        try {
            const payload = await request.validateUsing(validateProductStock);
            const product = await Product.findOrFail(productId);
            if (await bouncer.denies('canUpdateStock', product.vendeurId)) {
                return response
                    .status(403)
                    .json({ message: "Vous n'êtes pas autorisé à faire cette action" });
            }
            product.stock = payload.stock;
            await product.save();
            return response.status(200).json({
                message: 'Stock mis à jour avec succès',
                product: {
                    id: product.id,
                    name: product.name,
                    stock: product.stock,
                },
            });
        }
        catch (error) {
            logger.error({
                message: 'Erreur lors de la mise à jour du stock',
                error: error.message,
            });
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            if (error.code === 'E_UNAUTHORIZED_ACCESS') {
                return response.status(403).json({ message: error.message });
            }
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({ message: error.messages });
            }
            console.error(error);
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async getRecommendedProducts({ response, auth }) {
        try {
            const userId = auth.user?.id;
            if (!userId) {
                const recentProducts = await Product.query()
                    .where('stock', '>', 0)
                    .preload('category')
                    .preload('vendeur')
                    .orderBy('created_at', 'desc')
                    .limit(5);
                const productIds = recentProducts.map((p) => p.id);
                const allMedias = await Media.query()
                    .whereIn('productId', productIds)
                    .orderBy('product_id', 'asc')
                    .orderBy('created_at', 'asc');
                const mediasByProduct = {};
                for (const media of allMedias) {
                    if (!mediasByProduct[media.productId]) {
                        mediasByProduct[media.productId] = [];
                    }
                    mediasByProduct[media.productId].push(media);
                }
                const productsFormatted = recentProducts.map((product) => {
                    const productMedias = mediasByProduct[product.id] || [];
                    const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null;
                    const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : [];
                    const serialized = product.serialize();
                    return {
                        id: serialized.id,
                        name: serialized.name,
                        description: serialized.description,
                        price: serialized.price,
                        stock: serialized.stock,
                        category: serialized.category,
                        image: mainImage,
                        images: images,
                        vendeur: serialized.vendeur,
                    };
                });
                return response.status(200).json({ products: productsFormatted });
            }
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            let userEvents = [];
            try {
                userEvents = await ProductEvent.query()
                    .where('userId', userId)
                    .where('createdAt', '>=', thirtyDaysAgo.toISOString())
                    .whereNotNull('productCategoryId')
                    .orderBy('createdAt', 'desc')
                    .limit(100);
            }
            catch (error) {
                logger.warn('Table product_events non disponible, retour des produits récents');
                const recentProducts = await Product.query()
                    .where('stock', '>', 0)
                    .preload('category')
                    .preload('vendeur')
                    .orderBy('created_at', 'desc')
                    .limit(5);
                const productIds = recentProducts.map((p) => p.id);
                const allMedias = await Media.query()
                    .whereIn('productId', productIds)
                    .orderBy('product_id', 'asc')
                    .orderBy('created_at', 'asc');
                const mediasByProduct = {};
                for (const media of allMedias) {
                    if (!mediasByProduct[media.productId]) {
                        mediasByProduct[media.productId] = [];
                    }
                    mediasByProduct[media.productId].push(media);
                }
                const productsFormatted = recentProducts.map((product) => {
                    const productMedias = mediasByProduct[product.id] || [];
                    const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null;
                    const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : [];
                    const serialized = product.serialize();
                    return {
                        id: serialized.id,
                        name: serialized.name,
                        description: serialized.description,
                        price: serialized.price,
                        stock: serialized.stock,
                        category: serialized.category,
                        image: mainImage,
                        images: images,
                        vendeur: serialized.vendeur,
                    };
                });
                return response.status(200).json({ products: productsFormatted });
            }
            if (userEvents.length === 0) {
                const recentProducts = await Product.query()
                    .where('stock', '>', 0)
                    .preload('category')
                    .preload('vendeur')
                    .orderBy('created_at', 'desc')
                    .limit(5);
                const productIds = recentProducts.map((p) => p.id);
                const allMedias = await Media.query()
                    .whereIn('productId', productIds)
                    .orderBy('product_id', 'asc')
                    .orderBy('created_at', 'asc');
                const mediasByProduct = {};
                for (const media of allMedias) {
                    if (!mediasByProduct[media.productId]) {
                        mediasByProduct[media.productId] = [];
                    }
                    mediasByProduct[media.productId].push(media);
                }
                const productsFormatted = recentProducts.map((product) => {
                    const productMedias = mediasByProduct[product.id] || [];
                    const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null;
                    const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : [];
                    const serialized = product.serialize();
                    return {
                        id: serialized.id,
                        name: serialized.name,
                        description: serialized.description,
                        price: serialized.price,
                        stock: serialized.stock,
                        category: serialized.category,
                        image: mainImage,
                        images: images,
                        vendeur: serialized.vendeur,
                    };
                });
                return response.status(200).json({ products: productsFormatted });
            }
            const categoryCounts = {};
            const viewedProductIds = new Set();
            for (const event of userEvents) {
                if (event.productCategoryId) {
                    categoryCounts[event.productCategoryId] = (categoryCounts[event.productCategoryId] || 0) + 1;
                }
                if (event.productId) {
                    viewedProductIds.add(event.productId);
                }
            }
            const topCategories = Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([categoryId]) => parseInt(categoryId));
            const recommendedProducts = [];
            const excludedIds = Array.from(viewedProductIds);
            for (const categoryId of topCategories) {
                if (recommendedProducts.length >= 5)
                    break;
                const productsInCategory = await Product.query()
                    .where('categorieId', categoryId)
                    .whereNotIn('id', excludedIds)
                    .where('stock', '>', 0)
                    .preload('category')
                    .preload('vendeur')
                    .orderBy('created_at', 'desc')
                    .limit(5 - recommendedProducts.length);
                for (const product of productsInCategory) {
                    if (recommendedProducts.length >= 5)
                        break;
                    recommendedProducts.push(product);
                    excludedIds.push(product.id);
                }
            }
            if (recommendedProducts.length < 5) {
                const additionalProducts = await Product.query()
                    .whereNotIn('id', excludedIds)
                    .where('stock', '>', 0)
                    .preload('category')
                    .preload('vendeur')
                    .orderBy('created_at', 'desc')
                    .limit(5 - recommendedProducts.length);
                recommendedProducts.push(...additionalProducts);
            }
            const productIds = recommendedProducts.map((p) => p.id);
            const allMedias = await Media.query()
                .whereIn('productId', productIds)
                .orderBy('product_id', 'asc')
                .orderBy('created_at', 'asc');
            const mediasByProduct = {};
            for (const media of allMedias) {
                if (!mediasByProduct[media.productId]) {
                    mediasByProduct[media.productId] = [];
                }
                mediasByProduct[media.productId].push(media);
            }
            const productsFormatted = recommendedProducts.map((product) => {
                const productMedias = mediasByProduct[product.id] || [];
                const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null;
                const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : [];
                const serialized = product.serialize();
                return {
                    id: serialized.id,
                    name: serialized.name,
                    description: serialized.description,
                    price: serialized.price,
                    stock: serialized.stock,
                    category: serialized.category,
                    image: mainImage,
                    images: images,
                    vendeur: serialized.vendeur,
                };
            });
            return response.status(200).json({ products: productsFormatted });
        }
        catch (error) {
            logger.error('Erreur lors de la récupération des produits recommandés', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async getRandomProducts({ response }) {
        try {
            const randomProducts = await Product.query()
                .where('stock', '>', 0)
                .whereNotNull('categorieId')
                .orderByRaw('RANDOM()')
                .limit(10);
            const categoryIds = randomProducts
                .map((p) => p.categorieId)
                .filter((id) => id !== null && id !== undefined);
            let categoriesMap = new Map();
            if (categoryIds.length > 0) {
                const categories = await Category.query().whereIn('id', categoryIds);
                categoriesMap = new Map(categories.map((c) => [c.id, c]));
            }
            if (randomProducts.length === 0) {
                return response.status(404).json({ message: 'Aucun produit trouvé', products: [] });
            }
            const vendeurIds = randomProducts
                .map((p) => p.vendeurId)
                .filter((id) => id !== null && id !== undefined);
            let vendeursMap = new Map();
            if (vendeurIds.length > 0) {
                const vendeurs = await User.query().whereIn('id', vendeurIds);
                vendeursMap = new Map(vendeurs.map((v) => [v.id, v]));
            }
            const productIds = randomProducts.map((p) => p.id);
            const allMedias = await Media.query()
                .whereIn('productId', productIds)
                .orderBy('product_id', 'asc')
                .orderBy('created_at', 'asc');
            const mediasByProduct = {};
            for (const media of allMedias) {
                if (!mediasByProduct[media.productId]) {
                    mediasByProduct[media.productId] = [];
                }
                mediasByProduct[media.productId].push(media);
            }
            const productsFormatted = randomProducts.map((product) => {
                const productMedias = mediasByProduct[product.id] || [];
                const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null;
                const images = productMedias.length > 1 ? productMedias.slice(1).map((media) => media.mediaUrl) : [];
                const categoryData = product.categorieId && categoriesMap.has(product.categorieId)
                    ? categoriesMap.get(product.categorieId)
                    : null;
                const category = categoryData ? categoryData.serialize() : null;
                const vendeur = product.vendeurId && vendeursMap.has(product.vendeurId)
                    ? vendeursMap.get(product.vendeurId).serialize()
                    : null;
                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    category: category,
                    image: mainImage,
                    images: images,
                    vendeur: vendeur,
                };
            });
            return response.status(200).json({ products: productsFormatted });
        }
        catch (error) {
            logger.error('Erreur lors de la récupération des produits aléatoires', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async getProductsByCategoryName({ params, response }) {
        try {
            const { slug } = params;
            const slugMap = {
                'telephones': 'Téléphones & Accessoires',
                'electronique': 'Électronique',
                'vetements': 'Vêtements',
                'restaurants': 'Restaurants',
                'beaute': 'Beauté',
            };
            const categoryName = slugMap[slug.toLowerCase()];
            if (!categoryName) {
                return response.status(404).json({
                    message: 'Catégorie non trouvée',
                    slug,
                    availableSlugs: Object.keys(slugMap)
                });
            }
            const category = await Category.query()
                .where('name', categoryName)
                .first();
            if (!category) {
                return response.status(404).json({
                    message: 'Catégorie non trouvée en base',
                    categoryName
                });
            }
            const products = await Product.query()
                .where('categorieId', category.id)
                .where('stock', '>', 0)
                .preload('category')
                .preload('vendeur');
            if (products.length === 0) {
                return response.status(404).json({
                    message: 'Aucun produit trouvé dans cette catégorie',
                    category: category.serialize()
                });
            }
            const productsFormatted = await Promise.all(products.map(async (product) => {
                const allMedias = await Media.query()
                    .where('productId', product.id)
                    .orderBy('created_at', 'asc');
                const mainImage = allMedias.length > 0 ? allMedias[0].mediaUrl : null;
                const images = allMedias.length > 1 ? allMedias.slice(1).map((media) => media.mediaUrl) : [];
                const serialized = product.serialize();
                return {
                    id: serialized.id,
                    name: serialized.name,
                    description: serialized.description,
                    price: serialized.price,
                    stock: serialized.stock,
                    category: serialized.category,
                    image: mainImage,
                    images: images,
                    vendeur: serialized.vendeur,
                };
            }));
            return response.status(200).json({
                category: category.serialize(),
                total: productsFormatted.length,
                products: productsFormatted
            });
        }
        catch (error) {
            logger.error('Erreur lors de la récupération des produits par catégorie', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=products_controller.js.map