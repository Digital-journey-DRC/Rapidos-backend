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
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm';
import { StatusCommande } from '../Enum/status_commande.js';
import Commande from './commande.js';
import User from './user.js';
import Evaluation from './evaluation.js';
import Adresse from './adresse.js';
export default class Livraison extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Livraison.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Livraison.prototype, "commandeId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Livraison.prototype, "adresseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Livraison.prototype, "livreurId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Livraison.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Livraison.prototype, "commentaireId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Livraison.prototype, "codeLivraison", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Livraison.prototype, "numeroSuivi", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Livraison.prototype, "fraisLivraison", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Livraison.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Livraison.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => Commande),
    __metadata("design:type", Object)
], Livraison.prototype, "commande", void 0);
__decorate([
    belongsTo(() => User),
    __metadata("design:type", Object)
], Livraison.prototype, "livreur", void 0);
__decorate([
    hasMany(() => Evaluation),
    __metadata("design:type", Object)
], Livraison.prototype, "evaluations", void 0);
__decorate([
    belongsTo(() => Adresse),
    __metadata("design:type", Object)
], Livraison.prototype, "adresse", void 0);
//# sourceMappingURL=livraison.js.map