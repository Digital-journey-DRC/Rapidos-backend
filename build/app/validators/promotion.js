import vine from '@vinejs/vine';
export const createPromotionValidator = vine.compile(vine.object({
    productId: vine.number().positive(),
    image: vine.string().trim().minLength(1),
    image1: vine.string().trim().optional().nullable(),
    image2: vine.string().trim().optional().nullable(),
    image3: vine.string().trim().optional().nullable(),
    image4: vine.string().trim().optional().nullable(),
    libelle: vine.string().trim().escape().minLength(2).maxLength(200),
    likes: vine.number().min(0).optional(),
    delaiPromotion: vine.date(),
    nouveauPrix: vine.number().positive(),
    ancienPrix: vine.number().positive(),
}));
export const updatePromotionValidator = vine.compile(vine.object({
    productId: vine.number().positive().optional(),
    image: vine.string().trim().minLength(1).optional(),
    image1: vine.string().trim().optional().nullable(),
    image2: vine.string().trim().optional().nullable(),
    image3: vine.string().trim().optional().nullable(),
    image4: vine.string().trim().optional().nullable(),
    libelle: vine.string().trim().escape().minLength(2).maxLength(200).optional(),
    likes: vine.number().min(0).optional(),
    delaiPromotion: vine.date().optional(),
    nouveauPrix: vine.number().positive().optional(),
    ancienPrix: vine.number().positive().optional(),
}));
//# sourceMappingURL=promotion.js.map