# Réponses Commandes — Guide Frontend

## Variables de prix

| Affichage          | EcommerceOrder          | CommandeExpress         |
|--------------------|-------------------------|-------------------------|
| Prix du package    | `total`                 | `package_value`         |
| Prix de livraison  | `deliveryFee`           | `deliveryFee`           |
| Prix total         | `totalAvecLivraison`    | `totalAvecLivraison`    |

> Pour les commandes express, `deliveryFee` et `totalAvecLivraison` sont `null` tant qu'un livreur n'a pas accepté la commande.

---

## 1. EcommerceOrder — Body complet (acheteur)

**GET** `/ecommerce/commandes/buyer`

```json
{
  "success": true,
  "message": "Vos commandes récupérées avec succès",
  "orders": [
    {
      "id": 1,
      "orderId": "uuid-xxx",
      "status": "pending",
      "vendeurId": 10,
      "vendeur": {
        "id": 10,
        "firstName": "Jean",
        "lastName": "Dupont",
        "phone": "+243826016607"
      },
      "products": [
        {
          "productId": 5,
          "name": "Laptop HP",
          "price": 850.00,
          "quantity": 1,
          "idVendeur": 10
        }
      ],
      "total": 850.00,
      "deliveryFee": 25.00,
      "distanceKm": 5.2,
      "totalAvecLivraison": 875.00,
      "address": {
        "ville": "Kinshasa",
        "commune": "Limete",
        "quartier": "Industriel",
        "avenue": "Avenue de la Paix",
        "numero": "123",
        "pays": "RDC",
        "codePostale": "1200",
        "refAdresse": "Près de la pharmacie"
      },
      "latitude": -4.3376,
      "longitude": 15.3136,
      "paymentMethod": {
        "id": 1,
        "type": "mobile_money",
        "name": "Airtel Money",
        "imageUrl": "https://...",
        "numeroCompte": "0826016607",
        "nomTitulaire": "Jean Kabamba",
        "isDefault": true,
        "isActive": true
      },
      "deliveryPersonId": null,
      "codeColis": null,
      "packagePhoto": null,
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-15T10:30:00.000Z"
    }
  ],
  "stats": {
    "total": 5,
    "pending_payment": 1,
    "pending": 2,
    "in_preparation": 1,
    "ready_to_ship": 0,
    "in_delivery": 1,
    "delivered": 0,
    "cancelled": 0,
    "rejected": 0
  }
}
```

---

## 2. CommandeExpress — Body complet

**GET** `/commande-express/list`

```json
{
  "success": true,
  "data": {
    "meta": {
      "total": 10,
      "per_page": 20,
      "current_page": 1,
      "last_page": 1,
      "first_page": 1,
      "from": 1,
      "to": 10
    },
    "data": [
      {
        "id": 1,
        "order_id": "uuid-xxx",
        "client_id": 3,
        "client_name": "Marie Kabamba",
        "client_phone": "+243812345678",
        "vendor_id": 10,
        "package_value": 750.50,
        "package_description": "Colis urgent - Documents",
        "pickup_address": "789 Rue de la Paix, Gombe",
        "delivery_address": "321 Avenue des Martyrs, Limete",
        "pickup_reference": "Près de la pharmacie",
        "delivery_reference": "Immeuble vert, 2e étage",
        "created_by": 10,
        "statut": "pending",
        "items": [
          {
            "productId": null,
            "name": "Documents administratifs",
            "description": "Dossier urgent",
            "price": 250.00,
            "quantity": 1,
            "weight": 1,
            "urlProduct": null
          }
        ],
        "delivery_person_id": null,
        "imageColis": null,
        "imageColisPublicId": null,
        "firebaseDocId": null,
        "created_at": "2026-03-15T10:30:00.000Z",
        "updated_at": "2026-03-15T10:30:00.000Z"
      }
    ]
  }
}
```

> **Note :** Dans la commande express, les champs `deliveryFee` et `totalAvecLivraison` ne sont pas présents dans le body tant qu'un livreur n'a pas accepté la commande.
