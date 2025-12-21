# MODULE E-COMMERCE ORDERS

## ⚠️ IMPORTANT
Ce module est COMPLÈTEMENT INDÉPENDANT du module `commandes` existant.
**NE PAS TOUCHER** aux fichiers suivants:
- `app/controllers/commandes_controller.ts`
- `app/models/commande.ts`
- `app/models/commande_product.ts`
- Routes `/commandes/*` existantes

---

## 📁 FICHIERS DU MODULE

### Models
- `app/models/ecommerce_order.ts` - Modèle des commandes e-commerce
- `app/models/ecommerce_order_log.ts` - Historique des changements de statut

### Controllers
- `app/controllers/ecommerce_orders_controller.ts` - Gestion complète des commandes

### Services
- `app/services/ecommerce_cloudinary_service.ts` - Upload photos Cloudinary

### Validators
- `app/validators/ecommerce_order.ts` - Validation des données

### Migrations
- `1766326529972_create_create_ecommerce_orders_table.ts`
- `1766326544604_create_create_ecommerce_order_logs_table.ts`

---

## 🚀 INSTALLATION

### 1. Exécuter les migrations
```bash
node ace migration:run
```

### 2. Variables d'environnement
Les variables Cloudinary sont déjà configurées dans `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📡 API ENDPOINTS

### 1. Créer une commande
**POST** `/ecommerce/commandes/store`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "produits": [
    {
      "id": 1,
      "nom": "T-shirt",
      "prix": 5000,
      "quantite": 2,
      "idVendeur": 123
    }
  ],
  "ville": "Kinshasa",
  "commune": "Gombe",
  "quartier": "Downtown",
  "avenue": "Avenue 1",
  "numero": "123",
  "pays": "RDC",
  "codePostale": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "uuid-here",
  "status": "pending",
  "message": "Commande créée avec succès"
}
```

---

### 2. Voir ses commandes (Acheteur)
**GET** `/ecommerce/commandes/acheteur`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "commandes": [...]
}
```

---

### 3. Voir ses commandes (Vendeur)
**GET** `/ecommerce/commandes/vendeur`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "commandes": [...]
}
```

---

### 4. Liste des livraisons (Livreur)
**GET** `/ecommerce/livraison/ma-liste`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "livraison": [...]
}
```

**Statuts inclus:**
- `prêt à expédier`
- `en route pour livraison`
- `delivered`

---

### 5. Mettre à jour le statut
**PATCH** `/ecommerce/commandes/:id/status`

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "status": "colis en cours de préparation",
  "reason": "Optionnel"
}
```

**Response:**
```json
{
  "success": true,
  "order": {...},
  "message": "Statut mis à jour..."
}
```

---

### 6. Prendre une livraison
**POST** `/ecommerce/livraison/:orderId/take`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "order": {...},
  "message": "Livraison prise en charge avec succès"
}
```

**Conditions:**
- Rôle = `livreur`
- Status commande = `prêt à expédier`
- Commande pas déjà assignée

---

### 7. Upload photo du colis
**POST** `/ecommerce/upload/package-photo`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
orderId: "uuid-here"
photo: File (jpg/jpeg/png/webp, max 5MB)
```

**Response:**
```json
{
  "success": true,
  "photoUrl": "https://cloudinary.com/...",
  "message": "Photo uploadée avec succès"
}
```

**Conditions:**
- Rôle = `vendeur`
- Status commande = `colis en cours de préparation`
- Ancienne photo supprimée automatiquement

---

## 📊 STATUTS DE COMMANDE

### Cycle de vie
```
pending
  ↓
colis en cours de préparation (+ photo obligatoire)
  ↓
prêt à expédier
  ↓
en route pour livraison
  ↓
delivered (FINAL)
```

### Annulations possibles
- `pending` → `cancelled` (Client/Vendeur)
- `pending` → `rejected` (Vendeur)
- `en préparation` → `cancelled` (Client/Vendeur)
- `prêt à expédier` → `cancelled` (Tous)
- `en route` → `cancelled` (Livreur avec raison)

---

## 🔒 PERMISSIONS PAR RÔLE

### Client
- ✅ Créer commande
- ✅ Voir ses commandes
- ✅ Annuler (si `pending` ou `en préparation`)

### Vendeur
- ✅ Voir ses commandes
- ✅ Accepter/Rejeter (`pending` → `en préparation` ou `rejected`)
- ✅ Préparer (`en préparation` → `prêt à expédier` avec photo)
- ✅ Annuler
- ✅ Upload photo

### Livreur
- ✅ Voir livraisons disponibles
- ✅ Prendre livraison (`prêt à expédier` → `en route`)
- ✅ Marquer livré (`en route` → `delivered`)
- ✅ Annuler avec raison

---

## 🛠️ RÈGLES MÉTIER

### 1. Photo obligatoire
Pour passer au statut `prêt à expédier`, le vendeur DOIT avoir uploadé une photo du colis.

### 2. Transitions autorisées
Chaque transition est vérifiée selon le statut actuel et le rôle de l'utilisateur.

### 3. Livraison unique
Un livreur ne peut pas prendre une commande déjà assignée à un autre livreur.

### 4. Status final
`delivered` est un statut final, aucune modification n'est possible après.

### 5. Raison pour annulation en route
Si un livreur annule une commande `en route`, une raison est obligatoire.

### 6. Calcul du total
```javascript
total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
```

---

## 📝 LOGS D'HISTORIQUE

Chaque changement de statut est enregistré dans `ecommerce_order_logs`:
- `oldStatus` - Statut précédent
- `newStatus` - Nouveau statut
- `changedBy` - ID utilisateur
- `changedByRole` - Rôle de l'utilisateur
- `reason` - Raison (optionnel)
- `timestamp` - Date/heure

---

## 🖼️ CLOUDINARY

### Configuration
Photos stockées dans: `rapidos/ecommerce-packages/`

### Transformations automatiques
- Resize: 1200x1200 (limit)
- Quality: auto:good

### Formats acceptés
- jpg, jpeg, png, webp

### Taille max
5 MB

### Naming pattern
`order_{orderId}_{timestamp}.ext`

---

## ✅ TESTING

### Créer une commande
```bash
curl -X POST http://localhost:3333/ecommerce/commandes/store \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "produits": [{"id":1,"nom":"Test","prix":1000,"quantite":1,"idVendeur":123}],
    "ville":"Kinshasa","commune":"Gombe","quartier":"Downtown",
    "avenue":"Av 1","numero":"123","pays":"RDC","codePostale":"12345"
  }'
```

### Upload photo
```bash
curl -X POST http://localhost:3333/ecommerce/upload/package-photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "orderId=uuid-here" \
  -F "photo=@/path/to/image.jpg"
```

### Changer statut
```bash
curl -X PATCH http://localhost:3333/ecommerce/commandes/{orderId}/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"colis en cours de préparation"}'
```

---

## 🔍 DÉPANNAGE

### Erreur "Photo obligatoire"
→ Uploader d'abord la photo avec `/ecommerce/upload/package-photo`

### Erreur "Transition non autorisée"
→ Vérifier que le statut actuel permet cette transition

### Erreur "Votre rôle ne permet pas..."
→ Vérifier que le user.role est correct (client/vendeur/livreur)

### Erreur "Commande déjà assignée"
→ Un autre livreur a déjà pris cette livraison

---

## 📈 PROCHAINES ÉTAPES

1. ✅ Migrations exécutées
2. ⏳ Intégration Firebase Cloud Messaging (notifications)
3. ⏳ Webhook pour notifier les vendeurs
4. ⏳ Dashboard analytics

---

**Module créé le:** 21 décembre 2025
**Version:** 1.0.0
