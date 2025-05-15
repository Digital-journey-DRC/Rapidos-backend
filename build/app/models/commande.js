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
import { BaseModel, belongsTo, column, hasOne, manyToMany } from '@adonisjs/lucid/orm';
import User from './user.js';
import Product from './product.js';
import Paiement from './paiement.js';
export default class Commande extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Commande.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Commande.prototype, "userId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Commande.prototype, "totalPrice", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Commande.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Commande.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => User),
    __metadata("design:type", Object)
], Commande.prototype, "user", void 0);
__decorate([
    hasOne(() => Paiement, {
        foreignKey: 'commandeId',
        localKey: 'id',
    }),
    __metadata("design:type", Object)
], Commande.prototype, "paiement", void 0);
__decorate([
    manyToMany(() => Product, {
        pivotTable: 'commande_products',
        localKey: 'id',
        relatedKey: 'id',
        pivotForeignKey: 'commande_id',
        pivotRelatedForeignKey: 'product_id',
        pivotColumns: ['quantity', 'price'],
    }),
    __metadata("design:type", Object)
], Commande.prototype, "products", void 0);
//# sourceMappingURL=commande.js.map