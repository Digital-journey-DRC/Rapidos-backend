# Documentation - Endpoint Mes Livraisons

## 📍 Endpoint
```
GET /commande-express/livreur/mes-livraisons
```

## 🔐 Authentification
**Requise** : Bearer Token (livreur connecté)

## 📝 Description
Récupère toutes les livraisons assignées au livreur connecté. Par défaut, retourne les commandes de **tous les statuts** (pending, en_cours, livre, annule).

## 🎯 Paramètres de requête (Query Parameters)

| Paramètre | Type | Requis | Par défaut | Description |
|-----------|------|--------|------------|-------------|
| `page` | number | Non | 1 | Numéro de la page |
| `limit` | number | Non | 20 | Nombre de résultats par page |
| `status` | string | Non | - | Filtrer par statut (pending, en_cours, livre, annule) |

## 📤 Exemples de requêtes

### 1. Récupérer toutes les livraisons (tous statuts)
```bash
curl -X GET http://localhost:3333/commande-express/livreur/mes-livraisons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Filtrer uniquement les livraisons EN COURS
```bash
curl -X GET "http://localhost:3333/commande-express/livreur/mes-livraisons?status=en_cours" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Filtrer les livraisons LIVRÉES
```bash
curl -X GET "http://localhost:3333/commande-express/livreur/mes-livraisons?status=livre" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Avec pagination (5 résultats par page)
```bash
curl -X GET "http://localhost:3333/commande-express/livreur/mes-livraisons?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 5. Combinaison : Statut + Pagination
```bash
curl -X GET "http://localhost:3333/commande-express/livreur/mes-livraisons?status=en_cours&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 📥 Format de la réponse

### Succès (200)
```json
{
  "success": true,
  "data": {
    "meta": {
      "total": 2,
      "perPage": 20,
      "currentPage": 1,
      "lastPage": 1,
      "firstPage": 1,
      "firstPageUrl": "/?page=1",
      "lastPageUrl": "/?page=1",
      "nextPageUrl": null,
      "previousPageUrl": null
    },
    "data": [
      {
        "id": 2,
        "orderId": "6470e60f-c2a2-4824-b95e-34888effc8d4",
        "clientId": 1,
        "clientName": "Client Test Express",
        "clientPhone": "+243999888777",
        "packageValue": "500.00",
        "packageDescription": "Test commande express - Colis hors app",
        "pickupAddress": "123 Avenue Kinshasa",
        "deliveryAddress": "456 Boulevard Lumumba",
        "pickupReference": "Marche central",
        "deliveryReference": "Face eglise",
        "createdBy": 1,
        "statut": "livre",
        "items": [
          {
            "name": "Documents importants",
            "price": 200,
            "weight": "500g",
            "quantity": 1,
            "description": "Enveloppe scellee"
          },
          {
            "name": "Vetements",
            "price": 300,
            "weight": "3kg",
            "quantity": 1,
            "description": "Sac de vetements"
          }
        ],
        "deliveryPersonId": 5,
        "vendorId": 1,
        "createdAt": "2026-02-23T06:55:42.936+01:00",
        "updatedAt": "2026-02-23T18:44:00.097+01:00"
      }
    ]
  }
}
```

### Erreur - Non authentifié (401)
```json
{
  "errors": [
    {
      "message": "Unauthorized access"
    }
  ]
}
```

### Erreur serveur (500)
```json
{
  "success": false,
  "message": "Erreur lors de la récupération de vos livraisons",
  "error": "Message d'erreur détaillé"
}
```

## 📊 Structure des données

### Objet Livraison
| Champ | Type | Description |
|-------|------|-------------|
| `id` | number | ID unique de la commande |
| `orderId` | string | UUID de la commande |
| `clientId` | number | ID du client |
| `clientName` | string | Nom du client |
| `clientPhone` | string | Téléphone du client |
| `packageValue` | string | Valeur du colis |
| `packageDescription` | string | Description du colis |
| `pickupAddress` | string | Adresse de récupération |
| `deliveryAddress` | string | Adresse de livraison |
| `pickupReference` | string \| null | Point de repère récupération |
| `deliveryReference` | string \| null | Point de repère livraison |
| `statut` | string | Statut: pending, en_cours, livre, annule |
| `items` | array | Liste des articles à livrer |
| `deliveryPersonId` | number | ID du livreur assigné |
| `vendorId` | number | ID du vendeur |
| `createdBy` | number | ID du créateur |
| `createdAt` | string | Date de création (ISO 8601) |
| `updatedAt` | string | Date de mise à jour (ISO 8601) |

### Objet Item
| Champ | Type | Description |
|-------|------|-------------|
| `name` | string | Nom de l'article |
| `description` | string | Description de l'article |
| `price` | number | Prix de l'article |
| `quantity` | number | Quantité |
| `weight` | string | Poids de l'article |

## 🔍 Filtrage des données

### Par défaut (sans paramètre `status`)
**Affiche TOUTES les commandes** où `deliveryPersonId` = ID du livreur connecté, **peu importe le statut**.

### Avec paramètre `status`
**Affiche uniquement** les commandes avec le statut spécifié.

### Valeurs possibles pour `status`
- `pending` - Commandes en attente
- `en_cours` - Commandes en cours de livraison
- `livre` - Commandes livrées
- `annule` - Commandes annulées

## ✅ Points importants

1. **Données dynamiques** : Les données proviennent directement de la base de données et sont mises à jour en temps réel
2. **Filtrage automatique** : Seules les commandes assignées au livreur connecté sont retournées
3. **Pagination** : Limite par défaut de 20 résultats par page
4. **Tri** : Les commandes sont triées par date de création (plus récentes en premier)
5. **Authentification requise** : Le token Bearer doit correspondre à un compte livreur valide

## 🛠️ Tests rapides

### Obtenir le token du livreur
```bash
TOKEN=$(curl -s -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243888777666", "password": "Livreur@123456789"}' \
  | jq -r '.token.token')

echo $TOKEN
```

### Tester l'endpoint
```bash
curl -s -X GET http://localhost:3333/commande-express/livreur/mes-livraisons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
```

## 📌 Cas d'usage typiques

### 1. Afficher toutes mes livraisons dans une app mobile
```javascript
fetch('https://api.example.com/commande-express/livreur/mes-livraisons', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log(`Total: ${data.data.meta.total} livraisons`);
  console.log(data.data.data); // Array de livraisons
});
```

### 2. Afficher uniquement les livraisons en cours
```javascript
fetch('https://api.example.com/commande-express/livreur/mes-livraisons?status=en_cours', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log(`${data.data.meta.total} livraisons en cours`);
});
```

### 3. Pagination infinie (Load more)
```javascript
let currentPage = 1;

async function loadMore() {
  const response = await fetch(
    `https://api.example.com/commande-express/livreur/mes-livraisons?page=${currentPage}&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  if (data.data.meta.nextPageUrl) {
    currentPage++;
    // Afficher "Load More" button
  } else {
    // Toutes les pages chargées
  }
  
  return data.data.data;
}
```

## 🔧 Code source
Fichier: `app/controllers/commande_express_controller.ts`
Méthode: `async mesLivraisons({ request, response, auth }: HttpContext)`

---

**Date de mise à jour** : 25 février 2026  
**Version** : 1.0
