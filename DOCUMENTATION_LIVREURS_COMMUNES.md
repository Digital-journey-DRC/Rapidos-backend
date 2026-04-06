# Documentation — Gestion des Livreurs & Assignation de Communes

> **Base URL** : `http://localhost:3333`  
> **Authentification** : Tous ces endpoints nécessitent un token **admin**  
> Header : `Authorization: Bearer <token_admin>`

---

## Table des matières

1. [Lister tous les livreurs](#1-lister-tous-les-livreurs)
2. [Détail d'un livreur](#2-détail-dun-livreur)
3. [Assigner des communes à un livreur](#3-assigner-des-communes-à-un-livreur)

---

## 1. Lister tous les livreurs

Retourne la liste de tous les livreurs avec leurs communes assignées.

```
GET /admin/livreurs
```

### Headers

| Clé             | Valeur                        |
|-----------------|-------------------------------|
| Authorization   | Bearer `<token_admin>`        |
| Content-Type    | application/json              |

### Exemple de requête

```bash
curl -s GET "http://localhost:3333/admin/livreurs" \
  -H "Authorization: Bearer <token_admin>"
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

| Champ        | Type       | Description                                              |
|--------------|------------|----------------------------------------------------------|
| `id`         | number     | Identifiant du livreur                                   |
| `firstName`  | string     | Prénom                                                   |
| `lastName`   | string     | Nom                                                      |
| `phone`      | string     | Numéro de téléphone                                      |
| `email`      | string     | Email                                                    |
| `statut`     | string     | `active` ou `inactive`                                   |
| `communes`   | string[]   | Communes assignées (tableau vide = aucune restriction)   |
| `nbCommunes` | number     | Nombre de communes assignées                             |

> **Note** : `communes: []` signifie que le livreur voit **toutes** les commandes sans restriction de zone.

---

## 2. Détail d'un livreur

Retourne le détail complet d'un livreur spécifique avec ses communes.

```
GET /admin/livreurs/:id
```

### Paramètres URL

| Paramètre | Type   | Description           |
|-----------|--------|-----------------------|
| `id`      | number | ID du livreur         |

### Exemple de requête

```bash
curl -s "http://localhost:3333/admin/livreurs/5" \
  -H "Authorization: Bearer <token_admin>"
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
    "communes": ["Gombe"],
    "nbCommunes": 1,
    "createdAt": "2025-12-29T06:46:30.177+01:00",
    "updatedAt": "2026-04-06T14:48:22.775+01:00"
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

Assigne une ou plusieurs communes à un livreur pour limiter les livraisons qu'il verra à sa zone.

```
PATCH /admin/livreurs/:id/communes
```

### Paramètres URL

| Paramètre | Type   | Description           |
|-----------|--------|-----------------------|
| `id`      | number | ID du livreur         |

### Body (JSON)

| Champ      | Type     | Obligatoire | Description                                         |
|------------|----------|-------------|-----------------------------------------------------|
| `communes` | string[] | Oui         | Tableau de noms de communes. `[]` pour tout enlever |

### Exemples de requêtes

**Assigner des communes :**
```bash
curl -s -X PATCH "http://localhost:3333/admin/livreurs/5/communes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_admin>" \
  -d '{"communes": ["Gombe", "Kalamu", "Lingwala"]}'
```

**Supprimer toutes les restrictions :**
```bash
curl -s -X PATCH "http://localhost:3333/admin/livreurs/5/communes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_admin>" \
  -d '{"communes": []}'
```

### Réponse succès — commandes assignées `200`

```json
{
  "success": true,
  "message": "3 commune(s) assignée(s) au livreur",
  "status": 200,
  "data": {
    "id": 5,
    "firstName": "Jean",
    "lastName": "Livreur",
    "phone": "+243888777666",
    "role": "livreur",
    "communes": ["Gombe", "Kalamu", "Lingwala"]
  }
}
```

### Réponse succès — restrictions supprimées `200`

```json
{
  "success": true,
  "message": "Restrictions supprimées : le livreur voit toutes les commandes",
  "status": 200,
  "data": {
    "id": 5,
    "firstName": "Jean",
    "lastName": "Livreur",
    "phone": "+243888777666",
    "role": "livreur",
    "communes": []
  }
}
```

### Réponse erreur `400` — utilisateur non livreur

```json
{
  "success": false,
  "message": "Cet utilisateur n'est pas un livreur",
  "status": 400
}
```

### Réponse erreur `400` — format invalide

```json
{
  "success": false,
  "message": "Le champ \"communes\" doit être un tableau (ex: [\"Gombe\", \"Kalamu\"])",
  "status": 400
}
```

---

## Comportement du filtrage

| Communes assignées      | Commandes visibles                                     |
|-------------------------|--------------------------------------------------------|
| `[]` (vide)             | **Toutes** les commandes disponibles (pas de filtre)   |
| `["Gombe"]`             | Uniquement les commandes avec `commune = "Gombe"`      |
| `["Gombe", "Kalamu"]`   | Commandes de Gombe **ou** Kalamu                       |

> Le filtrage s'applique sur les **3 modules** : ecommerce, express et commande-express.  
> Les commandes sans commune définie (`null`) sont toujours visibles, avec ou sans restriction.
