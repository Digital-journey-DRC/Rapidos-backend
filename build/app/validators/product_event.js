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

