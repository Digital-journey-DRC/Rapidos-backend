# 📊 Documentation API - Tracking d'Événements

## 🔗 Base URL
```
http://localhost:3333
```

## 🔐 Authentification
Tous les endpoints sont accessibles **sans authentification obligatoire**. Si un utilisateur est connecté, son `userId` sera automatiquement récupéré. Sinon, `userId` sera `null`.

---

## 📝 Endpoints Disponibles

### 1. **POST /api/events/view-product**
Enregistre une consultation de produit.

**Body:**
```json
{
  "productId": 151,
  "metadata": {
    "source": "homepage",
    "device": "mobile"
  }
}
```

**Réponse 201:**
```json
{
  "message": "Événement view_product enregistré avec succès",
  "event": {
    "id": 1,
    "userId": 123,
    "productId": 151,
    "productCategoryId": 5,
    "productCategoryName": "Électronique",
    "eventType": "view_product",
    "metadata": {
      "source": "homepage",
      "device": "mobile"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. **POST /api/events/add-to-cart**
Enregistre un ajout au panier.

**Body:**
```json
{
  "productId": 151,
  "metadata": {
    "quantity": 2,
    "price": 25000
  }
}
```

**Réponse 201:**
```json
{
  "message": "Événement add_to_cart enregistré avec succès",
  "event": {
    "id": 2,
    "userId": 123,
    "productId": 151,
    "productCategoryId": 5,
    "productCategoryName": "Électronique",
    "eventType": "add_to_cart",
    "metadata": {
      "quantity": 2,
      "price": 25000
    },
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

### 3. **POST /api/events/add-to-wishlist**
Enregistre un ajout en favoris.

**Body:**
```json
{
  "productId": 151,
  "metadata": {
    "source": "product_page"
  }
}
```

**Réponse 201:**
```json
{
  "message": "Événement add_to_wishlist enregistré avec succès",
  "event": {
    "id": 3,
    "userId": 123,
    "productId": 151,
    "productCategoryId": 5,
    "productCategoryName": "Électronique",
    "eventType": "add_to_wishlist",
    "metadata": {
      "source": "product_page"
    },
    "createdAt": "2024-01-15T10:40:00.000Z"
  }
}
```

---

### 4. **POST /api/events/purchase**
Enregistre un achat.

**Body:**
```json
{
  "productId": 151,
  "metadata": {
    "commandeId": 456,
    "quantity": 1,
    "totalPrice": 25000,
    "paymentMethod": "mobile_money"
  }
}
```

**Réponse 201:**
```json
{
  "message": "Événement purchase enregistré avec succès",
  "event": {
    "id": 4,
    "userId": 123,
    "productId": 151,
    "productCategoryId": 5,
    "productCategoryName": "Électronique",
    "eventType": "purchase",
    "metadata": {
      "commandeId": 456,
      "quantity": 1,
      "totalPrice": 25000,
      "paymentMethod": "mobile_money"
    },
    "createdAt": "2024-01-15T10:45:00.000Z"
  }
}
```

---

### 5. **POST /api/events/search**
Enregistre une recherche.

**Body:**
```json
{
  "searchQuery": "chaussures",
  "metadata": {
    "filters": {
      "category": "fashion",
      "priceRange": "0-50000"
    },
    "resultsCount": 15
  }
}
```

**Réponse 201:**
```json
{
  "message": "Événement search enregistré avec succès",
  "event": {
    "id": 5,
    "userId": 123,
    "eventType": "search",
    "searchQuery": "chaussures",
    "metadata": {
      "filters": {
        "category": "fashion",
        "priceRange": "0-50000"
      },
      "resultsCount": 15
    },
    "createdAt": "2024-01-15T10:50:00.000Z"
  }
}
```

---

### 6. **POST /api/events** (Endpoint générique)
Endpoint générique pour enregistrer n'importe quel type d'événement.

**Body:**
```json
{
  "userId": 123,
  "productId": 151,
  "productCategoryId": 5,
  "productCategoryName": "Électronique",
  "eventType": "view_product",
  "searchQuery": null,
  "metadata": {
    "source": "homepage"
  }
}
```

**Types d'événements valides:**
- `view_product`
- `add_to_cart`
- `add_to_wishlist`
- `purchase`
- `search`

---

## 📋 Règles de Validation

### Pour tous les événements SAUF `search`:
- ✅ `productId` est **obligatoire**
- ✅ `searchQuery` doit être `null` ou absent
- ✅ La catégorie du produit sera **automatiquement récupérée** si `productId` est fourni

### Pour l'événement `search`:
- ✅ `searchQuery` est **obligatoire** (minimum 1 caractère)
- ✅ `productId` doit être `null` ou absent
- ✅ `productCategoryId` et `productCategoryName` peuvent être fournis si la recherche est filtrée par catégorie

### Champs optionnels:
- `userId`: Récupéré automatiquement si l'utilisateur est connecté
- `metadata`: Objet JSON libre pour stocker des informations supplémentaires
- `productCategoryId` et `productCategoryName`: Récupérés automatiquement si `productId` est fourni

---

## 💻 Exemples d'Utilisation

### JavaScript/Fetch

```javascript
// View Product
fetch('http://localhost:3333/api/events/view-product', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token // Optionnel
  },
  body: JSON.stringify({
    productId: 151,
    metadata: { source: 'homepage' }
  })
})
.then(res => res.json())
.then(data => console.log(data));

// Add to Cart
fetch('http://localhost:3333/api/events/add-to-cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    productId: 151,
    metadata: { quantity: 2 }
  })
})
.then(res => res.json())
.then(data => console.log(data));

// Search
fetch('http://localhost:3333/api/events/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    searchQuery: 'chaussures',
    metadata: { resultsCount: 15 }
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### cURL

```bash
# View Product
curl -X POST http://localhost:3333/api/events/view-product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 151,
    "metadata": {"source": "homepage"}
  }'

# Add to Cart
curl -X POST http://localhost:3333/api/events/add-to-cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 151,
    "metadata": {"quantity": 2}
  }'

# Purchase
curl -X POST http://localhost:3333/api/events/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 151,
    "metadata": {
      "commandeId": 456,
      "quantity": 1,
      "totalPrice": 25000
    }
  }'

# Search
curl -X POST http://localhost:3333/api/events/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "searchQuery": "chaussures",
    "metadata": {"resultsCount": 15}
  }'
```

---

## 🔧 Utilisation du Service dans le Backend

Si vous voulez logger des événements directement depuis le backend (sans passer par HTTP), utilisez le service `AnalyticsService`:

```typescript
import { AnalyticsService } from '#services/analytics_service'
import { EventType } from '../Enum/event_type.js'

// View Product
await AnalyticsService.logViewProduct(userId, productId, { source: 'homepage' })

// Add to Cart
await AnalyticsService.logAddToCart(userId, productId, { quantity: 2 })

// Add to Wishlist
await AnalyticsService.logAddToWishlist(userId, productId)

// Purchase
await AnalyticsService.logPurchase(userId, productId, {
  commandeId: 456,
  quantity: 1,
  totalPrice: 25000
})

// Search
await AnalyticsService.logSearch(userId, 'chaussures', { resultsCount: 15 })

// Ou utiliser la méthode générique
await AnalyticsService.logEvent({
  userId,
  productId: 151,
  eventType: EventType.VIEW_PRODUCT,
  metadata: { source: 'homepage' }
})
```

---

## ⚠️ Codes d'Erreur HTTP

- **201**: Événement enregistré avec succès
- **422**: Erreur de validation (données invalides)
- **500**: Erreur serveur interne

---

## 📊 Structure de la Base de Données

### Table: `product_events`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INTEGER | Clé primaire |
| `user_id` | INTEGER (nullable) | ID de l'utilisateur |
| `product_id` | INTEGER (nullable) | ID du produit |
| `product_category_id` | INTEGER (nullable) | ID de la catégorie |
| `product_category_name` | VARCHAR(255) (nullable) | Nom de la catégorie (snapshot) |
| `event_type` | VARCHAR(255) | Type d'événement |
| `search_query` | TEXT (nullable) | Requête de recherche |
| `metadata` | JSONB (nullable) | Métadonnées supplémentaires |
| `created_at` | TIMESTAMP | Date de création |

### Index

- `idx_product_events_user_created` sur `(user_id, created_at)`
- `idx_product_events_product_created` sur `(product_id, created_at)`
- `idx_product_events_type_created` sur `(event_type, created_at)`
- `idx_product_events_category_created` sur `(product_category_id, created_at)`

---

## 🚀 Création de la Table

Si la table n'existe pas encore, utilisez l'endpoint temporaire:

```bash
GET http://localhost:3333/api/events/create-table
```

Ou exécutez la migration:

```bash
node ace migration:run
```

---

## 📝 Notes Importantes

1. **Snapshot de catégorie**: Le `productCategoryName` est un snapshot au moment de l'événement. Même si la catégorie change plus tard, l'événement conserve le nom original.

2. **Récupération automatique**: Si `productId` est fourni mais pas `productCategoryId`/`productCategoryName`, le service récupère automatiquement la catégorie du produit.

3. **Utilisateurs non connectés**: Les événements peuvent être enregistrés même si l'utilisateur n'est pas connecté (`userId = null`).

4. **Métadonnées**: Le champ `metadata` accepte n'importe quel objet JSON. Utilisez-le pour stocker des informations contextuelles (source, device, filters, etc.).

