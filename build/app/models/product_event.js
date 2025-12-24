var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import User from './user.js';
import Product from './product.js';
import Category from './category.js';
import { EventType } from '../Enum/event_type.js';
export default class ProductEvent extends BaseModel {
    static table = 'product_events';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], ProductEvent.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], ProductEvent.prototype, "userId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], ProductEvent.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], ProductEvent.prototype, "productCategoryId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], ProductEvent.prototype, "productCategoryName", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], ProductEvent.prototype, "eventType", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], ProductEvent.prototype, "searchQuery", void 0);
__decorate([
    column({
        prepare: (value) => (value ? JSON.stringify(value) : null),
        consume: (value) => (value ? (typeof value === 'string' ? JSON.parse(value) : value) : null),
    }),
    __metadata("design:type", Object)
], ProductEvent.prototype, "metadata", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], ProductEvent.prototype, "createdAt", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'userId',
    }),
    __metadata("design:type", Object)
], ProductEvent.prototype, "user", void 0);
__decorate([
    belongsTo(() => Product, {
        foreignKey: 'productId',
    }),
    __metadata("design:type", Object)
], ProductEvent.prototype, "product", void 0);
__decorate([
    belongsTo(() => Category, {
        foreignKey: 'productCategoryId',
    }),
    __metadata("design:type", Object)
], ProductEvent.prototype, "category", void 0);
//# sourceMappingURL=product_event.js.map