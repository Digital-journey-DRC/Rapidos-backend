# 📦 Système de Frais de Livraison Flexible — Documentation

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Les 3 types de frais](#les-3-types-de-frais)
3. [Architecture technique](#architecture-technique)
4. [API Admin](#api-admin)
5. [Exemples CURL](#exemples-curl)
6. [Affichage dans les réponses](#affichage-dans-les-réponses)
7. [Migration et compatibilité](#migration-et-compatibilité)

---

## 🎯 Vue d'ensemble

Le système de frais de livraison permet à l'admin de choisir entre **3 types de calcul** :

1. **Forfaitaire** : Prix fixe partout (ex: 5000 FC)
2. **Par distance** : Base + prix/km (ex: 1000 + distance × 1000)
3. **Par commune** : Prix selon la zone + défaut si inconnue

### Avantages

- ✅ **Flexible** : Changement de type en temps réel
- ✅ **Automatique** : Calcul côté backend transparent
- ✅ **Compatible** : Aucun changement frontend requis
- ✅ **Sécurisé** : Seul l'admin peut modifier

---

## 🎯 Les 3 types de frais

### Type 1 : FORFAITAIRE (`flat`)

**Prix unique pour toutes les commandes**

```json
{
  "activeType": "flat",
  "flatFee": 5000
}
```

**Exemples :**
- Commande à 2 km → **5000 FC**
- Commande à 10 km → **5000 FC**
- Commande à 50 km → **5000 FC**

**Cas d'usage :** Promotions, zones urbaines compactes

---

### Type 2 : PAR DISTANCE (`distance`) — PAR DÉFAUT

**Formule : Base + (Distance × Prix/km)**

```json
{
  "activeType": "distance",
  "distanceBaseFee": 1000,
  "distancePerKmFee": 1000
}
```

**Exemples :**
- 2 km → 1000 + (2 × 1000) = **3000 FC**
- 5 km → 1000 + (5 × 1000) = **6000 FC**
- 10 km → 1000 + (10 × 1000) = **11000 FC**
- 15 km → 1000 + (15 × 1000) = **16000 FC**

**Cas d'usage :** Tarification équitable selon la distance réelle

---

### Type 3 : PAR COMMUNE (`commune`)

**Prix différent selon la zone géographique**

```json
{
  "activeType": "commune",
  "communeDefaultFee": 10000
}
```

**Communes configurées (exemple) :**
| Commune | Prix |
|---------|------|
| Gombe | 6000 FC |
| Limete | 3000 FC |
| Ngaliema | 4000 FC |
| Kintambo | 3500 FC |
| Commune inconnue | 10000 FC (défaut) |

**Cas d'usage :** Zones avec difficultés d'accès variables

---

## 🏗️ Architecture technique

### Tables de base de données

#### 1. `delivery_fee_settings` (Configuration globale)

```sql
CREATE TABLE delivery_fee_settings (
  id SERIAL PRIMARY KEY,
  active_type VARCHAR(20) NOT NULL DEFAULT 'distance',
  flat_fee DECIMAL(10,2),
  distance_base_fee DECIMAL(10,2) DEFAULT 1000,
  distance_per_km_fee DECIMAL(10,2) DEFAULT 1000,
  commune_default_fee DECIMAL(10,2) DEFAULT 10000,
  updated_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

**Une seule ligne dans cette table = configuration active**

#### 2. `commune_delivery_fees` (Prix par commune)

```sql
CREATE TABLE commune_delivery_fees (
  id SERIAL PRIMARY KEY,
  commune_name VARCHAR(100) NOT NULL UNIQUE,
  fee DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

**Plusieurs lignes = une par commune**

---

### Fichiers créés

```
app/models/
  ├─ delivery_fee_settings.ts          ✅ NOUVEAU
  └─ commune_delivery_fee.ts           ✅ NOUVEAU

app/services/
  └─ delivery_fee_calculator.ts        ✅ NOUVEAU

app/controllers/
  └─ delivery_fee_settings_controller.ts  ✅ NOUVEAU

app/validators/
  └─ delivery_fee_settings.ts          ✅ NOUVEAU
```

### Fichiers modifiés

```
app/controllers/
  ├─ ecommerce_orders_controller.ts    ✅ Ligne ~967 modifiée
  └─ express_orders_controller.ts      ✅ Ligne ~137 modifiée

start/
  └─ routes.ts                         ✅ 6 routes admin ajoutées
```

---

## 📱 API Admin

### Authentification

Toutes les routes nécessitent un token Bearer :

```bash
Authorization: Bearer {token}
```

---

### 1. Voir la configuration actuelle

**Endpoint :** `GET /admin/delivery-fee-settings`

**Réponse :**
```json
{
  "success": true,
  "settings": {
    "activeType": "distance",
    "flatFee": null,
    "distanceBaseFee": "1000.00",
    "distancePerKmFee": "1000.00",
    "communeDefaultFee": "10000.00"
  }
}
```

---

### 2. Modifier la configuration

**Endpoint :** `PUT /admin/delivery-fee-settings`

**Body (Forfaitaire) :**
```json
{
  "activeType": "flat",
  "flatFee": 5000
}
```

**Body (Distance) :**
```json
{
  "activeType": "distance",
  "distanceBaseFee": 1500,
  "distancePerKmFee": 800
}
```

**Body (Commune) :**
```json
{
  "activeType": "commune",
  "communeDefaultFee": 10000
}
```

---

### 3. Lister toutes les communes

**Endpoint :** `GET /admin/communes`

**Réponse :**
```json
{
  "success": true,
  "communes": [
    {"id": 1, "communeName": "Gombe", "fee": "6000.00", "isActive": true},
    {"id": 2, "communeName": "Limete", "fee": "3000.00", "isActive": true}
  ]
}
```

---

### 4. Ajouter une commune

**Endpoint :** `POST /admin/communes`

**Body :**
```json
{
  "communeName": "Masina",
  "fee": 4500
}
```

---

### 5. Modifier une commune

**Endpoint :** `PUT /admin/communes/:id`

**Body :**
```json
{
  "fee": 7000,
  "isActive": true
}
```

---

### 6. Supprimer une commune

**Endpoint :** `DELETE /admin/communes/:id`

---

## 🧪 Exemples CURL

### Se connecter

```bash
TOKEN=$(curl -s -X POST "http://localhost:3333/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243826016607", "password": "0826016607Makengo@"}' \
  | jq -r '.token.token')
```

---

### Voir la config actuelle

```bash
curl -s "http://localhost:3333/admin/delivery-fee-settings" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

### Changer en type FORFAITAIRE (5000 FC)

```bash
curl -s -X PUT "http://localhost:3333/admin/delivery-fee-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activeType": "flat",
    "flatFee": 5000
  }' | jq '.'
```

---

### Changer en type DISTANCE

```bash
curl -s -X PUT "http://localhost:3333/admin/delivery-fee-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activeType": "distance",
    "distanceBaseFee": 1000,
    "distancePerKmFee": 1000
  }' | jq '.'
```

---

### Changer en type COMMUNE

```bash
curl -s -X PUT "http://localhost:3333/admin/delivery-fee-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activeType": "commune",
    "communeDefaultFee": 10000
  }' | jq '.'
```

---

### Ajouter une commune

```bash
curl -s -X POST "http://localhost:3333/admin/communes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "communeName": "Masina",
    "fee": 4500
  }' | jq '.'
```

---

### Modifier une commune

```bash
curl -s -X PUT "http://localhost:3333/admin/communes/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fee": 7000}' | jq '.'
```

---

### Lister les communes

```bash
curl -s "http://localhost:3333/admin/communes" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 📊 Affichage dans les réponses

### Commandes Express

**Endpoint :** `POST /express/commandes/initialize`

**Réponse :**
```json
{
  "success": true,
  "message": "Commande express initialisée avec succès",
  "order": {
    "orderId": "abc-123",
    "packageValue": 50000,
    "deliveryFee": 13000,           // ✅ Frais de livraison
    "totalAvecLivraison": 63000,    // ✅ Total avec livraison
    "clientName": "John Doe",
    "status": "pending_payment",
    ...
  }
}
```

---

### Commandes E-commerce

**Endpoint :** `POST /ecommerce/commandes/initialize`

**Réponse :**
```json
{
  "success": true,
  "orders": [
    {
      "orderId": "xyz-456",
      "vendeur": {...},
      "products": [...],
      "totalProduits": 50000,
      "deliveryFee": 13000,           // ✅ Frais de livraison
      "distanceKm": 12.68,            // ✅ Distance calculée
      "totalAvecLivraison": 63000,    // ✅ Total avec livraison
      "status": "pending_payment",
      ...
    }
  ],
  "summary": {
    "totalOrders": 1,
    "totalProducts": 50000,
    "totalDelivery": 13000,           // ✅ Somme des frais
    "grandTotal": 63000               // ✅ Total général
  }
}
```

**Tous les détails de prix sont affichés automatiquement !**

---

## 🔄 Migration et compatibilité

### Configuration par défaut

Au déploiement, le système est configuré en mode **DISTANCE** avec les valeurs actuelles :

```json
{
  "activeType": "distance",
  "distanceBaseFee": 1000,
  "distancePerKmFee": 1000,
  "communeDefaultFee": 10000
}
```

**Comportement identique au système précédent** ✅

---

### Communes pré-configurées

10 communes de Kinshasa sont déjà créées :

| Commune | Prix |
|---------|------|
| Gombe | 6000 FC |
| Limete | 3000 FC |
| Ngaliema | 4000 FC |
| Kintambo | 3500 FC |
| Bandalungwa | 3000 FC |
| Kalamu | 3500 FC |
| Barumbu | 4000 FC |
| Kinshasa | 4500 FC |
| Lemba | 3500 FC |
| Matete | 3000 FC |

---

### Garanties

1. ✅ **Aucun code cassé** : Système fonctionne comme avant par défaut
2. ✅ **Compatibilité totale** : Commandes existantes non affectées
3. ✅ **Pas de changement frontend** : Payloads identiques
4. ✅ **Calcul automatique** : Backend gère tout
5. ✅ **Flexible** : Changement de type en temps réel

---

## 🎯 Résumé des endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| **GET** | `/admin/delivery-fee-settings` | Voir config actuelle |
| **PUT** | `/admin/delivery-fee-settings` | Modifier config |
| **GET** | `/admin/communes` | Lister communes |
| **POST** | `/admin/communes` | Ajouter commune |
| **PUT** | `/admin/communes/:id` | Modifier commune |
| **DELETE** | `/admin/communes/:id` | Supprimer commune |

---

## 📞 Support

Pour toute question ou problème :
- Vérifier que le serveur est démarré : `pm2 status`
- Consulter les logs : `pm2 logs rapidos-backend`
- Rebuild si nécessaire : `npm run build && pm2 restart rapidos-backend`

---

✅ **Système opérationnel et testé** — Prêt pour la production ! 🚀
