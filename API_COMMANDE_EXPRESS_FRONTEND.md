# 📦 API Commande Express - Guide Frontend

## 🔗 Configuration

**Base URL**
```
http://localhost:3333
```

**Authentication**
Tous les endpoints nécessitent un token Bearer (sauf `/create-table` et `/add-vendor-column`)
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📡 Endpoints

### 1. Créer une Commande Express
```http
POST /commande-express/create
```

**Headers**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body - Commande avec produits (stock géré)**
```json
{
  "clientId": 1,
  "clientName": "Barbine Iduma",
  "clientPhone": "+243828191010",
  "vendorId": 1,
  "packageValue": 1750.00,
  "packageDescription": "2 laptops et 1 souris",
  "pickupAddress": "123 Avenue Kinshasa, Gombe",
  "deliveryAddress": "456 Boulevard Ngaliema, Kinshasa",
  "pickupReference": "Près de la station Total",
  "deliveryReference": "Immeuble bleu, 3ème étage",
  "createdBy": 1,
  "items": [
    {
      "productId": 1,
      "name": "Laptop Dell",
      "price": 850.00,
      "quantity": 2
    }
  ]
}
```

**Body - Commande HORS APP (sans stock)**
```json
{
  "clientId": 1,
  "clientName": "Barbine Iduma",
  "clientPhone": "+243828191010",
  "vendorId": 1,
  "packageValue": 500.00,
  "packageDescription": "Colis personnalisé",
  "pickupAddress": "789 Rue Kasavubu",
  "deliveryAddress": "321 Avenue Lumumba",
  "createdBy": 1,
  "items": [
    {
      "name": "Sac de vêtements",
      "description": "Vêtements à livrer",
      "quantity": 1,
      "weight": "5kg",
      "price": 300.00
    }
  ]
}
```

**Response 201**
```json
{
  "success": true,
  "message": "Commande express créée avec succès",
  "data": {
    "commande": {
      "id": 1,
      "orderId": "uuid-xxx",
      "clientId": 1,
      "vendorId": 1,
      "statut": "pending",
      ...
    },
    "stockUpdates": [...],
    "itemsInfo": {
      "total": 2,
      "withProductManagement": 1,
      "customItems": 1
    }
  }
}
```

**Response 400 - Stock insuffisant**
```json
{
  "success": false,
  "message": "Stock insuffisant pour certains produits",
  "errors": [...]
}
```

---

### 2. Lister Toutes les Commandes
```http
GET /commande-express/list?page=1&limit=20&status=pending
```

**Query Parameters**
- `page` (optionnel, default: 1)
- `limit` (optionnel, default: 20)
- `status` (optionnel): `pending`, `en_cours`, `livre`, `annule`

**Response 200**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "orderId": "uuid-xxx",
        "clientName": "Barbine Iduma",
        "vendorId": 1,
        "packageValue": 1750.00,
        "statut": "pending",
        ...
      }
    ],
    "meta": {
      "total": 50,
      "perPage": 20,
      "currentPage": 1,
      "lastPage": 3
    }
  }
}
```

---

### 3. Mes Commandes (Client)
```http
GET /commande-express/mes-commandes?page=1&limit=20
```

**Query Parameters**
- `page` (optionnel)
- `limit` (optionnel)

**Response 200** : Identique à `/list` mais filtré par client connecté

---

### 4. Mes Commandes (Vendeur)
```http
GET /commande-express/vendeur/mes-commandes?page=1&limit=20&status=pending
```

**Query Parameters**
- `page` (optionnel)
- `limit` (optionnel)
- `status` (optionnel)

**Response 200** : Commandes créées par le vendeur connecté

---

### 5. Détails d'une Commande
```http
GET /commande-express/:id
```

**Exemple**
```bash
GET /commande-express/1
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": "uuid-xxx",
    "clientName": "Barbine Iduma",
    "vendorId": 1,
    "items": [...],
    "statut": "pending",
    ...
  }
}
```

**Response 404**
```json
{
  "success": false,
  "message": "Commande non trouvée"
}
```

---

### 6. Modifier le Statut
```http
PATCH /commande-express/:id/status
```

**Body**
```json
{
  "statut": "en_cours",
  "reason": "Commande en cours de traitement"
}
```

**Statuts valides**: `pending`, `en_cours`, `livre`, `annule`

**Response 200**
```json
{
  "success": true,
  "message": "Statut de la commande mis à jour avec succès",
  "data": { ... }
}
```

---

### 7. Assigner un Livreur
```http
PATCH /commande-express/:id/assign-livreur
```

**Body**
```json
{
  "deliveryPersonId": 5
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Livreur assigné avec succès",
  "data": { ... }
}
```

---

### 8. Supprimer une Commande
```http
DELETE /commande-express/:id
```

**Response 200**
```json
{
  "success": true,
  "message": "Commande supprimée et stock restauré avec succès",
  "data": {
    "deletedCommande": { ... },
    "stockRestored": [...]
  }
}
```

---

### 9. Commandes Disponibles (Livreur)
```http
GET /commande-express/livreur/disponibles?page=1&limit=20
```

**Description**: Commandes en attente sans livreur assigné

**Response 200**
```json
{
  "success": true,
  "data": {
    "data": [...],
    "meta": { ... }
  }
}
```

---

### 10. Mes Livraisons (Livreur)
```http
GET /commande-express/livreur/mes-livraisons?page=1&limit=20&status=en_cours
```

**Query Parameters**
- `page` (optionnel)
- `limit` (optionnel)
- `status` (optionnel)

**Response 200**: Livraisons assignées au livreur connecté

---

## 🧪 Exemples cURL

### Créer une commande
```bash
curl -X POST "http://localhost:3333/commande-express/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "clientName": "Test User",
    "clientPhone": "+243999999999",
    "vendorId": 1,
    "packageValue": 100.00,
    "packageDescription": "Test package",
    "pickupAddress": "Pickup address",
    "deliveryAddress": "Delivery address",
    "createdBy": 1,
    "items": [
      {
        "name": "Item test",
        "quantity": 1,
        "price": 100.00
      }
    ]
  }'
```

### Lister les commandes
```bash
curl -X GET "http://localhost:3333/commande-express/list?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Détails d'une commande
```bash
curl -X GET "http://localhost:3333/commande-express/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Modifier le statut
```bash
curl -X PATCH "http://localhost:3333/commande-express/1/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "en_cours"
  }'
```

### Supprimer une commande
```bash
curl -X DELETE "http://localhost:3333/commande-express/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Champs Items

### Items AVEC productId (produits catalogue)
```typescript
{
  productId: number,      // ID du produit (obligatoire pour gestion stock)
  name: string,          // Nom du produit
  price: number,         // Prix unitaire
  quantity: number       // Quantité
}
```

### Items SANS productId (colis hors app)
```typescript
{
  name: string,          // Nom de l'item (obligatoire)
  description?: string,  // Description (optionnel)
  quantity: number,      // Quantité (obligatoire)
  weight?: string,       // Poids (optionnel, ex: "5kg")
  price?: number        // Prix (optionnel)
}
```

---

## 🎯 Cas d'Usage Frontend

### 1. Créer une commande avec produits du catalogue
```javascript
const createOrderWithProducts = async () => {
  const response = await fetch('http://localhost:3333/commande-express/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: 1,
      clientName: "Client Name",
      clientPhone: "+243999999999",
      vendorId: currentUser.id,
      packageValue: 1000.00,
      packageDescription: "Order description",
      pickupAddress: "Pickup",
      deliveryAddress: "Delivery",
      createdBy: currentUser.id,
      items: [
        {
          productId: 1,
          name: "Product 1",
          price: 500.00,
          quantity: 2
        }
      ]
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Commande créée:', data.data.commande.orderId);
    console.log('Stock mis à jour:', data.data.stockUpdates);
  }
};
```

### 2. Créer une commande hors app (sans produits)
```javascript
const createCustomOrder = async () => {
  const response = await fetch('http://localhost:3333/commande-express/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: 1,
      clientName: "Client Name",
      clientPhone: "+243999999999",
      vendorId: currentUser.id,
      packageValue: 500.00,
      packageDescription: "Custom items",
      pickupAddress: "Pickup",
      deliveryAddress: "Delivery",
      createdBy: currentUser.id,
      items: [
        {
          name: "Vêtements",
          description: "Sac de vêtements personnels",
          quantity: 1,
          weight: "5kg",
          price: 500.00
        }
      ]
    })
  });
  
  const data = await response.json();
};
```

### 3. Récupérer les commandes d'un vendeur
```javascript
const getMyOrders = async (page = 1, status = null) => {
  let url = `http://localhost:3333/commande-express/vendeur/mes-commandes?page=${page}&limit=20`;
  if (status) {
    url += `&status=${status}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.data;
};
```

### 4. Modifier le statut d'une commande
```javascript
const updateOrderStatus = async (orderId, newStatus) => {
  const response = await fetch(`http://localhost:3333/commande-express/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      statut: newStatus,
      reason: "Status updated by vendor"
    })
  });
  
  return await response.json();
};
```

---

## ⚠️ Points Importants

### Authentification
- Token requis pour tous les endpoints (sauf create-table et add-vendor-column)
- Token obtenu via `/login` ou `/buyer/initialize`

### Gestion du Stock
- Items **AVEC** `productId` → Stock géré automatiquement
- Items **SANS** `productId` → Pas de gestion stock (colis hors app)
- Une commande peut contenir les deux types d'items

### Statuts des Commandes
- `pending` : En attente
- `en_cours` : En cours de traitement/livraison
- `livre` : Livrée
- `annule` : Annulée

### Pagination
- Default: `page=1`, `limit=20`
- Max recommandé: `limit=100`

---

## 🔗 Ressources

- Documentation complète: `DOCUMENTATION_COMMANDE_EXPRESS.md`
- Guide utilisateur: `GUIDE_COMMANDE_EXPRESS.md`

---

**✅ API Prête pour l'intégration Frontend !**
