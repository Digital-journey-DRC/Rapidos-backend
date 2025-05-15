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
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm';
import Media from './media.js';
import User from './user.js';
import Commande from './commande.js';
export default class Product extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "stock", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Product.prototype, "category", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Product.prototype, "vendeurId", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Product.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Product.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => User),
    __metadata("design:type", Object)
], Product.prototype, "vendeur", void 0);
__decorate([
    manyToMany(() => Commande, {
        pivotTable: 'commande_products',
        localKey: 'id',
        relatedKey: 'id',
        pivotForeignKey: 'product_id',
        pivotRelatedForeignKey: 'commande_id',
        pivotColumns: ['quantity', 'price'],
    }),
    __metadata("design:type", Object)
], Product.prototype, "commandes", void 0);
__decorate([
    manyToMany(() => Media, {
        pivotTable: 'product_media',
        localKey: 'id',
        relatedKey: 'id',
        pivotForeignKey: 'product_id',
        pivotRelatedForeignKey: 'media_id',
    }),
    __metadata("design:type", Object)
], Product.prototype, "media", void 0);
//# sourceMappingURL=product.js.map