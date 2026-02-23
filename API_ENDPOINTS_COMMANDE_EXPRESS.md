# 📡 API Commande Express - Endpoints Essentiels

## 🔗 Configuration

**Base URL**
```
http://localhost:3333
```

**Authentication**
```
Authorization: Bearer YOUR_TOKEN
```

---

## 1️⃣ Créer un Client Express

```http
POST /client-express/create
```

**Body**
```json
{
  "name": "Jean Kabamba",
  "phone": "+243812345678",
  "email": "jean@example.com",
  "defaultAddress": "789 Rue de la Paix, Kinshasa",
  "defaultReference": "Près de la pharmacie",
  "vendorId": 1,
  "notes": "Client régulier"
}
```

**Response 201**
```json
{
  "success": true,
  "message": "Client express créé avec succès",
  "data": {
    "id": 1,
    "name": "Jean Kabamba",
    "phone": "+243812345678",
    "email": "jean@example.com",
    "defaultAddress": "789 Rue de la Paix, Kinshasa",
    "defaultReference": "Près de la pharmacie",
    "vendorId": 1,
    "notes": "Client régulier",
    "createdAt": "2026-02-23T10:30:00.000Z",
    "updatedAt": "2026-02-23T10:30:00.000Z"
  }
}
```

---

## 2️⃣ Liste des Clients

```http
GET /client-express/list?page=1&limit=20&search=
```

**Query Parameters**
- `page` : Numéro de page (default: 1)
- `limit` : Résultats par page (default: 20)
- `search` : Recherche par nom ou téléphone

**Response 200**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Jean Kabamba",
        "phone": "+243812345678",
        "email": "jean@example.com",
        "defaultAddress": "789 Rue de la Paix",
        "vendorId": 1,
        "createdAt": "2026-02-23T10:30:00.000Z"
      }
    ],
    "meta": {
      "total": 25,
      "perPage": 20,
      "currentPage": 1,
      "lastPage": 2
    }
  }
}
```

---

## 3️⃣ Rechercher par Téléphone

```http
GET /client-express/search-by-phone?phone=+243812345678
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jean Kabamba",
    "phone": "+243812345678",
    "email": "jean@example.com",
    "defaultAddress": "789 Rue de la Paix",
    "defaultReference": "Près de la pharmacie",
    "vendorId": 1,
    "notes": "Client régulier"
  }
}
```

**Response 404**
```json
{
  "success": false,
  "message": "Aucun client trouvé avec ce numéro"
}
```

---

## 4️⃣ Créer une Commande Express (Hors App)

```http
POST /commande-express/create
```

**Body - Sans produits (colis hors app)**
```json
{
  "clientId": 1,
  "clientName": "Jean Kabamba",
  "clientPhone": "+243812345678",
  "vendorId": 1,
  "packageValue": 750.00,
  "packageDescription": "Colis urgent - Documents + vêtements",
  "pickupAddress": "789 Rue de la Paix, Kinshasa",
  "deliveryAddress": "321 Avenue des Martyrs, Kinshasa",
  "pickupReference": "Près de la pharmacie",
  "deliveryReference": "Immeuble vert, 2ème étage",
  "createdBy": 1,
  "items": [
    {
      "name": "Documents administratifs",
      "description": "Dossier urgent",
      "quantity": 1,
      "weight": "1kg",
      "price": 250.00
    },
    {
      "name": "Vêtements enfant",
      "description": "Sac de vêtements",
      "quantity": 1,
      "weight": "2kg",
      "price": 500.00
    }
  ]
}
```

**Body - Avec produits (stock géré)**
```json
{
  "clientId": 1,
  "clientName": "Jean Kabamba",
  "clientPhone": "+243812345678",
  "vendorId": 1,
  "packageValue": 1700.00,
  "packageDescription": "Commande catalogue",
  "pickupAddress": "789 Rue de la Paix",
  "deliveryAddress": "321 Avenue des Martyrs",
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

**Response 201**
```json
{
  "success": true,
  "message": "Commande express créée avec succès",
  "data": {
    "commande": {
      "id": 1,
      "orderId": "uuid-xxx-xxx",
      "clientId": 1,
      "clientName": "Jean Kabamba",
      "vendorId": 1,
      "packageValue": 750.00,
      "statut": "pending",
      "items": [...]
    },
    "stockUpdates": null,
    "itemsInfo": {
      "total": 2,
      "withProductManagement": 0,
      "customItems": 2
    }
  }
}
```

---

## 5️⃣ Mes Commandes (Vendeur)

```http
GET /commande-express/vendeur/mes-commandes?page=1&limit=20&status=pending
```

**Query Parameters**
- `page` : Numéro de page
- `limit` : Résultats par page
- `status` : `pending`, `en_cours`, `livre`, `annule`

**Response 200**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "orderId": "uuid-xxx",
        "clientName": "Jean Kabamba",
        "vendorId": 1,
        "packageValue": "750.00",
        "statut": "pending",
        "createdAt": "2026-02-23T10:30:00.000Z"
      }
    ],
    "meta": {
      "total": 10,
      "perPage": 20,
      "currentPage": 1,
      "lastPage": 1
    }
  }
}
```

---

## 6️⃣ Détails d'une Commande

```http
GET /commande-express/:id
```

**Exemple**
```
GET /commande-express/1
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": "uuid-xxx",
    "clientId": 1,
    "clientName": "Jean Kabamba",
    "clientPhone": "+243812345678",
    "vendorId": 1,
    "packageValue": "750.00",
    "packageDescription": "Colis urgent",
    "pickupAddress": "789 Rue de la Paix",
    "deliveryAddress": "321 Avenue des Martyrs",
    "pickupReference": "Près de la pharmacie",
    "deliveryReference": "Immeuble vert",
    "statut": "pending",
    "items": [
      {
        "name": "Documents administratifs",
        "description": "Dossier urgent",
        "quantity": 1,
        "weight": "1kg",
        "price": 250
      }
    ],
    "deliveryPersonId": null,
    "createdAt": "2026-02-23T10:30:00.000Z"
  }
}
```

---

## 7️⃣ Modifier le Statut

```http
PATCH /commande-express/:id/status
```

**Body**
```json
{
  "statut": "en_cours",
  "reason": "Commande prise en charge"
}
```

**Statuts valides** : `pending`, `en_cours`, `livre`, `annule`

**Response 200**
```json
{
  "success": true,
  "message": "Statut de la commande mis à jour avec succès",
  "data": {
    "id": 1,
    "orderId": "uuid-xxx",
    "statut": "en_cours"
  }
}
```

---

## 8️⃣ Commandes Disponibles (Livreurs)

```http
GET /commande-express/livreur/disponibles?page=1&limit=20
```

**Description** : Commandes en attente sans livreur assigné

**Response 200**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "orderId": "uuid-xxx",
        "clientName": "Jean Kabamba",
        "packageValue": "750.00",
        "pickupAddress": "789 Rue de la Paix",
        "deliveryAddress": "321 Avenue des Martyrs",
        "statut": "pending",
        "deliveryPersonId": null
      }
    ],
    "meta": {
      "total": 5,
      "perPage": 20,
      "currentPage": 1
    }
  }
}
```

---

## 🧪 Exemples cURL

### Créer un client
```bash
curl -X POST "http://localhost:3333/client-express/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Kabamba",
    "phone": "+243812345678",
    "vendorId": 1
  }'
```

### Rechercher par téléphone
```bash
curl -X GET "http://localhost:3333/client-express/search-by-phone?phone=%2B243812345678" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer une commande hors app
```bash
curl -X POST "http://localhost:3333/commande-express/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "clientName": "Jean Kabamba",
    "clientPhone": "+243812345678",
    "vendorId": 1,
    "packageValue": 500,
    "packageDescription": "Colis test",
    "pickupAddress": "Adresse pickup",
    "deliveryAddress": "Adresse delivery",
    "createdBy": 1,
    "items": [
      {
        "name": "Documents",
        "quantity": 1,
        "price": 500
      }
    ]
  }'
```

### Mes commandes (vendeur)
```bash
curl -X GET "http://localhost:3333/commande-express/vendeur/mes-commandes?page=1&limit=10" \
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

---

## 💡 Workflow Recommandé

### Créer une commande express

1. **Vérifier si le client existe**
   ```
   GET /client-express/search-by-phone?phone=+243...
   ```

2. **Si client n'existe pas, le créer**
   ```
   POST /client-express/create
   ```

3. **Créer la commande**
   ```
   POST /commande-express/create
   ```

4. **Voir mes commandes**
   ```
   GET /commande-express/vendeur/mes-commandes
   ```

---

## 📝 Notes Importantes

### Items Flexibles
- **Avec `productId`** : Stock géré automatiquement
- **Sans `productId`** : Colis hors app (pas de stock)

### Sécurité
- Tous les endpoints nécessitent un token Bearer
- Vendeurs voient uniquement leurs propres clients/commandes
- Admin voit tout

### Statuts
- `pending` : En attente
- `en_cours` : En cours de traitement
- `livre` : Livrée
- `annule` : Annulée

---

**✅ 8 Endpoints Essentiels Prêts à l'Emploi !**
