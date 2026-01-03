import Category from '#models/category';
import Product from '#models/product';
import Media from '#models/media';
import { categoryValidator } from '#validators/category';
export default class CategoriesController {
    async createCategory({ request, bouncer, response }) {
        const data = request.only(['name', 'description']);
        try {
            if (await bouncer.denies('canCreateOrDeleteCategory')) {
                return response.status(403).json({ message: 'Unauthorized' });
            }
            const payload = await categoryValidator.validate(data);
            const isCategoryExists = await Category.findBy('name', payload.name);
            if (isCategoryExists) {
                return response.status(409).json({
                    message: 'Category already exists',
                });
            }
            const category = await Category.create({
                name: payload.name,
                description: payload.description || null,
            });
            return response.status(201).json({
                message: 'Category created successfully',
                data: category,
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Validation failed',
                    errors: error.messages,
                });
            }
            return response.status(500).json({
                message: 'Internal server error',
                error: error.message,
            });
        }
    }
    async getAllCategory({ response }) {
        try {
            const categories = await Category.all();
            return response.ok({
                categories,
                status: 200,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({
                    message: 'pas des catégories existante',
                });
            }
            return response.status(500).json({
                message: 'Internal server error',
                error: error.message,
            });
        }
    }
    async updateCategory({ params, request, bouncer, response }) {
        const data = request.only(['name', 'description']);
        try {
            if (await bouncer.denies('canCreateOrDeleteCategory')) {
                return response.status(403).json({ message: 'Unauthorized' });
            }
            const category = await Category.findOrFail(params.categoryId);
            const payload = await categoryValidator.validate(data);
            const isCategoryExists = await Category.query()
                .where('name', payload.name)
                .whereNot('id', params.categoryId)
                .first();
            if (isCategoryExists) {
                return response.status(409).json({
                    message: 'Category name already exists',
                });
            }
            category.name = payload.name;
            category.description = payload.description || null;
            await category.save();
            return response.status(200).json({
                message: 'Category updated successfully',
                data: category,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({
                    message: 'Category not found',
                });
            }
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Validation failed',
                    errors: error.messages,
                });
            }
            return response.status(500).json({
                message: 'Internal server error',
                error: error.message,
            });
        }
    }
    async deleteCategory({ params, bouncer, response }) {
        try {
            if (await bouncer.denies('canCreateOrDeleteCategory')) {
                return response.status(403).json({ message: 'Unauthorized' });
            }
            const category = await Category.findOrFail(params.categoryId);
            await category.delete();
            return response.status(200).json({
                message: 'Category deleted successfully',
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({
                    message: 'Category not found',
                });
            }
            return response.status(500).json({
                message: 'Internal server error',
                error: error.message,
            });
        }
    }
    async getCategoryByMode({ params, response }) {
        try {
            const mode = params.mode.toLowerCase();
            const modeMapping = {
                'mode': ['Vêtements', 'Beauté'],
                'vetements': ['Vêtements'],
                'electronique': ['Électronique'],
                'beaute': ['Beauté'],
                'restaurants': ['Restaurants'],
                'telephones': ['Téléphones & Accessoires'],
            };
            const categoryNames = modeMapping[mode] || [mode];
            const categories = await Category.query().whereIn('name', categoryNames);
            if (categories.length === 0) {
                return response.status(404).json({
                    message: `Catégorie "${mode}" non trouvée`,
                    status: 404,
                });
            }
            const categoryIds = categories.map(cat => cat.id);
            const products = await Product.query()
                .whereIn('categorie_id', categoryIds)
                .preload('category')
                .preload('vendeur');
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
            const shuffledProducts = productsFormatted.sort(() => Math.random() - 0.5);
            return response.status(200).json({ products: shuffledProducts });
        }
        catch (error) {
            return response.status(500).json({
                message: 'Internal server error',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=categories_controller.js.map