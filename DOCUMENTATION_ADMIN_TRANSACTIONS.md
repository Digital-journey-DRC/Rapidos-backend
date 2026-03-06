# API Admin Transactions E-Commerce

> Endpoints réservés aux **admin** et **superadmin**. Authentification Bearer token requise.

---

## 1. Lister les transactions

```
GET /admin/transactions
```

Retourne la liste paginée des commandes **livrées** avec le détail du moyen de paiement.

### Query params

| Param          | Type   | Défaut | Description                                                        |
|----------------|--------|--------|--------------------------------------------------------------------|
| `page`         | number | 1      | Numéro de page                                                     |
| `limit`        | number | 20     | Nombre de résultats par page                                       |
| `vendor_id`    | number | —      | Filtrer par vendeur                                                |
| `client_id`    | number | —      | Filtrer par client                                                 |
| `payment_type` | string | —      | Filtrer par type de paiement (`cash`, `mpesa`, `orange_money`, `airtel_money`, `afrimoney`, `visa`, `master_card`) |
| `date_from`    | string | —      | Date de début (`YYYY-MM-DD`)                                       |
| `date_to`      | string | —      | Date de fin (`YYYY-MM-DD`)                                         |

### Exemple

```bash
curl -s "http://localhost:3333/admin/transactions?limit=5&payment_type=cash" \
  -H "Authorization: Bearer <TOKEN>"
```

### Réponse

```json
{
  "success": true,
  "message": "Transactions récupérées avec succès",
  "data": [
    {
      "id": 542,
      "orderId": "a34e74f5-...",
      "status": "delivered",
      "total": "2500.00",
      "deliveryFee": 14338280,
      "distanceKm": "14337.28",
      "numeroPayment": null,
      "codeColis": "7077",
      "createdAt": "2026-01-27T16:10:44.409+01:00",
      "updatedAt": "2026-01-27T16:19:07.413+01:00",
      "client": {
        "id": 7,
        "name": "myinda@gmail.com",
        "phone": "+243816644420",
        "email": "myinda@gmail.com"
      },
      "vendor": {
        "id": 8,
        "firstName": "Informyi",
        "lastName": "Store",
        "phone": "+243990890450",
        "email": "informyi@gmail.com"
      },
      "deliveryPersonId": 5,
      "items": [
        { "productId": 20, "name": "fanta", "price": 2000, "quantity": 1, "idVendeur": 8 }
      ],
      "address": {
        "pays": "RDC",
        "ville": "Kinshasa",
        "commune": "Ngaliema",
        "quartier": "Jolie park",
        "avenue": "Mania",
        "numero": "05"
      },
      "paymentMethod": {
        "id": 7,
        "type": "cash",
        "name": "Cash",
        "description": "Paiement en espèces",
        "imageUrl": "https://res.cloudinary.com/...",
        "numeroCompte": "123456778",
        "nomTitulaire": "Vict",
        "isDefault": false,
        "isActive": true
      }
    }
  ],
  "summary": {
    "totalTransactions": 3,
    "totalRevenue": 15500,
    "totalDeliveryFees": 43015800
  },
  "meta": {
    "total": 3,
    "perPage": 5,
    "currentPage": 1,
    "lastPage": 1,
    "firstPage": 1,
    "hasMorePages": false
  }
}
```

---

## 2. Détail d'une transaction

```
GET /admin/transactions/:id
```

Retourne le détail complet d'une transaction livrée (inclut les infos du livreur, photo colis, coordonnées GPS).

### Exemple

```bash
curl -s "http://localhost:3333/admin/transactions/542" \
  -H "Authorization: Bearer <TOKEN>"
```

### Réponse

```json
{
  "success": true,
  "message": "Transaction récupérée avec succès",
  "data": {
    "id": 542,
    "orderId": "a34e74f5-...",
    "status": "delivered",
    "total": "2500.00",
    "deliveryFee": 14338280,
    "packagePhoto": "https://...",
    "latitude": -4.325,
    "longitude": 15.322,
    "client": { "id": 7, "name": "...", "phone": "...", "email": "..." },
    "vendor": { "id": 8, "firstName": "...", "lastName": "...", "phone": "...", "email": "..." },
    "deliveryPerson": { "id": 5, "firstName": "...", "lastName": "...", "phone": "...", "email": "..." },
    "items": [...],
    "address": {...},
    "paymentMethod": {
      "id": 7,
      "type": "cash",
      "name": "Cash",
      "description": "Paiement en espèces",
      "imageUrl": "https://...",
      "numeroCompte": "123456778",
      "nomTitulaire": "Vict"
    }
  }
}
```

### Erreurs

| Status | Message                  |
|--------|--------------------------|
| 403    | Accès réservé aux admins |
| 404    | Transaction introuvable  |

---

## 3. Statistiques des transactions

```
GET /admin/transactions/stats
```

Retourne les statistiques globales des transactions livrées avec ventilation par moyen de paiement.

### Query params

| Param       | Type   | Description              |
|-------------|--------|--------------------------|
| `date_from` | string | Date de début (YYYY-MM-DD) |
| `date_to`   | string | Date de fin (YYYY-MM-DD)   |

### Exemple

```bash
curl -s "http://localhost:3333/admin/transactions/stats?date_from=2026-01-01&date_to=2026-03-06" \
  -H "Authorization: Bearer <TOKEN>"
```

### Réponse

```json
{
  "success": true,
  "message": "Statistiques des transactions récupérées avec succès",
  "data": {
    "totalTransactions": 3,
    "totalRevenue": 15500,
    "totalDeliveryFees": 43015800,
    "byPaymentMethod": {
      "cash": { "count": 3, "total": 15500 },
      "mpesa": { "count": 0, "total": 0 }
    },
    "withoutPaymentMethod": 0
  }
}
```
