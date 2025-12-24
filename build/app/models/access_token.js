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
export default class AccessToken extends BaseModel {
    static table = 'auth_access_tokens';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], AccessToken.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], AccessToken.prototype, "tokenableId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], AccessToken.prototype, "type", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], AccessToken.prototype, "name", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], AccessToken.prototype, "hash", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], AccessToken.prototype, "abilities", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", Object)
], AccessToken.prototype, "lastUsedAt", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", Object)
], AccessToken.prototype, "expiresAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], AccessToken.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], AccessToken.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'tokenableId',
    }),
    __metadata("design:type", Object)
], AccessToken.prototype, "user", void 0);
//# sourceMappingURL=access_token.js.map