# Documentation API - Statistiques Vendeur

## Authentification

Tous les endpoints nécessitent un token Bearer. Connectez-vous d'abord :

```bash
curl -X POST "http://localhost:3333/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243826016607", "password": "0826016607Makengo@"}'
```

Utilisez le `token` retourné dans le header `Authorization: Bearer <TOKEN>`.

---

## 1. Stats Commandes Express

**`GET /statistiques/vendeur/express`**

Retourne les statistiques des commandes express du vendeur connecté.

```bash
curl -X GET "http://localhost:3333/statistiques/vendeur/express" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response body :**

```json
{
  "success": true,
  "data": {
    "resume": {
      "total_commandes": 11,
      "chiffre_affaires_total": "3281550.00",
      "chiffre_affaires_livre": "0",
      "en_attente": 7,
      "en_cours": 4,
      "livrees": 0,
      "annulees": 0
    },
    "parStatut": [
      {
        "statut": "en_cours",
        "nombre": 4,
        "montant_total": "8350.00"
      },
      {
        "statut": "pending",
        "nombre": 7,
        "montant_total": "3273200.00"
      }
    ],
    "parJour": [
      {
        "date": "2026-02-27T23:00:00.000Z",
        "nombre": 11,
        "montant_total": "3281550.00"
      }
    ],
    "parMois": [
      {
        "mois": "2026-02",
        "nombre": 11,
        "montant_total": "3281550.00",
        "livrees": 0
      }
    ],
    "topClients": [
      {
        "client_name": "Aviel Elykia",
        "client_phone": "+243823439137",
        "nombre_commandes": 3,
        "montant_total": "2015000.00"
      }
    ]
  }
}
```

---

## 2. Stats Commandes Ecommerce (normales)

**`GET /statistiques/vendeur/ecommerce`**

Retourne les statistiques des commandes ecommerce du vendeur connecté.

```bash
curl -X GET "http://localhost:3333/statistiques/vendeur/ecommerce" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response body :**

```json
{
  "success": true,
  "data": {
    "resume": {
      "total_commandes": 33,
      "chiffre_affaires_total": "8358000.00",
      "chiffre_affaires_livre": "0",
      "en_attente": 27,
      "en_attente_paiement": 1,
      "en_preparation": 0,
      "pret_a_expedier": 0,
      "accepte_livreur": 1,
      "en_route": 0,
      "livrees": 0,
      "annulees": 4,
      "rejetees": 0
    },
    "parStatut": [
      {
        "status": "accepte_livreur",
        "nombre": 1,
        "montant_total": "50000.00"
      },
      {
        "status": "cancelled",
        "nombre": 4,
        "montant_total": "200000.00"
      },
      {
        "status": "pending",
        "nombre": 27,
        "montant_total": "8058000.00"
      }
    ],
    "parJour": [
      {
        "date": "2026-02-17T23:00:00.000Z",
        "nombre": 2,
        "montant_total": "100000.00"
      }
    ],
    "parMois": [
      {
        "mois": "2026-02",
        "nombre": 11,
        "montant_total": "649000.00",
        "livrees": 0
      },
      {
        "mois": "2026-01",
        "nombre": 22,
        "montant_total": "7709000.00",
        "livrees": 0
      }
    ],
    "topProduits": [
      {
        "produit": "iPhone 15 Pro Max",
        "quantite_vendue": 5,
        "montant_total": "9250000.00"
      }
    ]
  }
}
```

---

## 3. Stats Globales (Express + Ecommerce combinés)

**`GET /statistiques/vendeur/global`**

Retourne un résumé combiné des deux types de commandes.

```bash
curl -X GET "http://localhost:3333/statistiques/vendeur/global" \
  -H "Authorization: Bearer <TOKEN>"
```

**Response body :**

```json
{
  "success": true,
  "data": {
    "express": {
      "total_commandes": 11,
      "chiffre_affaires_total": "3281550.00",
      "chiffre_affaires_livre": "0",
      "en_attente": 7,
      "en_cours": 4,
      "livrees": 0,
      "annulees": 0
    },
    "ecommerce": {
      "total_commandes": 33,
      "chiffre_affaires_total": "8358000.00",
      "chiffre_affaires_livre": "0",
      "en_attente": 28,
      "en_cours": 1,
      "livrees": 0,
      "annulees": 4
    },
    "combine": {
      "total_commandes": 44,
      "chiffre_affaires_total": 11639550,
      "chiffre_affaires_livre": 0,
      "en_attente": 35,
      "en_cours": 5,
      "livrees": 0,
      "annulees": 4
    }
  }
}
```

---

## Récapitulatif des champs

| Champ | Description |
|-------|-------------|
| `total_commandes` | Nombre total de commandes du vendeur |
| `chiffre_affaires_total` | Somme de toutes les commandes (en FC) |
| `chiffre_affaires_livre` | Somme uniquement des commandes livrées |
| `en_attente` | Commandes en attente (pending) |
| `en_cours` | Commandes en cours de traitement/livraison |
| `livrees` | Commandes livrées avec succès |
| `annulees` | Commandes annulées |
| `parStatut` | Détail nombre + montant par statut |
| `parJour` | Historique des 30 derniers jours |
| `parMois` | Historique des 12 derniers mois |
| `topClients` | Top 10 clients (express uniquement) |
| `topProduits` | Top 10 produits vendus (ecommerce, livrés uniquement) |
