import vine from '@vinejs/vine';
import { ProductCategory } from '../Enum/product_category.js';
export const categoryValidator = vine.compile(vine.object({
    name: vine.enum(ProductCategory),
    description: vine.string().trim().escape().minLength(2).maxLength(500),
}));
//# sourceMappingURL=category.js.map