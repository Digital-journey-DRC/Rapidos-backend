import { LabelToProductCategory } from '../Enum/product_category.js';
export const LabelParseCategoryFromFrenchInEnglish = (data) => {
    const nameLower = data.name.toLowerCase();
    const translated = LabelToProductCategory[nameLower];
    if (translated) {
        data.name = translated;
    }
    return data;
};
//# sourceMappingURL=parsecategoryfromfrenchinenglish.js.map