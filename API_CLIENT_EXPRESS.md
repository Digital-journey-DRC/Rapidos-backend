# 📋 API Client Express - Documentation

## 🎯 Vue d'Ensemble

Le module **Client Express** permet aux **vendeurs** de gérer leurs clients pour les commandes express :
- ✅ Créer et stocker les informations des clients
- ✅ Adresse par défaut pour faciliter la création de commandes
- ✅ Recherche rapide par téléphone
- ✅ Notes et références pour chaque client

---

## 📡 Endpoints

### Base URL
```
http://localhost:3333
```

### Authentication
Tous les endpoints nécessitent un token Bearer (sauf `/create-table`)
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 1. Créer un Client

```http
POST /client-express/create
```

**Headers**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body**
```json
{
  "name": "Client Test Express",
  "phone": "+243999888777",
  "email": "client@example.com",
  "defaultAddress": "123 Avenue de la Liberté, Kinshasa",
  "defaultReference": "Près du marché central",
  "vendorId": 1,
  "notes": "Client régulier, préfère les livraisons le matin"
}
```

**Champs**
- `name` (obligatoire) : Nom complet du client
- `phone` (obligatoire) : Numéro de téléphone (min 8 caractères)
- `email` (optionnel) : Email du client
- `defaultAddress` (optionnel) : Adresse par défaut pour les livraisons
- `defaultReference` (optionnel) : Point de référence
- `vendorId` (obligatoire) : ID du vendeur propriétaire
- `notes` (optionnel) : Notes sur le client

**Response 201**
```json
{
  "success": true,
  "message": "Client express créé avec succès",
  "data": {
    "id": 1,
    "name": "Client Test Express",
    "phone": "+243999888777",
    "email": "client@example.com",
    "defaultAddress": "123 Avenue de la Liberté, Kinshasa",
    "defaultReference": "Près du marché central",
    "vendorId": 1,
    "notes": "Client régulier, préfère les livraisons le matin",
    "createdAt": "2026-02-23T10:30:00.000Z",
    "updatedAt": "2026-02-23T10:30:00.000Z"
  }
}
```

---

## 2. Lister les Clients

```http
GET /client-express/list?page=1&limit=20&search=
```

**Query Parameters**
- `page` (optionnel, default: 1)
- `limit` (optionnel, default: 20)
- `search` (optionnel) : Recherche par nom ou téléphone

**Response 200**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Client Test Express",
        "phone": "+243999888777",
        "email": "client@example.com",
        "defaultAddress": "123 Avenue de la Liberté",
        "vendorId": 1,
        ...
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

## 3. Rechercher par Téléphone

```http
GET /client-express/search-by-phone?phone=+243999888777
```

**Description** : Recherche rapide d'un client par son numéro de téléphone

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Client Test Express",
    "phone": "+243999888777",
    "email": "client@example.com",
    "defaultAddress": "123 Avenue de la Liberté",
    ...
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

## 4. Détails d'un Client

```http
GET /client-express/:id
```

**Exemple**
```bash
GET /client-express/1
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Client Test Express",
    "phone": "+243999888777",
    ...
  }
}
```

---

## 5. Modifier un Client

```http
PUT /client-express/:id
```

**Body** (tous les champs sont optionnels)
```json
{
  "name": "Nouveau Nom",
  "phone": "+243888777666",
  "email": "newemail@example.com",
  "defaultAddress": "Nouvelle adresse",
  "defaultReference": "Nouvelle référence",
  "notes": "Nouvelles notes"
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Client mis à jour avec succès",
  "data": { ... }
}
```

---

## 6. Supprimer un Client

```http
DELETE /client-express/:id
```

**Response 200**
```json
{
  "success": true,
  "message": "Client supprimé avec succès",
  "data": {
    "id": 1,
    "name": "Client Test Express"
  }
}
```

---

## 🎯 Cas d'Usage Frontend

### 1. Créer un client
```javascript
const createClient = async () => {
  const response = await fetch('http://localhost:3333/client-express/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "Client Test",
      phone: "+243999999999",
      email: "client@test.com",
      defaultAddress: "123 Avenue Test",
      vendorId: currentUser.id,
      notes: "Client VIP"
    })
  });
  
  const data = await response.json();
  return data.data; // Retourne le client créé
};
```

### 2. Rechercher un client par téléphone (autocomplete)
```javascript
const searchClientByPhone = async (phone) => {
  const response = await fetch(
    `http://localhost:3333/client-express/search-by-phone?phone=${encodeURIComponent(phone)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    // Client trouvé, pré-remplir le formulaire
    return data.data;
  } else {
    // Client non trouvé, créer un nouveau
    return null;
  }
};
```

### 3. Lister les clients avec recherche
```javascript
const getMyClients = async (page = 1, search = '') => {
  let url = `http://localhost:3333/client-express/list?page=${page}&limit=20`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
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

### 4. Créer une commande avec un client existant
```javascript
const createOrderFromClient = async (clientId) => {
  // 1. Récupérer les infos du client
  const clientResponse = await fetch(`http://localhost:3333/client-express/${clientId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const clientData = await clientResponse.json();
  const client = clientData.data;
  
  // 2. Créer la commande avec les infos du client
  const orderResponse = await fetch('http://localhost:3333/commande-express/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      vendorId: currentUser.id,
      deliveryAddress: client.defaultAddress, // Utiliser l'adresse par défaut
      deliveryReference: client.defaultReference,
      ...
    })
  });
  
  return await orderResponse.json();
};
```

---

## 🧪 Tests cURL

### Créer un client
```bash
curl -X POST "http://localhost:3333/client-express/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client",
    "phone": "+243999999999",
    "vendorId": 1
  }'
```

### Lister les clients
```bash
curl -X GET "http://localhost:3333/client-express/list?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Rechercher par téléphone
```bash
curl -X GET "http://localhost:3333/client-express/search-by-phone?phone=+243999999999" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Modifier un client
```bash
curl -X PUT "http://localhost:3333/client-express/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau Nom"
  }'
```

### Supprimer un client
```bash
curl -X DELETE "http://localhost:3333/client-express/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔒 Sécurité

### Règles d'Accès
- ✅ **Vendeurs** : Peuvent créer, modifier et supprimer uniquement leurs propres clients
- ✅ **Admin** : Accès complet à tous les clients
- ❌ Un vendeur ne peut pas voir les clients d'un autre vendeur

### Validation
- Nom : minimum 2 caractères, maximum 255
- Téléphone : minimum 8 caractères, maximum 50
- Email : format email valide (optionnel)

---

## 💡 Workflow Recommandé

### Scénario 1 : Nouveau Client
1. Vendeur saisit le téléphone du client
2. App cherche avec `/search-by-phone`
3. Si non trouvé → Formulaire pour créer le client
4. Créer le client avec `/create`
5. Créer la commande avec les infos du client

### Scénario 2 : Client Existant
1. Vendeur saisit le téléphone
2. App trouve le client avec `/search-by-phone`
3. Afficher les infos (nom, adresse par défaut)
4. Pré-remplir le formulaire de commande
5. Créer la commande

### Scénario 3 : Sélection depuis la Liste
1. Afficher la liste avec `/list`
2. Recherche en temps réel avec `search` param
3. Vendeur sélectionne un client
4. Pré-remplir le formulaire de commande

---

## 📊 Structure de la Table

```sql
CREATE TABLE client_express (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  default_address TEXT,
  default_reference VARCHAR(255),
  vendor_id INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_client_express_vendor_id ON client_express(vendor_id);
CREATE INDEX idx_client_express_phone ON client_express(phone);
```

---

## ✅ Avantages

1. **Rapidité** : Créer des commandes express plus rapidement
2. **Mémorisation** : Adresses par défaut enregistrées
3. **Recherche** : Trouver un client par téléphone instantanément
4. **Organisation** : Notes pour chaque client
5. **Historique** : Tous les clients sauvegardés

---

**✅ Module Client Express Opérationnel !**
