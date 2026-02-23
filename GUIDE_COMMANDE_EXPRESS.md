# 📦 Commande Express - Guide Rapide

## 🎯 Qu'est-ce qu'une Commande Express ?

Les **commandes express** sont créées par les **VENDEURS** pour livrer :
- ✅ **Produits du catalogue** (avec gestion automatique du stock)
- ✅ **Colis hors application** (vêtements, documents, objets personnels)
- ✅ **Combinaison des deux**

---

## 🔐 Authentification

Tous les endpoints nécessitent un token Bearer :
```bash
Authorization: Bearer votre_token
```

---

## 📋 Endpoints Disponibles

### **1. Créer une Commande Express**
```http
POST /commande-express/create
```

**Champs obligatoires :**
- `clientId` : ID du client
- `clientName` : Nom du client
- `clientPhone` : Téléphone du client
- `vendorId` : ID du vendeur (créateur)
- `packageValue` : Valeur totale
- `packageDescription` : Description du colis
- `pickupAddress` : Adresse de ramassage
- `deliveryAddress` : Adresse de livraison
- `createdBy` : ID de l'utilisateur créateur
- `items` : Liste des items

---

### **Types de Commandes**

#### **A. Commande avec Produits (Stock Géré)**
```json
{
  "clientId": 1,
  "clientName": "Jean Dupont",
  "clientPhone": "+243828191010",
  "vendorId": 1,
  "packageValue": 1700.00,
  "packageDescription": "Produits du catalogue",
  "pickupAddress": "123 Avenue Kinshasa",
  "deliveryAddress": "456 Boulevard Gombe",
  "createdBy": 1,
  "items": [
    {
      "productId": 5,
      "name": "Laptop Dell",
      "price": 850.00,
      "quantity": 2
    }
  ]
}
```

**✅ Comportement** : Le stock est automatiquement déduit

---

#### **B. Commande Hors Application (Sans Stock)**
```json
{
  "clientId": 1,
  "clientName": "Jean Dupont",
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
    },
    {
      "name": "Documents",
      "description": "Enveloppe scellée",
      "quantity": 1,
      "weight": "500g",
      "price": 200.00
    }
  ]
}
```

**✅ Comportement** : Pas de gestion de stock, items libres

---

#### **C. Commande Mixte**
```json
{
  "clientId": 1,
  "clientName": "Jean Dupont",
  "clientPhone": "+243828191010",
  "vendorId": 1,
  "packageValue": 1000.00,
  "packageDescription": "Produits + colis perso",
  "pickupAddress": "555 Boulevard Triomphal",
  "deliveryAddress": "888 Avenue des Martyrs",
  "createdBy": 1,
  "items": [
    {
      "productId": 1,
      "name": "Laptop Dell",
      "price": 850.00,
      "quantity": 1
    },
    {
      "name": "Accessoires",
      "description": "Câbles et chargeurs",
      "quantity": 1,
      "weight": "1kg",
      "price": 150.00
    }
  ]
}
```

**✅ Comportement** : Stock déduit uniquement pour l'item avec `productId`

---

### **2. Mes Commandes (Vendeur)**
```http
GET /commande-express/vendeur/mes-commandes?page=1&limit=20&status=pending
```

Récupère les commandes créées par le vendeur connecté.

---

### **3. Mes Commandes (Client)**
```http
GET /commande-express/mes-commandes?page=1&limit=20
```

Récupère les commandes du client connecté.

---

### **4. Commandes Disponibles (Livreur)**
```http
GET /commande-express/livreur/disponibles?page=1&limit=20
```

Commandes en attente sans livreur assigné.

---

### **5. Mes Livraisons (Livreur)**
```http
GET /commande-express/livreur/mes-livraisons?page=1&limit=20
```

Livraisons assignées au livreur connecté.

---

### **6. Modifier le Statut**
```http
PATCH /commande-express/:id/status
```

**Body :**
```json
{
  "statut": "en_cours",
  "reason": "Commande en cours de traitement"
}
```

**Statuts possibles :**
- `pending` : En attente
- `en_cours` : En cours
- `livre` : Livrée
- `annule` : Annulée

---

### **7. Supprimer (Restaure le Stock)**
```http
DELETE /commande-express/:id
```

**✅ Comportement** : 
- Supprime la commande
- Restaure automatiquement le stock pour les items avec `productId`

---

## 🧪 Tests Rapides

### Test 1 : Créer commande avec produits
```bash
./test_commande_express_create.sh
```

### Test 2 : Voir mes commandes (vendeur)
```bash
./test_commande_express_vendeur.sh
```

### Test 3 : Lister toutes les commandes
```bash
./test_commande_express_list.sh
```

---

## 📊 Gestion du Stock

### ✅ Items AVEC `productId`
- Stock vérifié avant création
- Stock déduit automatiquement
- Stock restauré lors de la suppression
- Protection par transaction (atomique)

### ✅ Items SANS `productId`
- Pas de vérification de stock
- Pas de déduction
- Pas de restauration
- Items libres (nom, description, poids, etc.)

---

## 🔒 Sécurité

- ✅ Transactions atomiques PostgreSQL
- ✅ Lock optimiste (`forUpdate()`)
- ✅ Validation complète avec VineJS
- ✅ Logs structurés
- ✅ Gestion d'erreurs robuste

---

## ⚠️ Points Importants

1. **`vendorId` obligatoire** : Identifie le vendeur créateur
2. **Flexibilité des items** : Avec ou sans `productId`
3. **Stock géré intelligemment** : Uniquement pour items avec `productId`
4. **Code existant préservé** : Aucune modification des modules ecommerce

---

## 📱 Intégration Flutter

```dart
final orderData = {
  'clientId': _selectedClient!['id'],
  'clientName': '${_selectedClient!['firstName']} ${_selectedClient!['lastName']}',
  'clientPhone': _selectedClient!['phone'],
  'vendorId': userId, // ID du vendeur connecté
  'packageValue': totalValue.toStringAsFixed(2),
  'packageDescription': packageDescription,
  'pickupAddress': pickupAddress,
  'deliveryAddress': deliveryAddress,
  'pickupReference': _pickupReferenceController.text.trim(),
  'deliveryReference': _deliveryReferenceController.text.trim(),
  'createdBy': userId,
  'statut': 'pending',
  'items': items.map((item) => {
    // Item avec productId (catalogue)
    if (item.containsKey('productId')) {  
      'productId': item['productId'],
      'name': item['name'],
      'price': item['price'],
      'quantity': item['quantity']
    }
    // Item sans productId (hors app)
    else {
      'name': item['name'],
      'description': item['description'],
      'quantity': item['quantity'],
      'weight': item['weight'],
      'price': item['price']
    }
  }).toList(),
};

final response = await http.post(
  Uri.parse('$baseUrl/commande-express/create'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json'
  },
  body: jsonEncode(orderData),
);
```

---

## 🎉 Résumé

**Le module Commande Express est maintenant COMPLÈTEMENT OPÉRATIONNEL !**

✅ Gestion flexible des items (avec/sans produits)  
✅ Gestion automatique du stock  
✅ Endpoints pour vendeurs, clients et livreurs  
✅ Code existant préservé (0 modification)  
✅ Production ready avec transactions atomiques  

**Prêt à être utilisé en production ! 🚀**
