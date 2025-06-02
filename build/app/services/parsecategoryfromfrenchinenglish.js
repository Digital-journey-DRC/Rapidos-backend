import { LabelToProductCategory, ProductCategory } from '../Enum/product_category.js';
export const LabelParseCategoryFromFrenchInEnglish = (data) => {
    const nameLower = data.name.toLowerCase();
    const translated = LabelToProductCategory[nameLower];
    if (translated) {
        data.name = translated;
    }
    if (!Object.values(ProductCategory).includes(data.name)) {
        return {
            error: 'Catégorie invalide. Utilisez une valeur reconnue.',
        };
    }
    return data;
};
//# sourceMappingURL=parsecategoryfromfrenchinenglish.js.map