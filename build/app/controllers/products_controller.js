import Category from '#models/category';
import Media from '#models/media';
import Product from '#models/product';
import User from '#models/user';
import { manageUploadProductMedias } from '#services/managemedias';
import { LabelParseCategoryFromFrenchInEnglish } from '#services/parsecategoryfromfrenchinenglish';
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
            const catData = await categoryValidator.validate(LabelParseCategoryFromFrenchInEnglish(dataForCategory));
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
            const productMedia = request.files('medias');
            const { medias, errors } = await manageUploadProductMedias(productMedia);
            for (const media of medias) {
                await product.related('media').create({
                    mediaUrl: media.mediaUrl,
                    mediaType: media.mediaType,
                    productId: product.id,
                });
            }
            await product.load('media');
            if (errors.length > 0) {
                return response.status(207).json({
                    message: "Produit créé, mais certaines images n'ont pas pu être uploadées.",
                    errors,
                });
            }
            const mediasForProduct = await Media.query().where('product_id', product.id);
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
            const product = await Product.query()
                .where('vendeur_id', userId)
                .preload('media')
                .preload('category')
                .preload('commandes');
            if (product.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            return response.status(200).json({ product });
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
            const products = await Product.query().preload('media');
            if (products.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            return response.status(200).json({ products });
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
            const products = await Product.query().where('vendeur_id', auth.user.id).preload('media');
            if (products.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            return response.status(200).json({ products });
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
                .preload('media')
                .preload('category')
                .preload('commandes');
            if (products.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            return response.status(200).json({ products });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({ message: 'Produit non trouvé', error: error.message });
            }
            return response.status(500).json({ message: 'Erreur serveur interne', error: error.message });
        }
    }
    async getProductById({ params, response }) {
        const { id } = params;
        try {
            const product = await Product.query()
                .where('id', id)
                .preload('media')
                .preload('category')
                .preload('commandes');
            if (product.length === 0) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            return response.status(200).json({ product });
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
            if (await bouncer.denies('canUpdateOrDeleteProduct', productId)) {
                return response
                    .status(403)
                    .json({ message: "Vous n'êtes pas autorisé à faire cette action" });
            }
            const product = await Product.findOrFail(productId);
            if (!product) {
                return response.status(404).json({ message: 'Produit non trouvé' });
            }
            const payload = await request.validateUsing(createProductValidator);
            let category = await Category.findBy('name', payload.category);
            if (!category) {
                category = await Category.create({
                    name: payload.category,
                    description: `Catégorie ${payload.category}`,
                });
            }
            product.name = payload.name;
            product.description = payload.description;
            product.price = payload.price;
            product.stock = payload.stock;
            product.categorieId = category.id;
            await product.save();
            const productMedia = request.files('medias');
            const { medias, errors } = await manageUploadProductMedias(productMedia);
            for (const media of medias) {
                await product.related('media').create({
                    mediaUrl: media.mediaUrl,
                    mediaType: media.mediaType,
                    productId: product.id,
                });
            }
            await product.load('media');
            if (errors.length > 0) {
                return response.status(207).json({
                    message: "Produit mis à jour, mais certaines images n'ont pas pu être uploadées.",
                    errors,
                });
            }
            const mediasForProduct = await Media.query().where('product_id', product.id);
            return response.status(200).json({
                message: 'Produit mis à jour avec succès',
                product,
                medias: mediasForProduct,
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
            if (await bouncer.denies('canUpdateOrDeleteProduct', productId)) {
                return response
                    .status(403)
                    .json({ message: "Vous n'êtes pas autorisé à faire cette action" });
            }
            const product = await Product.findOrFail(productId);
            if (!product) {
                return response.status(404).json({ message: 'Produit non trouvé' });
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
                const product = await Product.query().where('vendeur_id', vendeur.id).preload('media');
                if (!product || product.length === 0) {
                    continue;
                }
                vendeurWITHProduct.push({
                    vendeur,
                    products: product,
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
            product.stock += payload.stock;
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
}
//# sourceMappingURL=products_controller.js.map