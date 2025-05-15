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
import { Devise } from '../Enum/devise.js';
import { StatusWallet } from '../Enum/status_wallet.js';
import { TypeoPeration } from '../Enum/type_operation.js';
import User from './user.js';
export default class Wallet extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Wallet.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Wallet.prototype, "userId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Wallet.prototype, "balance", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Wallet.prototype, "currency", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Wallet.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Wallet.prototype, "type", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Wallet.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Wallet.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => User),
    __metadata("design:type", Object)
], Wallet.prototype, "user", void 0);
//# sourceMappingURL=wallet.js.map