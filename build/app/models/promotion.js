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
import Product from './product.js';
export default class Promotion extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Promotion.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Promotion.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Promotion.prototype, "image", void 0);
__decorate([
    column({ columnName: 'image_1' }),
    __metadata("design:type", Object)
], Promotion.prototype, "image1", void 0);
__decorate([
    column({ columnName: 'image_2' }),
    __metadata("design:type", Object)
], Promotion.prototype, "image2", void 0);
__decorate([
    column({ columnName: 'image_3' }),
    __metadata("design:type", Object)
], Promotion.prototype, "image3", void 0);
__decorate([
    column({ columnName: 'image_4' }),
    __metadata("design:type", Object)
], Promotion.prototype, "image4", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Promotion.prototype, "libelle", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Promotion.prototype, "likes", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", DateTime)
], Promotion.prototype, "delaiPromotion", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Promotion.prototype, "nouveauPrix", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Promotion.prototype, "ancienPrix", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Promotion.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Promotion.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => Product, {
        foreignKey: 'productId',
    }),
    __metadata("design:type", Object)
], Promotion.prototype, "product", void 0);
//# sourceMappingURL=promotion.js.map