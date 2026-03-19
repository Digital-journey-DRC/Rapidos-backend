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
      "name": "Colis urgent",
      "description": "Documents importants",
      "quantity": 1,
      "weight": "2kg"
    }
  ],
  "packageValue": 50000,
  "packageDescription": "Documents confidentiels",
  "pickupAddress": "Bureau vendeur, Gombe",
  "deliveryAddress": "123 Avenue du Port, Gombe",
  "latitude": -4.3217,
  "longitude": 15.3010
}
```

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
    "id": 63,
    "orderId": "adc08410-f944-404b-9bb8-da1ae28d61d7",
    "statut": "pending_payment",
    "clientId": 12,
    "clientName": "Jean Kabongo",
    "clientPhone": "+243999888777",
    "vendorId": 3,
    "packageValue": 50000,
    "deliveryFee": 13550,
    "totalAvecLivraison": 63550,
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
      "id": 63,
      "orderId": "adc08410-f944-404b-9bb8-da1ae28d61d7",
      "statut": "pending",
      "clientId": 12,
      "clientName": "Jean Kabongo",
      "clientPhone": "+243999888777",
      "deliveryAddress": "123 Avenue du Port, Gombe",
      "packagePhoto": "https://res.cloudinary.com/deb9kfhnx/image/upload/v1773861636/rapidos/ecommerce-packages/order_2cd0c06a-f14d-4f25-93e9-292cc6ed61f8_1773861633964.png",
      "items": [
        {
          "name": "Colis urgent",
          "description": "Documents importants",
          "quantity": 1,
          "price": 50000,
          "urlProduct": "https://..."
        }
      ],
      "clientLatitude": -4.3217,
      "clientLongitude": 15.3010,
      "vendorLatitude": -4.2408052,
      "vendorLongitude": 15.2914667,
      "packageValue": 50000,
      "deliveryFee": 13550,
      "totalAvecLivraison": 63550,
      "codeColis": "7477",
      "paymentMethodId": 1,
      "deliveryPersonId": null,
      "createdAt": "2026-03-18T20:15:00.000Z",
      "updatedAt": "2026-03-18T20:15:00.000Z"
    }
  ]
}
```

**📦 Détails retournés :**
- `items[]` : Liste complète des produits avec photos (`urlProduct`)
- `packagePhoto` : Photo du colis uploadée
- `clientLatitude/clientLongitude` : Coordonnées GPS du client (destination)
- `vendorLatitude/vendorLongitude` : Coordonnées GPS du vendeur (départ)
- `codeColis` : Code de vérification (généré après upload photo)
- `deliveryPersonId` : ID du livreur (null si pas encore assigné)

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

### 📦 Voir livraisons disponibles

**Endpoint :** `GET /express/livraison/disponibles`

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
      "id": 63,
      "orderId": "adc08410-f944-404b-9bb8-da1ae28d61d7",
      "statut": "pret_a_expedier",
      "clientName": "Jean Kabongo",
      "clientPhone": "+243999888777",
      "deliveryAddress": "123 Avenue du Port, Gombe",
      "packagePhoto": "https://...",
      "codeColis": "7477",
      "items": [
        {
          "name": "Smartphone Samsung",
          "quantity": 1,
          "price": 450000,
          "urlProduct": "https://..."
        }
      ],
      "clientLatitude": -4.3217,
      "clientLongitude": 15.3010,
      "vendorLatitude": -4.2408052,
      "vendorLongitude": 15.2914667,
      "packageValue": 50000,
      "deliveryFee": 13550,
      "totalAvecLivraison": 63550
    }
  ]
}
```

**📍 Coordonnées GPS pour la navigation :**
- `clientLatitude/clientLongitude` : Point de livraison (destination)
- `vendorLatitude/vendorLongitude` : Point de départ (pickup chez le vendeur)
- Ces coordonnées permettent au livreur de calculer l'itinéraire complet

---

### ✅ Prendre une livraison

**Endpoint :** `POST /express/livraison/:id/take`

**Headers :**
```http
Authorization: Bearer {token}
```

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
- ✅ Voir livraisons disponibles
- ✅ Prendre livraison
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

**Version :** 1.0.0  
**Date :** 18 Mars 2026  
**Module :** Express Orders
