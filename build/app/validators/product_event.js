import vine from '@vinejs/vine';
import { EventType } from '../Enum/event_type.js';
export const createProductEventValidator = vine.compile(vine.object({
    userId: vine.number().optional(),
    productId: vine.number().optional(),
    productCategoryId: vine.number().optional(),
    productCategoryName: vine.string().optional(),
    eventType: vine.enum(Object.values(EventType)),
    searchQuery: vine.string().optional(),
    metadata: vine.any().optional(),
}));
export const viewProductEventValidator = vine.compile(vine.object({
    productId: vine.number(),
    metadata: vine.any().optional(),
}));
export const addToCartEventValidator = vine.compile(vine.object({
    productId: vine.number(),
    metadata: vine.any().optional(),
}));
export const addToWishlistEventValidator = vine.compile(vine.object({
    productId: vine.number(),
    metadata: vine.any().optional(),
}));
export const purchaseEventValidator = vine.compile(vine.object({
    productId: vine.number(),
    metadata: vine.any().optional(),
}));
export const searchEventValidator = vine.compile(vine.object({
    searchQuery: vine.string().minLength(1),
    metadata: vine.any().optional(),
}));
//# sourceMappingURL=product_event.js.map