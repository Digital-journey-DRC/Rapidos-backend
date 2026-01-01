# 📦 Documentation Workflow Livreur - De `pret_a_expedier` à `delivered`

## 🎯 Vue d'ensemble

Ce document décrit le workflow complet pour un livreur, de la récupération d'une commande prête à être expédiée jusqu'à sa livraison finale.

## 📊 États de la commande

```
pret_a_expedier → accepte_livreur → en_route → delivered
```

## 🔄 Workflow étape par étape

### **ÉTAPE 1 : Voir les livraisons disponibles**

**Endpoint :** `GET /ecommerce/livraison/disponibles`

**Description :** Récupère uniquement les commandes avec le statut `pret_a_expedier` et non assignées.

**Requête :**
```bash
curl -X GET http://localhost:3333/ecommerce/livraison/disponibles \
  -H "Authorization: Bearer TOKEN_LIVREUR"
```

**Réponse :**
```json
{
  "success": true,
  "message": "Livraisons disponibles récupérées avec succès",
  "livraisons": [
    {
      "orderId": "3dbc04d9-51f8-45f8-a9b7-ca010285cdd7",
      "status": "pret_a_expedier",
      "client": "myinda@gmail.com",
      "total": "944000.00",
      "packagePhoto": "https://...",
      "codeColis": "4105",
      "deliveryPersonId": null,
      "address": {...},
      "items": [...]
    }
  ]
}
```

---

### **ÉTAPE 2 : Accepter la livraison**

**Endpoint :** `POST /ecommerce/livraison/:orderId/take`

**Description :** Le livreur accepte une livraison. Change automatiquement le statut de `pret_a_expedier` à `accepte_livreur` et assigne le livreur.

**Requête :**
```bash
curl -X POST http://localhost:3333/ecommerce/livraison/{orderId}/take \
  -H "Authorization: Bearer TOKEN_LIVREUR"
```

**Body :** Aucun

**Réponse :**
```json
{
  "success": true,
  "message": "Livraison prise en charge avec succès",
  "order": {
    "orderId": "3dbc04d9-51f8-45f8-a9b7-ca010285cdd7",
    "status": "accepte_livreur",
    "deliveryPersonId": 5,
    ...
  }
}
```

**Conditions :**
- ✅ Utilisateur doit être un livreur
- ✅ Commande doit être en statut `pret_a_expedier`
- ✅ Commande ne doit pas être déjà assignée

---

### **ÉTAPE 3 : Récupérer le colis (Marquer en route)**

**Endpoint :** `PATCH /ecommerce/commandes/:orderId/status`

**Description :** Le livreur récupère le colis chez le vendeur en validant le code colis. Le statut passe de `accepte_livreur` à `en_route`. Un **nouveau code** est généré automatiquement pour la confirmation de livraison.

**Requête :**
```bash
curl -X PATCH http://localhost:3333/ecommerce/commandes/{orderId}/status \
  -H "Authorization: Bearer TOKEN_LIVREUR" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "en_route",
    "codeColis": "4105"
  }'
```

**Body :**
```json
{
  "status": "en_route",
  "codeColis": "4105"  // Code fourni par le vendeur
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Statut mis à jour de \"accepte_livreur\" vers \"en_route\". Nouveau code de confirmation généré : 7391",
  "newCodeColis": "7391",
  "order": {
    "orderId": "3dbc04d9-51f8-45f8-a9b7-ca010285cdd7",
    "status": "en_route",
    "codeColis": "7391",  // Nouveau code généré
    ...
  }
}
```

**Conditions :**
- ✅ Commande doit être en statut `accepte_livreur`
- ✅ Le livreur doit être assigné à cette commande
- ✅ Le code colis fourni doit correspondre au code du vendeur
- ✅ Un nouveau code est généré automatiquement pour la livraison

---

### **ÉTAPE 4 : Livrer la commande**

**Endpoint :** `PATCH /ecommerce/commandes/:orderId/status`

**Description :** Le livreur livre la commande au client en validant le nouveau code généré. Le statut passe de `en_route` à `delivered`.

**Requête :**
```bash
curl -X PATCH http://localhost:3333/ecommerce/commandes/{orderId}/status \
  -H "Authorization: Bearer TOKEN_LIVREUR" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "codeColis": "7391"
  }'
```

**Body :**
```json
{
  "status": "delivered",
  "codeColis": "7391"  // Nouveau code généré à l'étape précédente
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Statut mis à jour de \"en_route\" vers \"delivered\"",
  "order": {
    "orderId": "3dbc04d9-51f8-45f8-a9b7-ca010285cdd7",
    "status": "delivered",
    ...
  }
}
```

**Conditions :**
- ✅ Commande doit être en statut `en_route`
- ✅ Le livreur doit être assigné à cette commande
- ✅ Le code de confirmation doit correspondre au nouveau code généré

---

## 🔐 Codes utilisés

### **Code 1 (Code du vendeur)**
- Généré par le vendeur lors de l'upload de la photo du colis
- Utilisé par le livreur pour valider la récupération du colis
- Visible dans la commande en statut `pret_a_expedier`

### **Code 2 (Code de livraison)**
- Généré automatiquement quand le livreur passe à `en_route`
- Utilisé par le livreur pour valider la livraison au client
- Retourné dans la réponse de l'endpoint `PATCH /status` avec `en_route`

---

## 📝 Résumé des transitions

| De | Vers | Endpoint | Code requis | Génère nouveau code |
|---|---|---|---|---|
| `pret_a_expedier` | `accepte_livreur` | `POST /ecommerce/livraison/:orderId/take` | ❌ | ❌ |
| `accepte_livreur` | `en_route` | `PATCH /ecommerce/commandes/:orderId/status` | ✅ Code 1 (vendeur) | ✅ Code 2 |
| `en_route` | `delivered` | `PATCH /ecommerce/commandes/:orderId/status` | ✅ Code 2 (livraison) | ❌ |

---

## 🧪 Exemple de workflow complet

```bash
# 1. Voir les livraisons disponibles
curl -X GET http://localhost:3333/ecommerce/livraison/disponibles \
  -H "Authorization: Bearer TOKEN_LIVREUR"

# 2. Accepter une livraison
curl -X POST http://localhost:3333/ecommerce/livraison/3dbc04d9-51f8-45f8-a9b7-ca010285cdd7/take \
  -H "Authorization: Bearer TOKEN_LIVREUR"

# 3. Récupérer le colis (valide code vendeur, génère code livraison)
curl -X PATCH http://localhost:3333/ecommerce/commandes/3dbc04d9-51f8-45f8-a9b7-ca010285cdd7/status \
  -H "Authorization: Bearer TOKEN_LIVREUR" \
  -H "Content-Type: application/json" \
  -d '{"status": "en_route", "codeColis": "4105"}'

# 4. Livrer la commande (valide code livraison)
curl -X PATCH http://localhost:3333/ecommerce/commandes/3dbc04d9-51f8-45f8-a9b7-ca010285cdd7/status \
  -H "Authorization: Bearer TOKEN_LIVREUR" \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered", "codeColis": "7391"}'
```

---

## ⚠️ Notes importantes

1. **Authentification :** Tous les endpoints nécessitent un token Bearer valide
2. **Rôle :** L'utilisateur doit avoir le rôle `livreur` pour ces endpoints
3. **Codes :** Les codes sont à 4 chiffres (0000-9999)
4. **Ordre :** Les transitions doivent suivre l'ordre défini
5. **Assignation :** Une commande ne peut être assignée qu'à un seul livreur à la fois


