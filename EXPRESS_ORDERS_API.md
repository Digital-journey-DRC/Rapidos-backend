# 📦 API EXPRESS ORDERS - Documentation Frontend

## 🎯 Vue d'ensemble

Le module **Express Orders** permet aux **vendeurs** de créer des commandes express pour leurs clients. Contrairement au module e-commerce où l'acheteur crée sa commande, ici c'est le **vendeur qui initialise** la commande pour un client enregistré.

### Différences clés : E-commerce vs Express

| Caractéristique | E-commerce | Express |
|----------------|------------|---------|
| **Qui crée la commande** | Acheteur (auth) | **Vendeur** (auth) |
| **Client** | User authentifié | **Client enregistré** (`ClientExpress`) |
| **SMS automatique** | ❌ | ✅ **Envoyé au client quand `en_route`** |
| **Cycle de vie** | Identique | Identique |
| **Upload photo** | Identique | Identique |

---

## 🔐 Authentification

Toutes les requêtes nécessitent un token JWT dans le header :

```http
Authorization: Bearer {token}
```

**Obtenir un token :**

```http
POST /login
Content-Type: application/json

{
  "uid": "+243826016607",
  "password": "0826016607Makengo@"
}
```

**Réponse :**
```json
{
  "token": {
    "token": "oat_MTIyNQ.WmtqMnY2MEJYUGVtRHRH...",
    "type": "bearer"
  },
  "user": {
    "id": 3,
    "role": "vendeur",
    "firstName": "Stanislas"
  }
}
```

---

## 📡 ENDPOINTS

### Base URL
```
http://localhost:3333
```

---

## 1️⃣ GESTION DES CLIENTS EXPRESS

### 📝 Créer un client (Vendeur)

**Endpoint :** `POST /express/clients`

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "name": "Jean Kabongo",
  "phone": "+243999888777",
  "email": "jean@example.com",
  "defaultAddress": "123 Avenue du Port, Gombe",
  "defaultReference": "Face à la pharmacie",
  "pays": "RDC",
  "province": "Kinshasa",
  "ville": "Kinshasa",
  "commune": "Gombe",
  "avenue": "Avenue du Port",
  "latitude": -4.3217,
  "longitude": 15.3010,
  "notes": "Client régulier"
}
```

**Champs obligatoires :**
- `name` : Nom du client
- `phone` : Numéro de téléphone

**Champs optionnels :**
- `email` : Email du client
- `defaultAddress` : Adresse par défaut
- `defaultReference` : Point de référence (ex: "Face à la pharmacie")
- `pays` : Pays
- `province` : Province
- `ville` : Ville
- `commune` : Commune
- `avenue` : Avenue/Rue
- `latitude` : Coordonnée GPS latitude (-90 à 90)
- `longitude` : Coordonnée GPS longitude (-180 à 180)
- `notes` : Notes sur le client

**Réponse :**
```json
{
  "success": true,
  "message": "Client enregistré avec succès",
  "client": {
    "id": 12,
    "name": "Jean Kabongo",
    "phone": "+243999888777",
    "email": "jean@example.com",
    "defaultAddress": "123 Avenue du Port, Gombe",
    "defaultReference": "Face à la pharmacie",
    "pays": "RDC",
    "province": "Kinshasa",
    "ville": "Kinshasa",
    "commune": "Gombe",
    "avenue": "Avenue du Port",
    "latitude": -4.3217,
    "longitude": 15.3010,
    "vendorId": 3,
    "notes": "Client régulier",
    "createdAt": "2026-03-18T20:15:00.000Z",
    "updatedAt": "2026-03-18T20:15:00.000Z"
  }
}
```

---

### 📋 Lister ses clients (Vendeur)

**Endpoint :** `GET /express/clients/vendeur`

**Headers :**
```http
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "success": true,
  "clients": [
    {
      "id": 12,
      "name": "Jean Kabongo",
      "phone": "+243999888777",
      "email": "jean@example.com",
      "defaultAddress": "123 Avenue du Port, Gombe",
      "vendorId": 3
    }
  ]
}
```

---

## 2️⃣ GESTION DES COMMANDES EXPRESS

### 🚀 Initialiser une commande (Vendeur)

**Endpoint :** `POST /express/commandes/initialize`

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "clientId": 12,
  "items": [
    {
      "productId": 1,
      "name": "Samsung Galaxy",
      "quantity": 2
    },
    {
      "name": "Coque protection",
      "description": "Coque silicone transparente",
      "quantity": 1,
      "price": 5000
    }
  ],
  "packageValue": 460000,
  "packageDescription": "Smartphone + accessoires",
  "pickupAddress": "Bureau vendeur, Gombe",
  "deliveryAddress": "123 Avenue du Port, Gombe",
  "latitude": -4.3217,
  "longitude": 15.3010
}
```

**Champs items :**
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `productId` | number | Non | ID du produit dans le catalogue. Si fourni, `description`, `price` et `urlProduct` sont auto-remplis depuis la base |
| `name` | string | **Oui** | Nom du produit/colis |
| `description` | string | Non | Description (auto-remplie si `productId` fourni) |
| `price` | number | Non | Prix unitaire (auto-rempli si `productId` fourni) |
| `quantity` | number | **Oui** | Quantité (minimum 1) |
| `weight` | string | Non | Poids (ex: "2kg") |
| `urlProduct` | string | Non | URL de l'image produit (auto-remplie si `productId` fourni) |

**✨ Enrichissement automatique des items :**
- Si `productId` est fourni → le système récupère automatiquement `description`, `price` et `urlProduct` (photo) depuis la base de données
- Les valeurs fournies par le vendeur sont **toujours prioritaires**
- Si `productId` n'est pas fourni → les champs manquants sont retournés comme `null`

**📍 Gestion des coordonnées GPS :**

Le système stocke **4 coordonnées** pour chaque commande :

| Coordonnée | Source (priorité) | Description |
|------------|-------------------|-------------|
| `client_latitude` | 1. `payload.latitude`<br>2. `client_express.latitude`<br>3. `null` | Point de livraison (client) |
| `client_longitude` | 1. `payload.longitude`<br>2. `client_express.longitude`<br>3. `null` | Point de livraison (client) |
| `vendor_latitude` | `user.latitude` (vendeur connecté) | Point de départ (vendeur) |
| `vendor_longitude` | `user.longitude` (vendeur connecté) | Point de départ (vendeur) |

**Calcul des frais de livraison :**
- Si les 4 coordonnées sont disponibles → Distance réelle vendeur → client
- Sinon → `deliveryFee = 0`

**Exemple sans coordonnées dans le payload :**
```json
{
  "clientId": 13,
  "items": [{"name": "Colis", "quantity": 1}],
  "packageValue": 50000,
  "packageDescription": "Documents"
}
```
→ Le système utilisera automatiquement `client_express.latitude/longitude` du client #13

**Réponse :**
```json
{
  "success": true,
  "message": "Commande express initialisée avec succès",
  "order": {
    "id": 85,
    "orderId": "adc08410-f944-404b-9bb8-da1ae28d61d7",
    "statut": "pending_payment",
    "clientId": 12,
    "clientName": "Jean Kabongo",
    "clientPhone": "+243999888777",
    "vendorId": 3,
    "items": [
      {
        "productId": 1,
        "name": "Samsung Galaxy",
        "description": "Smartphone Samsung Galaxy A54 5G avec écran AMOLED",
        "price": 450000,
        "quantity": 2,
        "weight": null,
        "urlProduct": "https://res.cloudinary.com/.../products/image.jpg"
      },
      {
        "productId": null,
        "name": "Coque protection",
        "description": "Coque silicone transparente",
        "price": 5000,
        "quantity": 1,
        "weight": null,
        "urlProduct": null
      }
    ],
    "packageValue": 460000,
    "deliveryFee": 6240,
    "totalAvecLivraison": 466240,
    "codeColis": "1266",
    "clientLatitude": -4.3217,
    "clientLongitude": 15.3010,
    "vendorLatitude": -4.2408052,
    "vendorLongitude": 15.2914667
  }
}
```

**📋 Note importante :**
- Le `codeColis` est généré **automatiquement** dès la création
- Ce code sera **remplacé** par un nouveau code lors du passage en `pret_a_expedier`

---

### 💳 Ajouter moyen de paiement (Vendeur)

**Endpoint :** `PATCH /express/commandes/:id/payment-method`

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "paymentMethodId": 1,
  "numeroPayment": "0826016607"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Moyen de paiement mis à jour",
  "order": {
    "id": 63,
    "statut": "pending",
    "paymentMethod": {
      "id": 1,
      "name": "Cash",
      "type": "cash"
    }
  }
}
```

**Note :** Le statut passe automatiquement de `pending_payment` → `pending`

---

### 📋 Voir ses commandes (Vendeur)

**Endpoint :** `GET /express/commandes/vendeur`

**Headers :**
```http
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "success": true,
  "commandes": [
    {
      "id": 85,
      "orderId": "adc08410-f944-404b-9bb8-da1ae28d61d7",
      "statut": "en_preparation",
      "clientId": 12,
      "clientName": "Paul Mukendi",
      "clientPhone": "+243897654321",
      "deliveryAddress": "789 Boulevard Lumumba, Kinshasa",
      "packagePhoto": "https://res.cloudinary.com/.../order_xxx.png",
      "items": [
        {
          "productId": 1,
          "name": "Samsung Galaxy",
          "description": "Smartphone Samsung Galaxy A54 5G avec écran AMOLED",
          "price": 450000,
          "quantity": 2,
          "weight": null,
          "urlProduct": "https://res.cloudinary.com/.../products/image.jpg"
        },
        {
          "productId": null,
          "name": "Coque protection",
          "description": "Coque silicone transparente",
          "price": 5000,
          "quantity": 1,
          "weight": null,
          "urlProduct": null
        }
      ],
      "clientLatitude": -4.3400,
      "clientLongitude": 15.3100,
      "vendorLatitude": -4.3443732,
      "vendorLongitude": 15.2629869,
      "packageValue": 460000,
      "deliveryFee": 6240,
      "totalAvecLivraison": 466240,
      "codeColis": "2342",
      "paymentMethodId": 6,
      "deliveryPersonId": null,
      "createdAt": "2026-03-20T19:38:51.340Z",
      "updatedAt": "2026-03-20T19:40:49.277Z"
    }
  ]
}
```

**✨ Enrichissement automatique des items (à la lecture) :**
- Le système enrichit **automatiquement** les items au moment où le vendeur consulte ses commandes
- Si `productId` présent → `description`, `price` et `urlProduct` sont récupérés depuis la base produit
- **`urlProduct`** = **URL de la photo du produit** sur Cloudinary — utiliser cette URL pour afficher l'image
- Si `productId` est `null` → `urlProduct` sera `null` (item hors catalogue)

**📦 Détails retournés :**

| Champ | Type | Description |
|-------|------|-------------|
| `items[]` | array | Liste des produits — **toujours 7 champs par item** |
| `items[].productId` | number \| null | ID produit catalogue. `null` = hors catalogue |
| `items[].name` | string | Nom du produit |
| `items[].description` | string \| null | Description — auto-remplie si `productId` |
| `items[].price` | number \| null | Prix unitaire — auto-rempli si `productId` |
| `items[].quantity` | number | Quantité |
| `items[].weight` | string \| null | Poids |
| `items[].urlProduct` | string \| null | **Photo du produit** — auto-remplie si `productId` |
| `packagePhoto` | string \| null | Photo du **colis** uploadée par le vendeur |
| `clientLatitude` | string | Latitude du client (destination) |
| `clientLongitude` | string | Longitude du client (destination) |
| `vendorLatitude` | string | Latitude du vendeur (départ) |
| `vendorLongitude` | string | Longitude du vendeur (départ) |
| `codeColis` | string | Code de vérification |
| `deliveryPersonId` | number \| null | ID du livreur (`null` = pas encore assigné) |

> **⚠️ Ne pas confondre** `urlProduct` (photo du **produit** dans le catalogue) et `packagePhoto` (photo du **colis** prise par le vendeur).

- **Tous les statuts sont visibles** sauf `pending_payment`

---

### 🔄 Changer le statut (Vendeur/Livreur)

**Endpoint :** `PATCH /express/commandes/:id/status`

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "status": "en_preparation",
  "reason": "Commande acceptée"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Statut mis à jour de \"pending\" vers \"en_preparation\"",
  "order": {
    "id": 63,
    "statut": "en_preparation"
  }
}
```

---

### 📸 Upload photo du colis (Vendeur)

**Endpoint :** `POST /express/commandes/:id/upload-package-photo`

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData) :**
```javascript
const formData = new FormData();
formData.append('packagePhoto', fileBlob, 'photo.jpg');
```

**Réponse :**
```json
{
  "success": true,
  "message": "Photo du colis uploadée et code généré avec succès",
  "data": {
    "orderId": "adc08410-f944-404b-9bb8-da1ae28d61d7",
    "packagePhoto": "https://res.cloudinary.com/deb9kfhnx/image/upload/v1773858594/rapidos/ecommerce-packages/order_xxx.png",
    "codeColis": "1266"
  }
}
```

**📋 Note :**
- Le `codeColis` retourné est le code initial (généré à la création)
- Un **nouveau code** sera généré automatiquement lors du passage en `pret_a_expedier`

---

## 3️⃣ GESTION DES LIVRAISONS (LIVREUR)

> **✅ Le frontend DOIT utiliser le module Express Orders** pour les endpoints livreur :
> - `GET /express/livraison/disponibles` — Voir les livraisons disponibles
> - `GET /express/livraison/mes-livraisons` — Voir mes livraisons en cours
> - `POST /express/livraison/:id/take` — Prendre une livraison
>
> ⚠️ Le module Commande Express (`/commande-express/livreur/...`) existe aussi mais n'est **pas recommandé** pour le frontend.

### 📦 Voir livraisons disponibles (toutes)

**Endpoint :** `GET /express/livraison/disponibles`

**Description :** Retourne **TOUTES** les commandes `pret_a_expedier` sans livreur assigné. Tous les livreurs voient les mêmes commandes.

**Headers :**
```http
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "success": true,
  "deliveries": [
    {
      "id": 3,
      "orderId": "71c928fe-8ba7-4a9f-8c0a-45b44586e67c",
      "statut": "pret_a_expedier",
      "clientName": "Marie Tshala",
      "clientPhone": "+243811222333",
      "deliveryAddress": "456 Avenue Lumumba, Limete",
      "deliveryReference": "Face à la station Total",
      "packagePhoto": "https://res.cloudinary.com/deb9kfhnx/image/upload/v1774103514/rapidos/ecommerce-packages/order_71c928fe-8ba7-4a9f-8c0a-45b44586e67c_1774103512957.png",
      "codeColis": "7503",
      "items": [
        {
          "productId": 1,
          "name": "Samsung Galaxy",
          "description": "Smartphone Samsung Galaxy A54 5G avec écran AMOLED",
          "price": 450000,
          "quantity": 2,
          "weight": null,
          "urlProduct": "https://res.cloudinary.com/deb9kfhnx/image/upload/v1766985798/products/cpapivljgeiunbgjfcwt.jpg"
        },
        {
          "productId": null,
          "name": "Coque protection",
          "description": "Coque silicone",
          "price": 5000,
          "quantity": 1,
          "weight": null,
          "urlProduct": null
        }
      ],
      "clientLatitude": "-4.35000000",
      "clientLongitude": "15.32000000",
      "vendorLatitude": "-4.24080520",
      "vendorLongitude": "15.29146670",
      "packageValue": "460000.00",
      "deliveryFee": "13550.00",
      "totalAvecLivraison": "473550.00",
      "deliveryPersonId": null
    }
  ]
}
```

**✨ Enrichissement automatique des items (à la lecture) :**
- Le système enrichit **automatiquement** les items au moment où le livreur consulte cet endpoint
- Si un item a un `productId` → `description`, `price` et `urlProduct` sont récupérés depuis la base produit
- `urlProduct` contient l'**URL réelle de la photo du produit** (Cloudinary) — **c'est cette URL que le frontend doit utiliser pour afficher l'image du produit**
- Si un item n'a **pas** de `productId` (colis hors catalogue) → `urlProduct` sera `null`
- Les 7 champs sont **toujours** retournés : `productId`, `name`, `description`, `price`, `quantity`, `weight`, `urlProduct`

**📍 Coordonnées GPS pour la navigation :**
- `clientLatitude/clientLongitude` : Point de livraison (destination)
- `vendorLatitude/vendorLongitude` : Point de départ (pickup chez le vendeur)
- Ces coordonnées permettent au livreur de calculer l'itinéraire complet

> **⚠️ Note :** Les coordonnées et montants sont retournés en `string` (ex: `"-4.35000000"`, `"460000.00"`). Le frontend doit les convertir en `number` si nécessaire (`parseFloat()`).

---

### 📋 Voir mes livraisons en cours — Module Express Orders (livreur connecté)

**Endpoint :** `GET /express/livraison/mes-livraisons`

**Description :** Retourne **uniquement** les commandes assignées au livreur connecté avec statut `accepte_livreur` ou `en_route`.

**Headers :**
```http
Authorization: Bearer {token}
```

**Réponse (exemple réel testé le 21/03/2026) :**
```json
{
  "success": true,
  "deliveries": [
    {
      "id": 3,
      "orderId": "71c928fe-8ba7-4a9f-8c0a-45b44586e67c",
      "statut": "accepte_livreur",
      "clientId": 13,
      "clientName": "Marie Tshala",
      "clientPhone": "+243811222333",
      "packageValue": "460000.00",
      "packageDescription": "Smartphone + accessoires",
      "pickupAddress": "",
      "deliveryAddress": "456 Avenue Lumumba, Limete",
      "pickupReference": null,
      "deliveryReference": "Face à la station Total",
      "createdBy": 3,
      "vendorId": 3,
      "items": [
        {
          "productId": 1,
          "name": "Samsung Galaxy",
          "description": "Smartphone Samsung Galaxy A54 5G avec écran AMOLED",
          "price": 450000,
          "quantity": 2,
          "weight": null,
          "urlProduct": "https://res.cloudinary.com/deb9kfhnx/image/upload/v1766985798/products/cpapivljgeiunbgjfcwt.jpg"
        },
        {
          "productId": null,
          "name": "Coque protection",
          "description": "Coque silicone",
          "price": 5000,
          "quantity": 1,
          "weight": null,
          "urlProduct": null
        }
      ],
      "deliveryPersonId": 5,
      "paymentMethodId": 1,
      "packagePhoto": "https://res.cloudinary.com/deb9kfhnx/image/upload/v1774103514/rapidos/ecommerce-packages/order_71c928fe.png",
      "codeColis": "7503",
      "deliveryFee": "13550.00",
      "totalAvecLivraison": "473550.00",
      "clientLatitude": "-4.35000000",
      "clientLongitude": "15.32000000",
      "vendorLatitude": "-4.24080520",
      "vendorLongitude": "15.29146670",
      "createdAt": "2026-03-21T15:28:44.857+01:00",
      "updatedAt": "2026-03-21T15:37:31.093+01:00"
    }
  ]
}
```

**✨ Enrichissement automatique des items (à la lecture) :**
- Le système enrichit **automatiquement** les items au moment de la lecture
- Si `productId` est présent → `description`, `price` et `urlProduct` sont récupérés depuis la base produit
- **`urlProduct`** = URL de la photo du produit sur Cloudinary — **utiliser cette URL pour afficher l'image**
- Si `productId` est `null` → `urlProduct` sera `null` (item hors catalogue)
- **Les 7 champs sont TOUJOURS retournés** pour chaque item

**📊 Champs retournés par item :**

| Champ | Type | Description |
|-------|------|-------------|
| `productId` | number \| null | ID du produit dans le catalogue. `null` = colis hors catalogue |
| `name` | string | Nom du produit/colis |
| `description` | string \| null | Description du produit. Auto-remplie si `productId` présent |
| `price` | number \| null | Prix unitaire. Auto-rempli si `productId` présent |
| `quantity` | number | Quantité |
| `weight` | string \| null | Poids (ex: "2kg") |
| `urlProduct` | string \| null | **URL de la photo du produit** (Cloudinary). Auto-remplie si `productId` présent |

---

### 🚚 Voir mes livraisons — Module Commande Express (livreur connecté)

**Endpoint :** `GET /commande-express/livreur/mes-livraisons`

**Controller :** `CommandeExpressController.mesLivraisons`

**Description :** Récupère **TOUTES** les livraisons assignées au livreur connecté (tous statuts confondus par défaut). Utilise une requête SQL brute **sans pagination** — retourne un tableau plat.

**Headers :**
```http
Authorization: Bearer {token}
```

**Query Parameters :**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `status` | string | Non | Filtrer par statut exact : `pending`, `en_cours`, `en_route`, `livre`, `delivered`, `annule`, `cancelled` |

> **💡 Note :** Contrairement à `/express/livraison/mes-livraisons` qui ne montre que `accepte_livreur` + `en_route`, cet endpoint retourne **tous les statuts** par défaut (y compris `livre`, `cancelled`, etc.).

**Exemples de requêtes :**

```bash
# Toutes mes livraisons (tous statuts)
curl -X GET http://localhost:3333/commande-express/livreur/mes-livraisons \
  -H "Authorization: Bearer {token}"

# Filtrer par statut en_cours
curl -X GET "http://localhost:3333/commande-express/livreur/mes-livraisons?status=en_cours" \
  -H "Authorization: Bearer {token}"

# Filtrer les livraisons livrées
curl -X GET "http://localhost:3333/commande-express/livreur/mes-livraisons?status=livre" \
  -H "Authorization: Bearer {token}"
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "order_id": "6470e60f-c2a2-4824-b95e-34888effc8d4",
      "client_id": 1,
      "client_name": "Client Test Express",
      "client_phone": "+243999888777",
      "vendor_id": 1,
      "package_value": "500.00",
      "package_description": "Test commande express - Colis hors app",
      "pickup_address": "123 Avenue Kinshasa",
      "delivery_address": "456 Boulevard Lumumba",
      "pickup_reference": "Marche central",
      "delivery_reference": "Face eglise",
      "created_by": 1,
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
      "delivery_person_id": 5,
      "image_colis": null,
      "image_colis_public_id": null,
      "payment_method_id": null,
      "package_photo": null,
      "package_photo_public_id": null,
      "code_colis": "1234",
      "delivery_fee": null,
      "total_avec_livraison": null,
      "latitude": null,
      "longitude": null,
      "client_latitude": null,
      "client_longitude": null,
      "vendor_latitude": -4.3443732,
      "vendor_longitude": 15.2629869,
      "firebase_order_id": null,
      "address": null,
      "numero_payment": null,
      "created_at": "2026-02-23T06:55:42.936+01:00",
      "updated_at": "2026-02-23T18:44:00.097+01:00"
    }
  ]
}
```

> **⚠️ Format des noms de champs :** Cet endpoint utilise une requête SQL brute (`SELECT * FROM commande_express`), les noms de colonnes sont en **snake_case** (ex : `client_name`, `delivery_person_id`, `package_value`) contrairement aux endpoints du module Express Orders qui retournent en **camelCase**.

**📊 Structure complète des champs retournés :**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | number | ID unique de la commande |
| `order_id` | string | UUID de la commande |
| `client_id` | number | ID du client |
| `client_name` | string | Nom du client |
| `client_phone` | string | Téléphone du client |
| `vendor_id` | number | ID du vendeur |
| `package_value` | string | Valeur du colis |
| `package_description` | string | Description du colis |
| `pickup_address` | string | Adresse de récupération |
| `delivery_address` | string | Adresse de livraison |
| `pickup_reference` | string \| null | Point de repère récupération |
| `delivery_reference` | string \| null | Point de repère livraison |
| `created_by` | number | ID du créateur |
| `statut` | string | Statut actuel |
| `items` | array | Liste des articles (JSON) |
| `delivery_person_id` | number | ID du livreur assigné |
| `image_colis` | string \| null | URL image du colis |
| `payment_method_id` | number \| null | ID moyen de paiement |
| `package_photo` | string \| null | URL photo du colis |
| `code_colis` | string \| null | Code de confirmation colis |
| `delivery_fee` | number \| null | Frais de livraison |
| `total_avec_livraison` | number \| null | Total avec livraison |
| `latitude` | number \| null | Latitude (générale) |
| `longitude` | number \| null | Longitude (générale) |
| `client_latitude` | number \| null | Latitude du client (destination) |
| `client_longitude` | number \| null | Longitude du client (destination) |
| `vendor_latitude` | number \| null | Latitude du vendeur (pickup) |
| `vendor_longitude` | number \| null | Longitude du vendeur (pickup) |
| `firebase_order_id` | string \| null | ID Firebase |
| `address` | object \| null | Adresse structurée (JSON) |
| `numero_payment` | string \| null | Numéro de paiement |
| `created_at` | string | Date de création (ISO 8601) |
| `updated_at` | string | Date de mise à jour (ISO 8601) |

**Erreurs possibles :**

| Code | Réponse | Cause |
|------|---------|-------|
| 401 | `{"errors": [{"message": "Unauthorized access"}]}` | Token manquant ou invalide |
| 500 | `{"success": false, "message": "Erreur lors de la récupération de vos livraisons"}` | Erreur serveur |

**Valeurs possibles pour `status` :**
- `pending` — En attente
- `en_preparation` — En préparation
- `pret_a_expedier` — Prêt à expédier
- `accepte_livreur` — Accepté par le livreur
- `en_route` — En route
- `delivered` — Livré
- `cancelled` — Annulé
- `rejected` — Rejeté

---

**⚡ Comparaison des 3 endpoints livreur :**

| Endpoint | Module | Affiche | Statuts par défaut | Pagination | Format champs | Pour qui |
|----------|--------|---------|--------------------|------------|---------------|----------|
| `GET /express/livraison/disponibles` | Express Orders | Commandes sans livreur | `pret_a_expedier` | Non | camelCase | Tous les livreurs |
| `GET /express/livraison/mes-livraisons` | Express Orders | Commandes du livreur connecté | `accepte_livreur` + `en_route` | Non | camelCase | Livreur connecté |
| `GET /commande-express/livreur/mes-livraisons` | Commande Express | **Toutes** les commandes du livreur | **Tous les statuts** | Non (tableau plat) | **snake_case** | Livreur connecté |

---

### ✅ Prendre une livraison

**Endpoint :** `POST /express/livraison/:id/take`

**Headers :**
```http
Authorization: Bearer {token}
```

**Body :** _Aucun_ — L'ID de la commande est passé dans l'URL (`:id`).

**Réponse :**
```json
{
  "success": true,
  "message": "Livraison prise en charge avec succès",
  "order": {
    "id": 63,
    "statut": "accepte_livreur",
    "deliveryPersonId": 5
  }
}
```

---

### 🚗 Marquer en route (avec SMS automatique)

**Endpoint :** `PATCH /express/commandes/:id/status`

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "status": "en_route",
  "codeColis": "7477"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Statut mis à jour de \"accepte_livreur\" vers \"en_route\". Nouveau code de confirmation généré : 8924",
  "order": {
    "statut": "en_route"
  },
  "newCodeColis": "8924"
}
```

**⚠️ IMPORTANT :** 
- Le livreur doit fournir le **code colis** (ex: `7477`)
- Un **nouveau code** est généré pour la livraison finale (ex: `8924`)
- Un **SMS est automatiquement envoyé** au téléphone du client avec le nouveau code

---

### ✅ Marquer livré

**Endpoint :** `PATCH /express/commandes/:id/status`

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "status": "delivered",
  "codeColis": "8924"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Statut mis à jour de \"en_route\" vers \"delivered\"",
  "order": {
    "statut": "delivered"
  }
}
```

---

## 4️⃣ MODULE COMMANDE EXPRESS (CRUD + STOCK)

> Ce module est **indépendant** du module Express Orders (`/express/...`).
> Il gère les commandes express avec **déduction/restauration automatique du stock** pour les produits du catalogue.
>
> **Controller :** `CommandeExpressController`
> **Table :** `commande_express`
> **Routes :** `/commande-express/...`

---

### 🚀 Créer une commande express (avec gestion de stock)

**Endpoint :** `POST /commande-express/create`

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

> **💡** Supporte aussi `multipart/form-data` pour envoyer une image de colis en même temps.

**Body (JSON) :**
```json
{
  "clientId": 1,
  "clientName": "Client Test Express",
  "clientPhone": "+243999888777",
  "vendorId": 3,
  "packageValue": 500.00,
  "packageDescription": "Colis express - Smartphone + accessoires",
  "pickupAddress": "123 Avenue Kinshasa, Gombe",
  "deliveryAddress": "456 Boulevard Lumumba, Limete",
  "pickupReference": "Marché central",
  "deliveryReference": "Face église",
  "createdBy": 3,
  "statut": "pending",
  "items": [
    {
      "productId": 1,
      "name": "Samsung Galaxy",
      "description": "Smartphone Samsung Galaxy A54",
      "price": 450000,
      "quantity": 2,
      "weight": "500g"
    },
    {
      "name": "Coque protection",
      "description": "Coque silicone transparente",
      "price": 5000,
      "quantity": 1
    }
  ]
}
```

**Champs obligatoires :**

| Champ | Type | Validation | Description |
|-------|------|------------|-------------|
| `clientId` | number | positif | ID du client |
| `clientName` | string | 2-255 chars | Nom du client |
| `clientPhone` | string | 10-50 chars | Téléphone |
| `vendorId` | number | positif | ID du vendeur |
| `packageValue` | number | positif, max 2 décimales | Valeur du colis |
| `pickupAddress` | string | min 10 chars | Adresse de pickup |
| `deliveryAddress` | string | min 10 chars | Adresse de livraison |
| `createdBy` | number | positif | ID du créateur |
| `items` | array | min 1 item | Liste des articles |

**Champs optionnels :**

| Champ | Type | Description |
|-------|------|-------------|
| `packageDescription` | string | Description du colis |
| `pickupReference` | string | Point de repère pickup |
| `deliveryReference` | string | Point de repère livraison |
| `statut` | string | `pending`, `en_cours`, `livre`, `annule` (défaut: `pending`) |
| `imageColis` | file | Image du colis (jpg, jpeg, png, webp — max 20MB) |

**Items — champs :**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `productId` | number | Non | Si fourni → déduction stock + **enrichissement auto** (description, prix, image) |
| `name` | string | **Oui** | Nom du produit |
| `description` | string | Non | Auto-rempli depuis le produit si `productId` fourni |
| `price` | number | Non | Auto-rempli depuis le produit si `productId` fourni |
| `quantity` | number | **Oui** | Quantité (min 1) |
| `weight` | string | Non | Poids (ex: "2kg") |
| `urlProduct` | string | Non | **Auto-rempli** depuis `product.media.mediaUrl` si `productId` fourni |

**✨ Enrichissement automatique des items :**
- Si `productId` est fourni → le système récupère automatiquement `description`, `price` et `urlProduct` (photo) depuis la base de données
- Les valeurs fournies manuellement sont **toujours prioritaires** sur les valeurs du produit
- Si `productId` n'est pas fourni → les champs manquants restent `null`
- Tous les items retournent les **7 champs** : `productId`, `name`, `description`, `price`, `quantity`, `weight`, `urlProduct`

**⚙️ Comportement de la gestion de stock :**
- Items **avec** `productId` → stock vérifié et déduit automatiquement (avec `forUpdate` lock)
- Items **sans** `productId` → colis hors catalogue, aucune gestion de stock
- Si stock insuffisant → transaction annulée, **rien n'est créé**

**Réponse (201) :**
```json
{
  "success": true,
  "message": "Commande express créée avec succès",
  "data": {
    "commande": {
      "id": 5,
      "orderId": "6470e60f-c2a2-4824-b95e-34888effc8d4",
      "clientId": 1,
      "clientName": "Client Test Express",
      "clientPhone": "+243999888777",
      "vendorId": 3,
      "packageValue": 500.00,
      "packageDescription": "Colis express - Smartphone + accessoires",
      "pickupAddress": "123 Avenue Kinshasa, Gombe",
      "deliveryAddress": "456 Boulevard Lumumba, Limete",
      "pickupReference": "Marché central",
      "deliveryReference": "Face église",
      "statut": "pending",
      "items": [
        {
          "productId": 1,
          "name": "Samsung Galaxy",
          "description": "Smartphone Samsung Galaxy A54 5G avec écran AMOLED",
          "price": 450000,
          "quantity": 2,
          "weight": "500g",
          "urlProduct": "https://res.cloudinary.com/.../products/samsung.jpg"
        },
        {
          "productId": null,
          "name": "Coque protection",
          "description": "Coque silicone transparente",
          "price": 5000,
          "quantity": 1,
          "weight": null,
          "urlProduct": null
        }
      ],
      "deliveryPersonId": null,
      "imageColis": "https://res.cloudinary.com/.../express_xxx.jpg",
      "createdAt": "2026-03-21T10:30:00.000Z",
      "updatedAt": "2026-03-21T10:30:00.000Z"
    },
    "firebaseDocId": "abc123xyz",
    "stockUpdates": [
      {
        "productId": 1,
        "productName": "Samsung Galaxy",
        "previousStock": 50,
        "newStock": 48,
        "deducted": 2
      }
    ],
    "itemsInfo": {
      "total": 2,
      "withProductManagement": 1,
      "customItems": 1
    }
  }
}
```

**Erreurs possibles :**

| Code | Cas | Réponse |
|------|-----|---------|
| 400 | Stock insuffisant | `{"success": false, "message": "Stock insuffisant pour certains produits", "errors": [...]}` |
| 400 | Items JSON invalide | `{"success": false, "message": "Le champ items doit être un JSON valide"}` |
| 422 | Erreur de validation | `{"success": false, "message": "Erreur de validation", "errors": {...}}` |

---

### 📋 Lister toutes les commandes express

**Endpoint :** `GET /commande-express/list`

**Headers :**
```http
Authorization: Bearer {token}
```

**Query Parameters :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `page` | number | Non | 1 | Numéro de page |
| `limit` | number | Non | 20 | Résultats par page |
| `status` | string | Non | — | Filtrer par statut |

**Exemples :**
```bash
# Toutes les commandes (paginé)
curl -X GET "http://localhost:3333/commande-express/list" \
  -H "Authorization: Bearer {token}"

# Filtrer par statut + pagination
curl -X GET "http://localhost:3333/commande-express/list?status=en_cours&page=1&limit=10" \
  -H "Authorization: Bearer {token}"
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "meta": {
      "total": 15,
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
        "id": 5,
        "orderId": "6470e60f-c2a2-4824-b95e-34888effc8d4",
        "clientId": 1,
        "clientName": "Client Test Express",
        "statut": "pending",
        "items": [...],
        "deliveryPersonId": null,
        "createdAt": "2026-03-21T10:30:00.000Z",
        "updatedAt": "2026-03-21T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 📄 Détails d'une commande express

**Endpoint :** `GET /commande-express/:id`

> **💡** Accepte un ID numérique **ou** un UUID (`orderId`).

**Headers :**
```http
Authorization: Bearer {token}
```

**Exemples :**
```bash
# Par ID numérique
curl -X GET "http://localhost:3333/commande-express/5" \
  -H "Authorization: Bearer {token}"

# Par UUID (orderId)
curl -X GET "http://localhost:3333/commande-express/6470e60f-c2a2-4824-b95e-34888effc8d4" \
  -H "Authorization: Bearer {token}"
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "orderId": "6470e60f-c2a2-4824-b95e-34888effc8d4",
    "clientId": 1,
    "clientName": "Client Test Express",
    "clientPhone": "+243999888777",
    "vendorId": 3,
    "packageValue": "500.00",
    "packageDescription": "Colis express",
    "pickupAddress": "123 Avenue Kinshasa",
    "deliveryAddress": "456 Boulevard Lumumba",
    "pickupReference": "Marché central",
    "deliveryReference": "Face église",
    "statut": "en_cours",
    "items": [...],
    "deliveryPersonId": 5,
    "imageColis": "https://res.cloudinary.com/.../express_xxx.jpg",
    "codeColis": "1234",
    "deliveryFee": 6240,
    "totalAvecLivraison": 506240,
    "clientLatitude": -4.3400,
    "clientLongitude": 15.3100,
    "vendorLatitude": -4.3443732,
    "vendorLongitude": 15.2629869,
    "address": null,
    "numeroPayment": null,
    "createdAt": "2026-03-21T10:30:00.000Z",
    "updatedAt": "2026-03-21T11:00:00.000Z"
  }
}
```

**Erreur 404 :**
```json
{
  "success": false,
  "message": "Commande express non trouvée"
}
```

---

### 📝 Mes commandes (client connecté)

**Endpoint :** `GET /commande-express/mes-commandes`

**Description :** Retourne les commandes où `client_id` = user connecté.

**Headers :**
```http
Authorization: Bearer {token}
```

**Query Parameters :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `page` | number | Non | 1 | Numéro de page |
| `limit` | number | Non | 20 | Résultats par page |
| `status` | string | Non | — | Filtrer par statut |

```bash
curl -X GET "http://localhost:3333/commande-express/mes-commandes" \
  -H "Authorization: Bearer {token}"

curl -X GET "http://localhost:3333/commande-express/mes-commandes?status=en_cours&page=1&limit=5" \
  -H "Authorization: Bearer {token}"
```

**Réponse :** Même format paginé que `GET /commande-express/list`.

---

### 📦 Mes commandes (vendeur connecté)

**Endpoint :** `GET /commande-express/vendeur/mes-commandes`

**Description :** Retourne les commandes où `vendor_id` = user connecté.

**Headers :**
```http
Authorization: Bearer {token}
```

**Query Parameters :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `page` | number | Non | 1 | Numéro de page |
| `limit` | number | Non | 20 | Résultats par page |
| `status` | string | Non | — | Filtrer par statut |

```bash
curl -X GET "http://localhost:3333/commande-express/vendeur/mes-commandes" \
  -H "Authorization: Bearer {token}"

curl -X GET "http://localhost:3333/commande-express/vendeur/mes-commandes?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer {token}"
```

**Réponse :** Même format paginé que `GET /commande-express/list`.

---

### 📦 Commandes disponibles pour livreurs

**Endpoint :** `GET /commande-express/livreur/disponibles`

**Description :** Retourne les commandes avec statut `pending` et sans livreur assigné (`delivery_person_id IS NULL`).

**Headers :**
```http
Authorization: Bearer {token}
```

**Query Parameters :**

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `page` | number | Non | 1 | Numéro de page |
| `limit` | number | Non | 20 | Résultats par page |

```bash
curl -X GET "http://localhost:3333/commande-express/livreur/disponibles" \
  -H "Authorization: Bearer {token}"
```

**Réponse :** Même format paginé que `GET /commande-express/list`, filtré sur `statut = 'pending'` et `delivery_person_id IS NULL`.

---

### 🔄 Modifier le statut d'une commande

**Endpoint :** `PATCH /commande-express/:id/status`

> **💡** Accepte un ID numérique **ou** un UUID (`orderId`).

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "statut": "en_cours",
  "reason": "Livreur en route vers le client"
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `statut` | string | **Oui** | `pending`, `en_cours`, `livre`, `annule` |
| `reason` | string | Non | Raison du changement |

**Exemples :**
```bash
# Passer en cours
curl -X PATCH "http://localhost:3333/commande-express/5/status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"statut": "en_cours"}'

# Marquer comme livré
curl -X PATCH "http://localhost:3333/commande-express/5/status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"statut": "livre"}'

# Annuler avec raison
curl -X PATCH "http://localhost:3333/commande-express/5/status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"statut": "annule", "reason": "Client indisponible"}'
```

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Statut de la commande mis à jour avec succès",
  "data": {
    "id": 5,
    "orderId": "6470e60f-c2a2-4824-b95e-34888effc8d4",
    "statut": "en_cours",
    "updatedAt": "2026-03-21T11:00:00.000Z"
  }
}
```

---

### 🚴 Assigner un livreur

**Endpoint :** `PATCH /commande-express/:id/assign-livreur`

> **💡** Accepte un ID numérique **ou** un UUID (`orderId`).
>
> **⚙️ Automatisme :** Si le statut est `pending`, il passe **automatiquement** à `en_cours` lors de l'assignation.

**Headers :**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Body :**
```json
{
  "deliveryPersonId": 5
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `deliveryPersonId` | number | **Oui** | ID du livreur à assigner |

**Exemple :**
```bash
curl -X PATCH "http://localhost:3333/commande-express/5/assign-livreur" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"deliveryPersonId": 5}'
```

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Livreur assigné avec succès",
  "data": {
    "id": 5,
    "orderId": "6470e60f-c2a2-4824-b95e-34888effc8d4",
    "statut": "en_cours",
    "deliveryPersonId": 5,
    "updatedAt": "2026-03-21T11:05:00.000Z"
  }
}
```

---

### 🗑️ Supprimer une commande (avec restauration de stock)

**Endpoint :** `DELETE /commande-express/:id`

> **💡** Accepte un ID numérique **ou** un UUID (`orderId`).
>
> **⚙️ Automatisme :** Le stock est **restauré automatiquement** pour tous les items ayant un `productId`. L'image Cloudinary est aussi supprimée si elle existe.

**Headers :**
```http
Authorization: Bearer {token}
```

**Exemple :**
```bash
curl -X DELETE "http://localhost:3333/commande-express/5" \
  -H "Authorization: Bearer {token}"
```

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Commande supprimée et stock restauré avec succès",
  "data": {
    "deletedCommande": {
      "id": 5,
      "orderId": "6470e60f-c2a2-4824-b95e-34888effc8d4"
    },
    "stockRestored": [
      {
        "productId": 1,
        "productName": "Samsung Galaxy",
        "previousStock": 48,
        "newStock": 50,
        "restored": 2
      }
    ]
  }
}
```

**Si aucun produit à restaurer :**
```json
{
  "success": true,
  "message": "Commande supprimée avec succès (aucun produit à restaurer)",
  "data": {
    "deletedCommande": {
      "id": 5,
      "orderId": "6470e60f-c2a2-4824-b95e-34888effc8d4"
    },
    "stockRestored": null
  }
}
```

---

### 📊 Récapitulatif des endpoints `/commande-express`

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/commande-express/create` | Créer + déduction stock | ✅ |
| `GET` | `/commande-express/list` | Lister toutes (paginé) | ✅ |
| `GET` | `/commande-express/:id` | Détails (ID ou UUID) | ✅ |
| `GET` | `/commande-express/mes-commandes` | Commandes du client connecté | ✅ |
| `GET` | `/commande-express/vendeur/mes-commandes` | Commandes du vendeur connecté | ✅ |
| `GET` | `/commande-express/livreur/disponibles` | Commandes disponibles (pending, sans livreur) | ✅ |
| `GET` | `/commande-express/livreur/mes-livraisons` | Livraisons du livreur connecté (tous statuts) | ✅ |
| `PATCH` | `/commande-express/:id/status` | Modifier le statut | ✅ |
| `PATCH` | `/commande-express/:id/assign-livreur` | Assigner un livreur | ✅ |
| `DELETE` | `/commande-express/:id` | Supprimer + restauration stock | ✅ |

---

## 📊 STATUTS DE COMMANDE

### Cycle de vie complet

```
pending_payment (Vendeur initialise)
    ↓ (Vendeur ajoute moyen paiement)
pending
    ↓ (Vendeur accepte)
en_preparation
    ↓ (Vendeur upload photo + code généré)
pret_a_expedier
    ↓ (Livreur prend livraison)
accepte_livreur
    ↓ (Livreur en route + SMS au client)
en_route
    ↓ (Livreur confirme livraison)
delivered (FINAL)
```

### Statuts disponibles

| Statut | Description | Qui peut changer |
|--------|-------------|------------------|
| `pending_payment` | En attente de paiement | Vendeur |
| `pending` | Paiement ajouté | Vendeur |
| `en_preparation` | En cours de préparation | Vendeur |
| `pret_a_expedier` | Prêt à être expédié | Vendeur |
| `accepte_livreur` | Livreur assigné | Livreur |
| `en_route` | En route pour livraison | Livreur |
| `delivered` | Livré (final) | Livreur |
| `cancelled` | Annulé | Vendeur/Livreur |
| `rejected` | Rejeté | Vendeur |

---

## 🔒 PERMISSIONS PAR RÔLE

### Vendeur (`role: "vendeur"`)
- ✅ Créer/lister clients
- ✅ Initialiser commandes
- ✅ Ajouter moyen de paiement
- ✅ Voir ses commandes
- ✅ Changer statut (`pending` → `en_preparation` → `pret_a_expedier`)
- ✅ Upload photo colis
- ✅ Annuler commandes

### Livreur (`role: "livreur"`)
- ✅ Voir livraisons disponibles (`/express/livraison/disponibles`)
- ✅ Voir ses livraisons en cours (`/express/livraison/mes-livraisons`)
- ✅ **Voir toutes ses livraisons** (`/commande-express/livreur/mes-livraisons`) — avec filtre `?status=`
- ✅ Prendre livraison (`/express/livraison/:id/take`)
- ✅ Changer statut (`accepte_livreur` → `en_route` → `delivered`)
- ✅ Annuler avec raison

---

## 🚨 GESTION DES ERREURS

### Codes d'erreur courants

| Code | Message | Solution |
|------|---------|----------|
| 403 | `Seuls les vendeurs peuvent...` | Vérifier que `user.role === "vendeur"` |
| 404 | `Client non trouvé` | Vérifier que `clientId` existe et appartient au vendeur |
| 400 | `Photo du colis et code obligatoires` | Upload photo avant `pret_a_expedier` |
| 400 | `Code du colis incorrect` | Vérifier le code fourni |
| 400 | `Transition non autorisée` | Vérifier le cycle de vie des statuts |

### Exemple de réponse d'erreur

```json
{
  "success": false,
  "message": "Client non trouvé ou n'appartient pas à ce vendeur"
}
```

---

## 💡 EXEMPLES D'INTÉGRATION

### React/Vue/Angular

```javascript
// 1. Login
const login = async () => {
  const response = await fetch('http://localhost:3333/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: '+243826016607',
      password: '0826016607Makengo@'
    })
  });
  const data = await response.json();
  return data.token.token;
};

// 2. Créer un client
const createClient = async (token) => {
  const response = await fetch('http://localhost:3333/express/clients', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Jean Kabongo',
      phone: '+243999888777',
      email: 'jean@example.com',
      ville: 'Kinshasa',
      commune: 'Gombe'
    })
  });
  return await response.json();
};

// 3. Initialiser commande
const initOrder = async (token, clientId) => {
  const response = await fetch('http://localhost:3333/express/commandes/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId,
      items: [{ name: 'Colis urgent', quantity: 1 }],
      packageValue: 50000,
      packageDescription: 'Documents',
      latitude: -4.3217,
      longitude: 15.3010
    })
  });
  return await response.json();
};

// 4. Upload photo
const uploadPhoto = async (token, orderId, file) => {
  const formData = new FormData();
  formData.append('packagePhoto', file);
  
  const response = await fetch(`http://localhost:3333/express/commandes/${orderId}/upload-package-photo`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return await response.json();
};

// 5. Changer statut
const updateStatus = async (token, orderId, status, codeColis = null) => {
  const body = { status };
  if (codeColis) body.codeColis = codeColis;
  
  const response = await fetch(`http://localhost:3333/express/commandes/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return await response.json();
};
```

### Flutter/Dart

```dart
// Service API
class ExpressOrderService {
  final String baseUrl = 'http://localhost:3333';
  String? token;

  Future<void> login(String uid, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'uid': uid, 'password': password}),
    );
    final data = jsonDecode(response.body);
    token = data['token']['token'];
  }

  Future<Map<String, dynamic>> createClient(Map<String, dynamic> clientData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/express/clients'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(clientData),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> initializeOrder(Map<String, dynamic> orderData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/express/commandes/initialize'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(orderData),
    );
    return jsonDecode(response.body);
  }
}
```

---

## 📝 NOTES IMPORTANTES

### 1. SMS Automatique
- Le SMS est envoyé **automatiquement** au client quand le livreur marque la commande `en_route`
- Le SMS contient le **nouveau code de confirmation** pour la livraison
- Le numéro utilisé est `client.phone` de la table `client_express`

### 2. Codes de livraison
Le système utilise **2 codes** distincts pour sécuriser le processus :

**Code #1 - Code vendeur** (ex: `1266`)
- Généré **automatiquement** lors de la création de la commande
- Utilisé par le vendeur pour suivre la commande
- Visible dans `GET /express/commandes/vendeur`

**Code #2 - Code livreur** (ex: `9636`)
- Généré **automatiquement** lors du passage en `pret_a_expedier`
- Utilisé par le livreur pour récupérer le colis chez le vendeur
- Le livreur doit fournir ce code pour passer en `en_route`
- Visible dans `GET /express/livraison/disponibles`

**Code #3 - Code livraison client** (ex: `8924`)
- Généré **automatiquement** quand le livreur passe en `en_route`
- Envoyé par SMS au client
- Le client doit fournir ce code pour confirmer la réception

### 3. Coordonnées GPS (Client et Vendeur)
Chaque commande stocke **4 coordonnées GPS** :

**Coordonnées CLIENT (point de livraison) :**
- Source prioritaire : `latitude/longitude` dans le payload de la requête
- Source secondaire : `latitude/longitude` du client enregistré (`client_express`)
- Si aucune source : `null`

**Coordonnées VENDEUR (point de départ) :**
- Source : `latitude/longitude` du vendeur connecté (table `users`)
- Si non disponible : `null`

**Calcul des frais de livraison :**
- Si les 4 coordonnées sont disponibles → Distance réelle calculée entre vendeur et client
- Sinon → `deliveryFee = 0`

**Avantages :**
- ✅ Traçabilité complète du trajet
- ✅ Frais de livraison précis basés sur la vraie distance
- ✅ Historique figé au moment de la création de la commande

### 4. Différence avec E-commerce
- **Express** : Vendeur crée pour un client enregistré
- **E-commerce** : Acheteur crée sa propre commande
- Les deux modules sont **complètement indépendants**

### 5. Données disponibles pour le livreur

L'endpoint `GET /express/livraison/disponibles` fournit au livreur **toutes les informations** nécessaires pour effectuer la livraison :

**Informations client :**
- `clientName` : Nom du client
- `clientPhone` : Téléphone du client
- `clientLatitude/clientLongitude` : Coordonnées GPS exactes de la destination

**Informations vendeur :**
- `vendorLatitude/vendorLongitude` : Coordonnées GPS du point de départ (pickup)

**Informations colis :**
- `packagePhoto` : Photo du colis à récupérer
- `codeColis` : Code de vérification
- `items[]` : Liste détaillée des produits avec photos (`urlProduct`)
- `packageValue` : Valeur du colis
- `deliveryFee` : Frais de livraison

**Adresses :**
- `deliveryAddress` : Adresse textuelle de livraison
- `pickupAddress` : Adresse textuelle de pickup (si fournie)

**Utilisation recommandée :**
1. Utiliser `vendorLatitude/vendorLongitude` pour naviguer vers le vendeur
2. Récupérer le colis en vérifiant avec `packagePhoto` et `items[]`
3. Utiliser `clientLatitude/clientLongitude` pour naviguer vers le client
4. Livrer en vérifiant le `codeColis`

---

## 🔗 RESSOURCES

- **Base URL Production :** `http://24.144.87.127:3333`
- **Base URL Local :** `http://localhost:3333`
- **Documentation E-commerce :** Voir `ECOMMERCE_ORDERS_MODULE.md`

---

**Version :** 1.4.0  
**Date :** 21 Mars 2026  
**Module :** Express Orders + Commande Express  

**Changelog v1.4.0 :**
- **Enrichissement des items à la lecture** — les endpoints GET enrichissent désormais les items en temps réel depuis la base produit :
  - `GET /express/livraison/disponibles` — items enrichis avec `description`, `price`, `urlProduct`
  - `GET /express/livraison/mes-livraisons` — items enrichis avec `description`, `price`, `urlProduct`
  - `GET /express/commandes/vendeur` — items enrichis avec `description`, `price`, `urlProduct`
- **`urlProduct`** = URL Cloudinary de la photo du produit (auto-remplie si `productId` fourni, `null` sinon)
- Exemples de réponses mis à jour avec des **données réelles testées** le 21/03/2026
- Ajout tableaux détaillés des champs retournés par item (7 champs explicites)
- Précision : les coordonnées GPS et montants sont retournés en `string` (ex: `"-4.35000000"`, `"460000.00"`) — le frontend doit utiliser `parseFloat()`
- Distinction explicite : `urlProduct` (photo **produit**) vs `packagePhoto` (photo **colis**)

**Changelog v1.3.0 :**
- `POST /commande-express/create` — **enrichissement automatique des items** : si `productId` fourni, `description`, `price` et `urlProduct` (photo) sont récupérés depuis la base produit
- Les items retournent maintenant les 7 champs complets (`productId`, `name`, `description`, `price`, `quantity`, `weight`, `urlProduct`)
- Mise à jour de la doc avec exemples de réponses enrichies

**Changelog v1.2.0 :**
- Ajout section complète **4️⃣ MODULE COMMANDE EXPRESS** avec tous les endpoints `/commande-express/...`
- `POST /commande-express/create` — création avec déduction automatique du stock
- `GET /commande-express/list` — liste paginée avec filtre statut
- `GET /commande-express/:id` — détails par ID ou UUID
- `GET /commande-express/mes-commandes` — commandes du client connecté
- `GET /commande-express/vendeur/mes-commandes` — commandes du vendeur connecté
- `GET /commande-express/livreur/disponibles` — commandes disponibles pour livreurs
- `GET /commande-express/livreur/mes-livraisons` — livraisons du livreur (tous statuts, sans pagination)
- `PATCH /commande-express/:id/status` — modification de statut
- `PATCH /commande-express/:id/assign-livreur` — assignation livreur (auto `pending` → `en_cours`)
- `DELETE /commande-express/:id` — suppression avec restauration automatique du stock
- Tableau récapitulatif des 10 endpoints `/commande-express`

**Changelog v1.1.0 :**
- Ajout enrichissement automatique des items avec `productId` (description, prix, photo)
- Tous les items retournent les 7 champs (`productId`, `name`, `description`, `price`, `quantity`, `weight`, `urlProduct`)
- Ajout endpoint `GET /express/livraison/mes-livraisons` (livraisons en cours du livreur connecté)
- Mise à jour des exemples de réponses avec données réelles
