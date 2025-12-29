# Documentation API - Système de Commandes Multi-Vendeurs avec GPS

## 📋 Vue d'ensemble

Ce document décrit le système de gestion de commandes e-commerce multi-vendeurs avec calcul automatique des frais de livraison basé sur la distance GPS et gestion des moyens de paiement par vendeur.

### Workflow Complet

```
1. Acheteur initialise commande → Création de sous-commandes par vendeur (status: pending_payment)
2. Acheteur visualise ses commandes → Avec moyens de paiement par défaut
3. Acheteur modifie moyens de paiement → Mise à jour individuelle ou batch
4. Acheteur confirme paiement → Commandes passent de "pending_payment" à "pending"
5. Vendeur voit ses commandes → GET /ecommerce/commandes/vendeur
6. Vendeur commence préparation → PATCH status: "en_preparation" (de "pending" vers "en_preparation")
7. Vendeur upload photo colis → POST /ecommerce/commandes/:id/upload-package-photo (génère code 1: 4 chiffres)
8. Vendeur marque prêt → PATCH status: "pret_a_expedier" (photo + code obligatoires)
9. Livreur accepte commande → POST /ecommerce/livraison/:orderId/take (status: "accepte_livreur")
10. Livreur récupère colis → PATCH status: "en_route" avec code 1 → génère code 2 automatiquement
11. Livreur livre à acheteur → PATCH status: "delivered" avec code 2
```

---

## 🚀 Endpoints Disponibles

### 1. Initialiser une Commande (Création Multi-Vendeurs)

**Endpoint:** `POST /ecommerce/commandes/initialize`

**Description:** Crée automatiquement des sous-commandes séparées par vendeur. Calcule la distance entre l'acheteur et chaque vendeur pour déterminer les frais de livraison. Assigne automatiquement le moyen de paiement par défaut de chaque vendeur.

**Authentification:** Bearer Token requis

**Request Body:**
```json
{
  "products": [
    {
      "productId": 151,
      "quantite": 2
    },
    {
      "productId": 165,
      "quantite": 1
    }
  ],
  "latitude": -4.3276,
  "longitude": 15.3136,
  "address": {
    "pays": "RDC",
    "ville": "Kinshasa",
    "commune": "Ngaliema",
    "quartier": "Joli Parc",
    "avenue": "Avenue de la Liberté",
    "numero": "123",
    "codePostale": "10001"
  }
}
```

**Paramètres:**
- `products` (array, required): Liste des produits à commander
  - `productId` (number, required): ID du produit
  - `quantite` (number, required): Quantité souhaitée
- `latitude` (number, required): Latitude GPS de l'acheteur
- `longitude` (number, required): Longitude GPS de l'acheteur
- `address` (object, optional): Adresse de livraison
  - `pays` (string, optional): Pays
  - `ville` (string, optional): Ville
  - `commune` (string, optional): Commune
  - `quartier` (string, optional): Quartier
  - `avenue` (string, optional): Avenue
  - `numero` (string, optional): Numéro
  - `codePostale` (string, optional): Code postal

**Response Success (201):**
```json
{
  "success": true,
  "message": "2 commande(s) créée(s) avec succès",
  "orders": [
    {
      "id": 1,
      "orderId": "61640d1c-2d0e-416f-a6cc-bb945fc1a707",
      "vendeurId": 114,
      "vendeur": {
        "id": 114,
        "firstName": "Stanislas",
        "lastName": "Makengo",
        "phone": "+243826016607"
      },
      "products": [
        {
          "productId": 151,
          "name": "Jhon foster",
          "price": 25000,
          "quantite": 2,
          "idVendeur": 114,
          "imageUrl": "https://res.cloudinary.com/.../product_main.jpg",
          "images": [
            {
              "id": 45,
              "url": "https://res.cloudinary.com/.../image1.jpg",
              "mediaableType": "App\\Models\\Product"
            },
            {
              "id": 46,
              "url": "https://res.cloudinary.com/.../image2.jpg",
              "mediaableType": "App\\Models\\Product"
            }
          ]
        }
      ],
      "status": "pending_payment",
      "total": "50000.00",
      "distanceKm": "1.56",
      "deliveryFee": 2560,
      "totalAvecLivraison": 52560,
      "latitude": "-4.32760000",
      "longitude": "15.31360000",
      "address": {
        "pays": "",
        "ville": "",
        "avenue": "",
        "numero": "",
        "commune": "",
        "quartier": "",
        "codePostale": ""
      },
      "paymentMethod": {
        "id": 7,
        "type": "orange_money",
        "name": "Orange Money",
        "imageUrl": "https://res.cloudinary.com/.../orange.png",
        "numeroCompte": "0842613999",
        "nomTitulaire": "Stanislas",
        "isDefault": true,
        "isActive": true
      },
      "createdAt": "2025-12-28T17:16:54.478+01:00"
    },
    {
      "id": 2,
      "orderId": "0eea5d08-aa9c-4602-bba2-380509f765af",
      "vendeurId": 152,
      "vendeur": {
        "id": 152,
        "firstName": "informyi",
        "lastName": "store",
        "phone": "+243990890450"
      },
      "products": [
        {
          "productId": 165,
          "name": "garde-robe",
          "price": 100000,
          "quantite": 1,
          "idVendeur": 152,
          "imageUrl": "https://res.cloudinary.com/.../wardrobe.jpg",
          "images": []
        }
      ],
      "status": "pending_payment",
      "total": "100000.00",
      "distanceKm": "6.48",
      "deliveryFee": 7480,
      "totalAvecLivraison": 107480,
      "latitude": "-4.32760000",
      "longitude": "15.31360000",
      "address": {
        "pays": "",
        "ville": "",
        "avenue": "",
        "numero": "",
        "commune": "",
        "quartier": "",
        "codePostale": ""
      },
      "paymentMethod": {
        "id": 1,
        "type": "mpesa",
        "name": "Mpesa",
        "imageUrl": "https://res.cloudinary.com/.../mpesa.png",
        "numeroCompte": "0500123455",
        "nomTitulaire": "Victoire myinda Tshiaponyi",
        "isDefault": true,
        "isActive": true
      },
      "createdAt": "2025-12-28T17:16:55.473+01:00"
    }
  ],
  "summary": {
    "totalOrders": 2,
    "totalAmount": 150000,
    "totalDeliveryFees": 10040,
    "grandTotal": 160040
  }
}
```

**Erreurs Possibles:**
- `400`: Données invalides (latitude/longitude manquantes, products vide)
- `404`: Un ou plusieurs produits introuvables
- `401`: Token d'authentification invalide ou manquant
- `500`: Erreur serveur

**Notes importantes:**
- Chaque vendeur = 1 sous-commande distincte
- Les frais de livraison sont calculés automatiquement: **1000 FC + (distance_km × 1000 FC)**
- Le moyen de paiement par défaut du vendeur est assigné automatiquement
- Statut initial: `pending_payment`
- Les images principales ET secondaires des produits sont retournées

---

### 2. Voir Ses Commandes Actuelles (Acheteur)

**Endpoint:** `GET /ecommerce/commandes/buyer/me`

**Description:** Récupère **uniquement les commandes de la dernière initialisation** (session de commande actuelle). Les commandes créées dans un intervalle de 30 secondes sont considérées comme faisant partie de la même session.

**💡 Note:** Pour voir l'historique complet de toutes vos commandes, utilisez l'endpoint `/ecommerce/commandes/buyer/history` (à venir).

**Authentification:** Bearer Token requis

**Query Parameters (optionnels):**
- `status` (string): Filtrer par statut (pending_payment, pending, en_preparation, etc.)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Vos commandes récupérées avec succès",
  "orders": [
    {
      "id": 4,
      "orderId": "b50688c1-3f35-4858-99df-c588b1d9926b",
      "status": "pending_payment",
      "vendeurId": 152,
      "vendeur": {
        "id": 152,
        "firstName": "informyi",
        "lastName": "store",
        "phone": "+243990890450"
      },
      "products": [
        {
          "name": "garde-robe",
          "price": 100000,
          "quantite": 1,
          "idVendeur": 152,
          "productId": 165
        }
      ],
      "total": "100000.00",
      "deliveryFee": 7480,
      "distanceKm": "6.48",
      "totalAvecLivraison": 107480,
      "address": {
        "pays": "",
        "ville": "",
        "avenue": "",
        "numero": "",
        "commune": "",
        "quartier": "",
        "codePostale": ""
      },
      "latitude": "-4.32760000",
      "longitude": "15.31360000",
      "paymentMethod": {
        "id": 1,
        "type": "mpesa",
        "name": "Mpesa",
        "imageUrl": "https://res.cloudinary.com/.../mpesa.png",
        "numeroCompte": "0500123455",
        "nomTitulaire": "Victoire myinda Tshiaponyi",
        "isDefault": true,
        "isActive": true
      },
      "deliveryPersonId": null,
      "createdAt": "2025-12-28T17:22:08.443+01:00",
      "updatedAt": "2025-12-28T17:22:08.443+01:00"
    }
  ],
  "stats": {
    "total": 4,
    "pending_payment": 4,
    "pending": 0,
    "in_preparation": 0,
    "ready_to_ship": 0,
    "in_delivery": 0,
    "delivered": 0,
    "cancelled": 0,
    "rejected": 0
  }
}
```

**Statuts disponibles:**
- `pending_payment`: En attente de paiement
- `pending`: Commande confirmée
- `en_preparation`: En préparation
- `pret_a_expedier`: Prête à expédier
- `en_route`: En cours de livraison
- `delivered`: Livrée
- `cancelled`: Annulée
- `rejected`: Refusée

---

### 3. Modifier le Moyen de Paiement (Individuel)

**Endpoint:** `PATCH /ecommerce/commandes/:id/payment-method`

**Description:** Met à jour le moyen de paiement pour une commande spécifique. Le moyen de paiement doit appartenir au vendeur de la commande.

**Authentification:** Bearer Token requis

**URL Parameters:**
- `id` (number): ID de la commande

**Request Body:**
```json
{
  "paymentMethodId": 6,
  "numeroPayment": "TXN123456789"
}
```

**Paramètres:**
- `paymentMethodId` (number, required): ID du nouveau moyen de paiement
- `numeroPayment` (string, optional): Numéro de transaction de paiement (requis pour les paiements non-cash)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Moyen de paiement mis à jour avec succès",
  "order": {
    "id": 3,
    "orderId": "1932a070-6bb4-4b15-a94b-03d7d4eafa8e",
    "status": "pending",
    "vendeurId": 114,
    "paymentMethod": {
      "id": 6,
      "type": "mpesa",
      "name": "Mpesa",
      "imageUrl": "https://res.cloudinary.com/.../mpesa.png",
      "numeroCompte": "0826016607",
      "nomTitulaire": "Stanislas Makengo"
    },
    "updatedAt": "2025-12-28T17:41:42.848+01:00"
  }
}
```

**Note:** Le statut passe automatiquement de `pending_payment` à `pending` après la mise à jour du moyen de paiement.

**Erreurs Possibles:**
- `404`: Commande introuvable
- `403`: La commande ne vous appartient pas
- `400`: Le moyen de paiement n'appartient pas au vendeur ou n'est pas actif
- `400`: La commande n'est pas en statut "pending_payment"

---

### 4. Modifier les Moyens de Paiement en Batch (NOUVEAU)

**Endpoint:** `PATCH /ecommerce/commandes/batch-update-payment-methods`

**Description:** Met à jour les moyens de paiement pour plusieurs commandes en une seule requête. Utilise une transaction atomique (tout réussit ou tout échoue). Idéal pour éviter de faire 10+ requêtes séparées.

**Authentification:** Bearer Token requis

**Request Body:**
```json
{
  "updates": [
    { "commandeId": 1, "paymentMethodId": 6, "numeroPayment": "TXN111" },
    { "commandeId": 3, "paymentMethodId": 7, "numeroPayment": "TXN222" },
    { "commandeId": 2, "paymentMethodId": 1 },
    { "commandeId": 4, "paymentMethodId": 1 }
  ]
}
```

**Paramètres:**
- `updates` (array, required): Tableau de mises à jour (minimum 1)
  - `commandeId` (number, required): ID de la commande à modifier
  - `paymentMethodId` (number, required): ID du nouveau moyen de paiement
  - `numeroPayment` (string, optional): Numéro de transaction de paiement

**Response Success (200):**
```json
{
  "success": true,
  "message": "4 commande(s) mise(s) à jour avec succès",
  "orders": [
    {
      "id": 1,
      "orderId": "61640d1c-2d0e-416f-a6cc-bb945fc1a707",
      "vendeurId": 114,
      "status": "pending_payment",
      "total": "50000.00",
      "deliveryFee": 2560,
      "totalAvecLivraison": 52560,
      "paymentMethod": {
        "id": 6,
        "type": "mpesa",
        "name": "Mpesa",
        "imageUrl": "https://res.cloudinary.com/.../mpesa.png",
        "numeroCompte": "0826016607"
      },
      "updatedAt": "2025-12-28T17:52:31.455+01:00"
    },
    {
      "id": 2,
      "orderId": "0eea5d08-aa9c-4602-bba2-380509f765af",
      "vendeurId": 152,
      "status": "pending_payment",
      "total": "100000.00",
      "deliveryFee": 7480,
      "totalAvecLivraison": 107480,
      "paymentMethod": {
        "id": 1,
        "type": "mpesa",
        "name": "Mpesa",
        "imageUrl": "https://res.cloudinary.com/.../mpesa.png",
        "numeroCompte": "0500123455"
      },
      "updatedAt": "2025-12-28T17:16:55.473+01:00"
    }
  ],
  "summary": {
    "totalUpdated": 4,
    "updates": [
      {
        "commandeId": 1,
        "orderId": "61640d1c-2d0e-416f-a6cc-bb945fc1a707",
        "vendeurId": 114,
        "oldPaymentMethodId": 7,
        "newPaymentMethodId": 6
      },
      {
        "commandeId": 3,
        "orderId": "1932a070-6bb4-4b15-a94b-03d7d4eafa8e",
        "vendeurId": 114,
        "oldPaymentMethodId": 6,
        "newPaymentMethodId": 7
      }
    ]
  }
}
```

**Validations effectuées:**
- ✅ Toutes les commandes appartiennent à l'utilisateur connecté
- ✅ Toutes les commandes sont en statut `pending_payment`
- ✅ Chaque moyen de paiement existe et est actif
- ✅ Chaque moyen de paiement appartient au vendeur de la commande correspondante

**Erreurs Possibles:**
- `400`: Tableau vide ou données invalides
- `404`: Une ou plusieurs commandes introuvables
- `403`: Une ou plusieurs commandes ne vous appartiennent pas
- `400`: Une commande n'est pas en statut "pending_payment"
- `400`: Un moyen de paiement n'appartient pas au bon vendeur
- `404`: Un moyen de paiement n'existe pas ou n'est pas actif

**Notes importantes:**
- ⚡ **Transaction atomique**: Si une mise à jour échoue, toutes les mises à jour sont annulées
- 🚀 **Performance**: Une seule requête au lieu de N requêtes
- 📊 **Traçabilité**: Le summary montre l'ancien et le nouveau paymentMethodId pour chaque commande
- ✨ **Transition automatique**: Les commandes en `pending_payment` passent automatiquement à `pending` après la mise à jour

---

### 5. Changer le Statut d'une Commande (Vendeur/Livreur)

**Endpoint:** `PATCH /ecommerce/commandes/:id/status`

**Description:** Permet au vendeur ou au livreur de changer le statut d'une commande selon les transitions autorisées. Chaque changement est loggé automatiquement.

**Authentification:** Bearer Token requis

**URL Parameters:**
- `id` (number): ID de la commande

**Request:** `multipart/form-data`

**Form Data:**
- `packagePhoto` (file, required): Image du colis (JPG, JPEG, PNG, WEBP, max 10MB)

**Contraintes:**
- ✅ Seul le vendeur de la commande peut uploader la photo
- ✅ La commande doit être en statut `en_preparation`
- ✅ Le code à 4 chiffres est généré automatiquement (0000-9999)
- ✅ Le code est unique dans la base de données

**Response Success (200):**
```json
{
  "success": true,
  "message": "Photo du colis uploadée et code généré avec succès",
  "data": {
    "orderId": "61640d1c-2d0e-416f-a6cc-bb945fc1a707",
    "packagePhoto": "https://res.cloudinary.com/.../package_photos/xyz.jpg",
    "codeColis": "4582"
  }
}
```

**Response Errors:**

**404 - Commande non trouvée:**
```json
{
  "success": false,
  "message": "Commande non trouvée"
}
```

**403 - Non autorisé:**
```json
{
  "success": false,
  "message": "Seul le vendeur de cette commande peut uploader la photo du colis"
}
```

**400 - Mauvais statut:**
```json
{
  "success": false,
  "message": "La photo du colis ne peut être uploadée que lorsque la commande est en préparation"
}
```

**400 - Pas de fichier:**
```json
{
  "success": false,
  "message": "Aucune photo fournie. Le champ doit être nommé \"packagePhoto\""
}
```

**cURL Example:**
```bash
curl -X POST "https://api.rapidos-marketplace.com/ecommerce/commandes/1/upload-package-photo" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "packagePhoto=@/path/to/package-photo.jpg"
```

**Notes importantes:**
- 📦 **Code unique**: Le code à 4 chiffres est généré aléatoirement et vérifié pour être unique
- 🔒 **Obligatoire**: Photo + code requis pour passer à "pret_a_expedier"
- ☁️ **Cloudinary**: Les images sont stockées dans le dossier "package_photos"
- ♻️ **Remplacement**: Si une photo existe déjà, elle est remplacée et l'ancienne est supprimée

---

### 6. Changer le Statut d'une Commande (Vendeur/Livreur)

**Endpoint:** `PATCH /ecommerce/commandes/:id/status`

**Description:** Permet au vendeur ou au livreur de changer le statut d'une commande selon les transitions autorisées. Chaque changement est loggé automatiquement.

**Authentification:** Bearer Token requis

**URL Parameters:**
- `id` (string): Order ID (UUID) de la commande

**Request Body:**
```json
{
  "status": "en_preparation",
  "reason": "Préparation commencée"
}
```

**Paramètres:**
- `status` (string, required): Nouveau statut de la commande
- `reason` (string, optional): Raison du changement de statut

**Statuts disponibles et transitions autorisées:**

| Statut actuel | Nouveau statut | Rôle autorisé | Validation |
|---------------|----------------|---------------|------------|
| `pending_payment` | → `pending` | Acheteur (après paiement) | - |
| `pending` | → `en_preparation` | Vendeur | - |
| `pending` | → `cancelled` | Acheteur, Vendeur | - |
| `pending` | → `rejected` | Vendeur | - |
| `en_preparation` | → `pret_a_expedier` | Vendeur | Photo + Code 1 obligatoires |
| `en_preparation` | → `cancelled` | Acheteur, Vendeur | - |
| `pret_a_expedier` | → `accepte_livreur` | Livreur | Via endpoint `/take` |
| `pret_a_expedier` | → `cancelled` | Acheteur, Vendeur | - |
| `accepte_livreur` | → `en_route` | Livreur | Code 1 requis → Génère Code 2 |
| `accepte_livreur` | → `cancelled` | Livreur | - |
| `en_route` | → `delivered` | Livreur | Code 2 requis |
| `en_route` | → `cancelled` | Livreur | - |

**⚠️ Validation spéciale pour `pret_a_expedier`:**
Pour marquer une commande comme "prêt à expédier", le vendeur doit d'abord avoir uploadé la photo du colis via l'endpoint `/upload-package-photo`. Sans photo et code, la requête sera rejetée avec l'erreur :
```json
{
  "success": false,
  "message": "Photo du colis et code obligatoires pour marquer prêt à expédier. Utilisez l'endpoint /upload-package-photo d'abord."
}
```

**🔐 Système de Double Code de Sécurité:**

Le système utilise deux codes distincts pour sécuriser la récupération ET la livraison :

1. **Code 1 - Récupération du colis (Vendeur → Livreur)**
   - Généré automatiquement lors de l'upload de la photo du colis
   - Le vendeur donne ce code au livreur lors de la récupération
   - Le livreur valide ce code pour passer de `accepte_livreur` à `en_route`
   
   Requête:
   ```json
   PATCH /ecommerce/commandes/{orderId}/status
   {
     "status": "en_route",
     "codeColis": "4582"
   }
   ```
   
   Réponse (génère automatiquement Code 2):
   ```json
   {
     "success": true,
     "order": {...},
     "newCodeColis": "7391",
     "message": "Statut mis à jour de \"accepte_livreur\" vers \"en_route\". Nouveau code de confirmation généré : 7391"
   }
   ```

2. **Code 2 - Livraison au client (Système → Acheteur)**
   - Généré automatiquement lors du passage à `en_route`
   - Le livreur reçoit ce nouveau code dans la réponse
   - Le livreur partage ce code avec l'acheteur lors de la livraison
   - Le livreur valide ce code pour marquer `delivered`
   
   Requête:
   ```json
   PATCH /ecommerce/commandes/{orderId}/status
   {
     "status": "delivered",
     "codeColis": "7391"
   }
   ```

**Avantages:**
- ✅ Preuve que le livreur a bien récupéré le colis chez le vendeur
- ✅ Preuve que l'acheteur a bien reçu le colis
- ✅ Évite les fraudes ou litiges
- ✅ Traçabilité complète de la chaîne de livraison

**Response Success (200):**
```json
{
  "success": true,
  "message": "Statut mis à jour de \"pending\" vers \"en_preparation\"",
  "order": {
    "id": 3,
    "orderId": "1932a070-6bb4-4b15-a94b-03d7d4eafa8e",
    "status": "en_preparation",
    "vendeurId": 114,
    "clientId": 72,
    "items": [...],
    "total": "50000.00",
    "deliveryFee": 2560,
    "paymentMethod": {
      "id": 6,
      "type": "mpesa",
      "name": "Mpesa",
      "numeroCompte": "0826016607",
      "nomTitulaire": "Stanislas Makengo",
      "isDefault": false,
      "isActive": true
    },
    "updatedAt": "2025-12-28T18:30:00.000+01:00"
  }
}
```

**Erreurs Possibles:**
- `404`: Commande introuvable
- `403`: Transition non autorisée pour votre rôle
- `400`: Transition de statut non autorisée (ex: passer de "pending" à "delivered")
- `400`: Photo du colis manquante (pour passer à "pret_a_expedier")
- `401`: Token d'authentification invalide ou manquant
- `500`: Erreur serveur

**Notes importantes:**
- **Vendeur uniquement**: Peut changer le statut de SES commandes seulement
- **Photo obligatoire**: Le vendeur doit uploader une photo du colis avant de marquer "pret_a_expedier"
- **Logging automatique**: Chaque changement de statut est enregistré avec l'utilisateur, le rôle et la raison
- **Statut final**: Une fois en "delivered", aucun changement n'est possible

---

### 6. Upload Photo du Colis et Génération du Code

**Endpoint:** `POST /ecommerce/commandes/:id/upload-package-photo`

**Description:** Permet au vendeur d'uploader la photo du colis et génère automatiquement un code unique à 4 chiffres. Cette étape est **obligatoire** avant de marquer la commande comme "prêt à expédier".

**Authentification:** Bearer Token requis

**URL Parameters:**
- `id` (number): ID de la commande

**Request:** `multipart/form-data`

**Form Data:**
- `packagePhoto` (file, required): Image du colis (JPG, JPEG, PNG, WEBP, max 10MB)

**Contraintes:**
- ✅ Seul le vendeur de la commande peut uploader la photo
- ✅ La commande doit être en statut `en_preparation`
- ✅ Le code à 4 chiffres est généré automatiquement (0000-9999)
- ✅ Le code est unique dans la base de données

**Response Success (200):**
```json
{
  "success": true,
  "message": "Photo du colis uploadée et code généré avec succès",
  "data": {
    "orderId": "61640d1c-2d0e-416f-a6cc-bb945fc1a707",
    "packagePhoto": "https://res.cloudinary.com/.../package_photos/xyz.jpg",
    "codeColis": "4582"
  }
}
```

**Response Errors:**

**404 - Commande non trouvée:**
```json
{
  "success": false,
  "message": "Commande non trouvée"
}
```

**403 - Non autorisé:**
```json
{
  "success": false,
  "message": "Seul le vendeur de cette commande peut uploader la photo du colis"
}
```

**400 - Mauvais statut:**
```json
{
  "success": false,
  "message": "La photo du colis ne peut être uploadée que lorsque la commande est en préparation"
}
```

**400 - Pas de fichier:**
```json
{
  "success": false,
  "message": "Aucune photo fournie. Le champ doit être nommé \"packagePhoto\""
}
```

**cURL Example:**
```bash
curl -X POST "https://api.rapidos-marketplace.com/ecommerce/commandes/1/upload-package-photo" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "packagePhoto=@/path/to/package-photo.jpg"
```

**Notes importantes:**
- 📦 **Code unique**: Le code à 4 chiffres est généré aléatoirement et vérifié pour être unique
- 🔒 **Obligatoire**: Photo + code requis pour passer à "pret_a_expedier"
- ☁️ **Cloudinary**: Les images sont stockées dans le dossier "package_photos"
- ♻️ **Remplacement**: Si une photo existe déjà, elle est remplacée et l'ancienne est supprimée

---

### 7. Workflow Vendeur Complet

**Étape 1: Voir ses commandes**
```bash
GET /ecommerce/commandes/vendeur
Authorization: Bearer VENDEUR_TOKEN
```

**Étape 2: Commencer la préparation**
```bash
# Passer de "pending" à "en_preparation"
PATCH /ecommerce/commandes/1932a070-6bb4-4b15-a94b-03d7d4eafa8e/status
{
  "status": "en_preparation",
  "reason": "Commande prise en charge"
}
```

**Étape 3: Uploader photo du colis**
```bash
POST /ecommerce/upload/package-photo
Content-Type: multipart/form-data

orderId: 1932a070-6bb4-4b15-a94b-03d7d4eafa8e
packagePhoto: [fichier]
```

**Étape 4: Marquer prêt à expédier**
```bash
PATCH /ecommerce/commandes/1932a070-6bb4-4b15-a94b-03d7d4eafa8e/status
{
  "status": "pret_a_expedier",
  "reason": "Colis prêt pour livraison"
}
```

---

## 💰 Calcul des Frais de Livraison

### Formule
```
Frais de livraison = 1000 FC (base) + (distance_km × 1000 FC)
```

### Méthode de Calcul
La distance est calculée avec la **formule de Haversine** qui prend en compte la courbure de la Terre:

```
R = 6371 km (rayon de la Terre)

φ1 = latitude acheteur (radians)
φ2 = latitude vendeur (radians)
Δφ = φ2 - φ1
Δλ = longitude vendeur - longitude acheteur (radians)

a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c
```

### Exemples de Calcul

| Distance | Calcul | Frais |
|----------|--------|-------|
| 1.56 km | 1000 + (1.56 × 1000) | 2,560 FC |
| 6.48 km | 1000 + (6.48 × 1000) | 7,480 FC |
| 10 km | 1000 + (10 × 1000) | 11,000 FC |
| 0.5 km | 1000 + (0.5 × 1000) | 1,500 FC |

---

## 🔐 Authentification

Tous les endpoints nécessitent un token Bearer dans le header:

```
Authorization: Bearer votre_token_ici
```

Pour obtenir un token:
```bash
POST /login
{
  "uid": "+243828191010",
  "password": "votre_password"
}
```

---

## 📸 Images des Produits

Chaque produit retourné contient:
- `imageUrl`: Image principale du produit
- `images[]`: Tableau de toutes les images secondaires
  - `id`: ID de l'image
  - `url`: URL Cloudinary de l'image
  - `mediaableType`: Type d'entité (toujours "App\\Models\\Product")

---

## 🎯 Exemples d'Utilisation Frontend

### 1. Initialiser une commande avec 2 produits

```javascript
const response = await fetch('http://localhost:3333/ecommerce/commandes/initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    products: [
      { productId: 151, quantite: 2 },
      { productId: 165, quantite: 1 }
    ],
    latitude: -4.3276,
    longitude: 15.3136,
    address: {
      pays: 'RDC',
      ville: 'Kinshasa',
      commune: 'Ngaliema',
      quartier: 'Joli Parc',
      avenue: 'Avenue de la Liberté',
      numero: '123',
      codePostale: '10001'
    }
  })
});

const data = await response.json();

// data.orders contient les sous-commandes créées (1 par vendeur)
// data.summary contient le récapitulatif global
console.log(`${data.orders.length} commandes créées`);
console.log(`Total avec livraison: ${data.summary.grandTotal} FC`);
```

### 2. Afficher les commandes de l'utilisateur

```javascript
const response = await fetch('http://localhost:3333/ecommerce/commandes/buyer/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();

// Afficher les statistiques
console.log(`Total: ${data.stats.total} commandes`);
console.log(`En attente de paiement: ${data.stats.pending_payment}`);

// Boucler sur les commandes
data.orders.forEach(order => {
  console.log(`Commande #${order.id}: ${order.total} FC + ${order.deliveryFee} FC livraison`);
  console.log(`Vendeur: ${order.vendeur.firstName} ${order.vendeur.lastName}`);
  console.log(`Moyen de paiement: ${order.paymentMethod.name} (${order.paymentMethod.numeroCompte})`);
});
```

### 3. Modifier les moyens de paiement en batch

```javascript
// L'utilisateur sélectionne les nouveaux moyens de paiement dans l'UI
const updates = orders.map(order => ({
  commandeId: order.id,
  paymentMethodId: selectedPaymentMethods[order.vendeurId]
}));

const response = await fetch('http://localhost:3333/ecommerce/commandes/batch-update-payment-methods', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ updates })
});

const data = await response.json();

if (data.success) {
  console.log(`${data.summary.totalUpdated} commandes mises à jour`);
  // Rafraîchir l'affichage des commandes
}
```

---

## 🧪 Tests avec cURL

### Initialiser une commande
```bash
curl -X POST "http://localhost:3333/ecommerce/commandes/initialize" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {"productId": 151, "quantite": 2},
      {"productId": 165, "quantite": 1}
    ],
    "latitude": -4.3276,
    "longitude": 15.3136,
    "address": {
      "pays": "RDC",
      "ville": "Kinshasa",
      "commune": "Ngaliema",
      "quartier": "Joli Parc",
      "avenue": "Avenue de la Liberté",
      "numero": "123",
      "codePostale": "10001"
    }
  }'
```

### Voir ses commandes
```bash
curl -X GET "http://localhost:3333/ecommerce/commandes/buyer/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Modifier un moyen de paiement (individuel)
```bash
curl -X PATCH "http://localhost:3333/ecommerce/commandes/3/payment-method" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethodId": 6, "numeroPayment": "TXN123456789"}'
```

### Modifier plusieurs moyens de paiement (batch)
```bash
curl -X PATCH "http://localhost:3333/ecommerce/commandes/batch-update-payment-methods" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"commandeId": 1, "paymentMethodId": 6, "numeroPayment": "TXN111"},
      {"commandeId": 3, "paymentMethodId": 7, "numeroPayment": "TXN222"},
      {"commandeId": 2, "paymentMethodId": 1}
    ]
  }'
```

### Changer le statut d'une commande (Vendeur)
```bash
# Commencer la préparation
curl -X PATCH "http://localhost:3333/ecommerce/commandes/1932a070-6bb4-4b15-a94b-03d7d4eafa8e/status" \
  -H "Authorization: Bearer VENDEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "en_preparation",
    "reason": "Commande prise en charge"
  }'

# Marquer prêt à expédier
curl -X PATCH "http://localhost:3333/ecommerce/commandes/1932a070-6bb4-4b15-a94b-03d7d4eafa8e/status" \
  -H "Authorization: Bearer VENDEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "pret_a_expedier",
    "reason": "Colis emballé et prêt"
  }'
```

### Voir ses commandes (Vendeur)
```bash
curl -X GET "http://localhost:3333/ecommerce/commandes/vendeur" \
  -H "Authorization: Bearer VENDEUR_TOKEN"
```

---

## ⚠️ Points Importants

### 1. Gestion Multi-Vendeurs
- Chaque produit d'un panier peut avoir un vendeur différent
- Le système crée automatiquement **1 sous-commande par vendeur**
- Chaque sous-commande a son propre `orderId`, `paymentMethod`, et `deliveryFee`

### 2. Moyens de Paiement
- Chaque vendeur a ses propres moyens de paiement
- Le moyen de paiement **par défaut** est assigné automatiquement lors de l'initialisation
- L'acheteur peut modifier le moyen de paiement tant que le statut est `pending_payment`
- Un moyen de paiement ne peut être utilisé que pour les commandes de son vendeur
- **Transition automatique**: Modifier le moyen de paiement fait passer la commande de `pending_payment` à `pending`
- Le champ `numeroPayment` permet de stocker le numéro de transaction (obligatoire pour les paiements non-cash)

### 3. Calcul de Distance
- Nécessite les coordonnées GPS de l'acheteur (latitude, longitude)
- Nécessite les coordonnées GPS du vendeur (stockées en base de données)
- Si le vendeur n'a pas de coordonnées GPS, la distance est 0 km et les frais = 1000 FC

### 4. Statuts de Commande
```
pending_payment  →  Acheteur modifie le moyen de paiement
       ↓
   pending       →  Commande confirmée, vendeur peut commencer
       ↓
en_preparation   →  Vendeur prépare la commande
       ↓
pret_a_expedier  →  Commande prête, livreur peut prendre
       ↓
accepte_livreur  →  Livreur a accepté la commande
       ↓
   en_route      →  Livreur en cours de livraison
       ↓
   delivered     →  Commande terminée
```

### 5. Performance
- Les images sont chargées en **une seule requête** pour tous les produits
- Le batch update utilise une **transaction atomique** pour éviter les états incohérents
- Les calculs GPS sont optimisés avec la formule de Haversine

---

## 📞 Support

Pour toute question ou problème:
- Backend: Stanislas Makengo (+243826016607)
- Repository: /Rapidos-backend
- Server: PM2 process "rapidos-backend"

---

**Date de dernière mise à jour:** 28 décembre 2025
