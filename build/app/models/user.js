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
import hash from '@adonisjs/core/services/hash';
import { compose } from '@adonisjs/core/helpers';
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm';
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens';
import { UserRole } from '../Enum/user_role.js';
import Profil from './profil.js';
import Adresse from './adresse.js';
import Wallet from './wallet.js';
import AccessToken from './access_token.js';
import HoraireOuverture from './horaire_ouverture.js';
import PaymentMethod from './payment_method.js';
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
    uids: ['email', 'phone'],
    passwordColumnName: 'password',
});
export default class User extends compose(BaseModel, AuthFinder) {
    static accessTokens = DbAccessTokensProvider.forModel(User, {
        expiresIn: '30 days',
    });
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    column({ serializeAs: null }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], User.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", Object)
], User.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], User.prototype, "secureOtp", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], User.prototype, "otpExpiredAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Boolean)
], User.prototype, "termsAccepted", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], User.prototype, "userStatus", void 0);
__decorate([
    hasOne(() => Profil, {
        foreignKey: 'userId',
        localKey: 'id',
    }),
    __metadata("design:type", Object)
], User.prototype, "profil", void 0);
__decorate([
    hasMany(() => Adresse),
    __metadata("design:type", Object)
], User.prototype, "adresses", void 0);
__decorate([
    hasOne(() => Wallet),
    __metadata("design:type", Object)
], User.prototype, "wallet", void 0);
__decorate([
    hasMany(() => AccessToken),
    __metadata("design:type", Object)
], User.prototype, "accessTokens", void 0);
__decorate([
    hasMany(() => HoraireOuverture, {
        foreignKey: 'vendeurId',
    }),
    __metadata("design:type", Object)
], User.prototype, "horairesOuverture", void 0);
__decorate([
    hasMany(() => PaymentMethod, {
        foreignKey: 'vendeurId',
    }),
    __metadata("design:type", Object)
], User.prototype, "paymentMethods", void 0);
//# sourceMappingURL=user.js.map