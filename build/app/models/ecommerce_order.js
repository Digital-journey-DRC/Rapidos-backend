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
import PaymentMethod from './payment_method.js';
import User from './user.js';
export var EcommerceOrderStatus;
(function (EcommerceOrderStatus) {
    EcommerceOrderStatus["PENDING_PAYMENT"] = "pending_payment";
    EcommerceOrderStatus["PENDING"] = "pending";
    EcommerceOrderStatus["EN_PREPARATION"] = "en_preparation";
    EcommerceOrderStatus["PRET_A_EXPEDIER"] = "pret_a_expedier";
    EcommerceOrderStatus["ACCEPTE_LIVREUR"] = "accepte_livreur";
    EcommerceOrderStatus["EN_ROUTE"] = "en_route";
    EcommerceOrderStatus["DELIVERED"] = "delivered";
    EcommerceOrderStatus["CANCELLED"] = "cancelled";
    EcommerceOrderStatus["REJECTED"] = "rejected";
})(EcommerceOrderStatus || (EcommerceOrderStatus = {}));
export default class EcommerceOrder extends BaseModel {
    static table = 'ecommerce_orders';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], EcommerceOrder.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], EcommerceOrder.prototype, "orderId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], EcommerceOrder.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], EcommerceOrder.prototype, "clientId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], EcommerceOrder.prototype, "client", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], EcommerceOrder.prototype, "phone", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], EcommerceOrder.prototype, "vendorId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "deliveryPersonId", void 0);
__decorate([
    column({
        prepare: (value) => {
            if (typeof value === 'string')
                return value;
            return JSON.stringify(value);
        },
        consume: (value) => {
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                }
                catch {
                    return [];
                }
            }
            return value || [];
        },
    }),
    __metadata("design:type", Array)
], EcommerceOrder.prototype, "items", void 0);
__decorate([
    column({
        prepare: (value) => {
            if (typeof value === 'string')
                return value;
            return JSON.stringify(value);
        },
        consume: (value) => {
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                }
                catch {
                    return {};
                }
            }
            return value || {};
        },
    }),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "address", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], EcommerceOrder.prototype, "total", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "packagePhoto", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "packagePhotoPublicId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "codeColis", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "firebaseOrderId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "paymentMethodId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "numeroPayment", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "latitude", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "longitude", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "distanceKm", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "deliveryFee", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], EcommerceOrder.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], EcommerceOrder.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => PaymentMethod, {
        foreignKey: 'paymentMethodId',
    }),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "paymentMethod", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'vendorId',
    }),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "vendor", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'clientId',
    }),
    __metadata("design:type", Object)
], EcommerceOrder.prototype, "clientUser", void 0);
//# sourceMappingURL=ecommerce_order.js.map