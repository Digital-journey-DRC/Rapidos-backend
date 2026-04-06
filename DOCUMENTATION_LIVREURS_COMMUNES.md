# Documentation — Gestion des Livreurs & Assignation de Communes

> **Base URL (production)** : `http://24.144.87.127:3333`
> **Authentification** : Tous ces endpoints nécessitent un token **admin**
> Header : `Authorization: Bearer <token_admin>`

---

## Table des matières

1. [Authentification admin](#0-authentification-admin)
2. [Lister tous les livreurs](#1-lister-tous-les-livreurs)
3. [Détail d'un livreur](#2-détail-dun-livreur)
4. [Assigner des communes à un livreur](#3-assigner-des-communes-à-un-livreur)
5. [Comportement du filtrage](#4-comportement-du-filtrage)
6. [Codes d'erreur](#5-codes-derreur)

---

## 0. Authentification admin

Avant tout appel aux endpoints admin, il faut obtenir un token.

```
POST /login
```

### Body

```json
{
  "uid": "+243900000000",
  "password": "Admin@123456"
}
```

> **Important** : utiliser le champ `uid` (et non `phone` ou `email`)

### Exemple de requête

```bash
curl -s -X POST "http://24.144.87.127:3333/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243900000000", "password": "Admin@123456"}'
```

### Réponse succès `200`

```json
{
  "token": {
    "token": "oat_MTUyOA.xxxxxxxxxxxxxxxxxxxx"
  }
}
```

Récupérer le token pour tous les appels suivants :

```bash
TOKEN=$(curl -s -X POST "http://24.144.87.127:3333/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243900000000", "password": "Admin@123456"}' | jq -r '.token.token')
```

---

## 1. Lister tous les livreurs

Retourne la liste de tous les livreurs avec leurs communes assignées.

```
GET /admin/livreurs
```

### Headers

| Clé           | Valeur                 |
|---------------|------------------------|
| Authorization | Bearer `<token_admin>` |

### Exemple de requête

```bash
curl -s "http://24.144.87.127:3333/admin/livreurs" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Réponse succès `200`

```json
{
  "success": true,
  "message": "2 livreur(s) trouvé(s)",
  "status": 200,
  "data": [
    {
      "id": 5,
      "firstName": "Jean",
      "lastName": "Livreur",
      "phone": "+243888777666",
      "email": "livreur@test.com",
      "statut": "active",
      "communes": ["Gombe", "Kalamu"],
      "nbCommunes": 2
    },
    {
      "id": 8,
      "firstName": "Paul",
      "lastName": "Muamba",
      "phone": "+243812345678",
      "email": "paul@test.com",
      "statut": "active",
      "communes": [],
      "nbCommunes": 0
    }
  ]
}
```

### Champs de réponse

| Champ        | Type     | Description                                    |
|--------------|----------|------------------------------------------------|
| `id`         | number   | Identifiant unique du livreur                  |
| `firstName`  | string   | Prénom                                         |
| `lastName`   | string   | Nom                                            |
| `phone`      | string   | Numéro de téléphone                            |
| `email`      | string   | Email                                          |
| `statut`     | string   | `active` ou `inactive`                         |
| `communes`   | string[] | Communes assignées (`[]` = aucune restriction) |
| `nbCommunes` | number   | Nombre de communes assignées                   |

> `communes: []` signifie que le livreur voit **toutes** les commandes sans restriction de zone.

---

## 2. Détail d'un livreur

Retourne le détail complet d'un livreur spécifique avec ses communes.

```
GET /admin/livreurs/:id
```

### Paramètres URL

| Paramètre | Type   | Description   |
|-----------|--------|---------------|
| `id`      | number | ID du livreur |

### Exemple de requête

```bash
curl -s "http://24.144.87.127:3333/admin/livreurs/5" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Réponse succès `200`

```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 5,
    "firstName": "Jean",
    "lastName": "Livreur",
    "phone": "+243888777666",
    "email": "livreur@test.com",
    "statut": "active",
    "latitude": null,
    "longitude": null,
    "communes": ["Gombe", "Kalamu"],
    "nbCommunes": 2,
    "createdAt": "2025-12-29T06:46:30.177+00:00",
    "updatedAt": "2026-04-06T18:05:52.745+00:00"
  }
}
```

### Réponse erreur `404`

```json
{
  "success": false,
  "message": "Livreur non trouvé",
  "status": 404
}
```

---

## 3. Assigner des communes à un livreur

Assigne une liste de communes à un livreur. Cette liste **remplace entièrement** les communes existantes.
Envoyer `[]` supprime toutes les restrictions (le livreur voit toutes les commandes).

```
PATCH /admin/livreurs/:id/communes
```

### Paramètres URL

| Paramètre | Type   | Description   |
|-----------|--------|---------------|
| `id`      | number | ID du livreur |

### Headers

| Clé           | Valeur                 |
|---------------|------------------------|
| Authorization | Bearer `<token_admin>` |
| Content-Type  | application/json       |

### Body (JSON)

| Champ      | Type     | Obligatoire | Description                                         |
|------------|----------|-------------|-----------------------------------------------------|
| `communes` | string[] | Oui         | Tableau de noms de communes. `[]` pour tout enlever |

> Les communes sont automatiquement déduplicées et les espaces superflus supprimés côté serveur.

---

### Cas 1 — Assigner des communes

```bash
curl -s -X PATCH "http://24.144.87.127:3333/admin/livreurs/5/communes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"communes": ["Gombe", "Kalamu", "Lingwala"]}' | jq .
```

#### Réponse `200`

```json
{
  "success": true,
  "message": "3 commune(s) assignée(s) au livreur",
  "status": 200,
  "data": {
    "id": 5,
    "firstName": "Jean",
    "lastName": "Livreur",
    "email": "livreur@test.com",
    "phone": "+243888777666",
    "role": "livreur",
    "statut": "active",
    "communes": ["Gombe", "Kalamu", "Lingwala"],
    "nbCommunes": 3,
    "updatedAt": "2026-04-06T18:05:52.745+00:00"
  }
}
```

---

### Cas 2 — Supprimer toutes les restrictions

```bash
curl -s -X PATCH "http://24.144.87.127:3333/admin/livreurs/5/communes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"communes": []}' | jq .
```

#### Réponse `200`

```json
{
  "success": true,
  "message": "Restrictions supprimées : le livreur voit toutes les commandes",
  "status": 200,
  "data": {
    "id": 5,
    "firstName": "Jean",
    "lastName": "Livreur",
    "email": "livreur@test.com",
    "phone": "+243888777666",
    "role": "livreur",
    "statut": "active",
    "communes": [],
    "nbCommunes": 0,
    "updatedAt": "2026-04-06T18:07:34.568+00:00"
  }
}
```

---

### Champs de réponse (data)

| Champ        | Type     | Description                                         |
|--------------|----------|-----------------------------------------------------|
| `id`         | number   | Identifiant du livreur                              |
| `firstName`  | string   | Prénom                                              |
| `lastName`   | string   | Nom                                                 |
| `email`      | string   | Email                                               |
| `phone`      | string   | Numéro de téléphone                                 |
| `role`       | string   | Toujours `"livreur"`                                |
| `statut`     | string   | `"active"` ou `"inactive"`                          |
| `communes`   | string[] | Communes enregistrées après l'opération             |
| `nbCommunes` | number   | Nombre de communes (màj front sans GET additionnel) |
| `updatedAt`  | string   | Timestamp ISO de la dernière modification           |

> **Note front** : La réponse contient toutes les données nécessaires pour mettre à jour
> le state côté client sans faire un GET supplémentaire.

---

### Erreurs possibles du PATCH

#### `400` — Body invalide (pas un tableau)

```bash
curl -s -X PATCH "http://24.144.87.127:3333/admin/livreurs/5/communes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"communes": "Gombe"}' | jq .
```

```json
{
  "success": false,
  "message": "Le champ \"communes\" doit être un tableau (ex: [\"Gombe\", \"Kalamu\"])",
  "status": 400
}
```

#### `400` — Utilisateur non livreur

```json
{
  "success": false,
  "message": "Cet utilisateur n'est pas un livreur",
  "status": 400
}
```

#### `403` — Non admin

```json
{
  "success": false,
  "message": "Seuls les administrateurs peuvent assigner des communes",
  "status": 403
}
```

#### `404` — Livreur introuvable

```bash
curl -s -X PATCH "http://24.144.87.127:3333/admin/livreurs/9999/communes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"communes": ["Gombe"]}' | jq .
```

```json
{
  "success": false,
  "message": "Utilisateur non trouvé",
  "status": 404
}
```

#### `500` — Erreur serveur

```json
{
  "success": false,
  "message": "Erreur interne du serveur",
  "status": 500,
  "error": "<message d'erreur technique détaillé>"
}
```

> Le champ `error` contient le message exact de l'exception (utile pour déboguer une erreur DB).

---

## 4. Comportement du filtrage

| Communes assignées    | Commandes visibles                                   |
|-----------------------|------------------------------------------------------|
| `[]` (vide)           | **Toutes** les commandes disponibles (pas de filtre) |
| `["Gombe"]`           | Uniquement les commandes avec `commune = "Gombe"`    |
| `["Gombe", "Kalamu"]` | Commandes de Gombe **ou** Kalamu                     |

> Le filtrage s'applique sur les **3 modules** : ecommerce, express et commande-express.
> Les commandes sans commune définie (`null`) sont toujours visibles, avec ou sans restriction.

---

## 5. Codes d'erreur

| Code  | Cause                                      |
|-------|--------------------------------------------|
| `400` | `communes` n'est pas un tableau            |
| `400` | L'utilisateur ciblé n'est pas un livreur   |
| `401` | Token manquant ou expiré                   |
| `403` | L'utilisateur authentifié n'est pas admin  |
| `404` | ID introuvable dans la base de données     |
| `500` | Erreur serveur (DB indisponible, etc.)     |
