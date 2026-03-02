# 📊 Statistiques Livreur - API Documentation

## Endpoint

```
GET /statistiques/livreur/global
```

**Authentification requise** : Bearer Token (livreur connecté)

---

## Query Parameters

| Paramètre | Valeurs possibles | Défaut | Description |
|-----------|------------------|--------|-------------|
| `filtre` | `journalier`, `mensuel`, `semestriel`, `annuel` | `tout` | Période de filtrage |
| `type` | `express`, `ecommerce`, `tous` | `tous` | Type de commandes |
| `limit` | `1` à `50` | `10` | Nombre max de top produits/clients |

---

## Exemples d'appel

```bash
# Toutes les livraisons (sans filtre)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3333/statistiques/livreur/global"

# Livraisons du jour - express uniquement
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3333/statistiques/livreur/global?filtre=journalier&type=express"

# Livraisons de l'année - ecommerce uniquement, top 5
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3333/statistiques/livreur/global?filtre=annuel&type=ecommerce&limit=5"

# Livraisons du mois
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3333/statistiques/livreur/global?filtre=mensuel"

# Livraisons des 6 derniers mois
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3333/statistiques/livreur/global?filtre=semestriel"
```

---

## Structure de la réponse

```json
{
  "success": true,
  "filtre": "annuel",
  "filtre_label": "Cette année",
  "type": "tous",
  "data": {
    "resume": {
      "express": {
        "total_livraisons": 8,
        "montant_total": "100850.00",
        "en_cours": 4,
        "livrees": 4,
        "annulees": 0
      },
      "ecommerce": {
        "total_livraisons": 10,
        "montant_total": "76000.00",
        "acceptees": 5,
        "en_route": 2,
        "livrees": 3,
        "annulees": 0
      },
      "combine": {
        "total_livraisons": 18,
        "montant_total": 176850,
        "en_cours": 11,
        "livrees": 7,
        "annulees": 0
      }
    },
    "total_general": 176850,
    "nombre_livraisons": 18,
    "livraisons": [
      {
        "id": 16,
        "order_id": "44c45086-...",
        "type_commande": "express",
        "informations_client": {
          "client_id": 8,
          "nom": "Benedecite Mathunabo",
          "telephone": "+243999999999",
          "email": "informyi@gmail.com"
        },
        "informations_vendeur": {
          "nom": "Informyi Store",
          "telephone": "+243990890450"
        },
        "produits_commandes": [
          {
            "nom": "castel",
            "description": "",
            "quantite": 3,
            "prix_unitaire": 500,
            "sous_total": 1500
          }
        ],
        "quantite": 6,
        "total_partiel": 46500,
        "statut": "en_cours",
        "adresse_pickup": "...",
        "adresse_livraison": "...",
        "date": "2026-02-28T15:03:19.201Z"
      }
    ],
    "produits_les_plus_livres": [
      {
        "rang": 1,
        "nom_produit": "fanta",
        "quantite_livree": 7,
        "montant_total": 3500,
        "nombre_livraisons": 2
      }
    ],
    "clients_les_plus_livres": [
      {
        "rang": 1,
        "client_id": 7,
        "nom": "Victoire MYINDA",
        "telephone": "+243816644420",
        "email": "myinda@gmail.com",
        "nombre_livraisons": 9,
        "montant_total": 63000,
        "derniere_livraison": "2026-02-27T19:53:13.698Z",
        "frequence": "régulier"
      }
    ]
  }
}
```

---

## Détail des champs

### Resume Express
| Champ | Description |
|-------|-------------|
| `total_livraisons` | Nombre total de commandes express assignées |
| `montant_total` | Montant total des commandes express |
| `en_cours` | Livraisons en cours (statut `en_cours`) |
| `livrees` | Livraisons terminées (statut `livre`) |
| `annulees` | Livraisons annulées |

### Resume Ecommerce
| Champ | Description |
|-------|-------------|
| `total_livraisons` | Nombre total de commandes ecommerce assignées |
| `montant_total` | Montant total des commandes |
| `acceptees` | Commandes acceptées par le livreur |
| `en_route` | Commandes en cours de livraison |
| `livrees` | Commandes livrées (statut `delivered`) |
| `annulees` | Commandes annulées/rejetées |

### Livraison détaillée
| Champ | Description |
|-------|-------------|
| `type_commande` | `express` ou `ecommerce` |
| `informations_client` | Nom, téléphone, email du client |
| `informations_vendeur` | Nom et téléphone du vendeur |
| `produits_commandes` | Liste des produits (nom, quantité, prix, sous-total) |
| `quantite` | Quantité totale de produits |
| `total_partiel` | Montant de la commande |
| `statut` | Statut actuel de la commande |

### Fréquence client (fidélisation)
| Valeur | Condition |
|--------|-----------|
| `régulier` | ≥ 5 livraisons |
| `occasionnel` | 3-4 livraisons |
| `nouveau` | < 3 livraisons |

---

## Filtres temporels

| Filtre | Label | Période |
|--------|-------|---------|
| _(vide)_ | Toutes les périodes | Toutes les données |
| `journalier` | Aujourd'hui | Depuis minuit |
| `mensuel` | Ce mois | Depuis le 1er du mois |
| `semestriel` | Les 6 derniers mois | 6 mois glissants |
| `annuel` | Cette année | Depuis le 1er janvier |

---

## Différences avec les statistiques vendeur

| Aspect | Vendeur (`/statistiques/vendeur/global`) | Livreur (`/statistiques/livreur/global`) |
|--------|------------------------------------------|------------------------------------------|
| Filtre par | `vendor_id` | `delivery_person_id` |
| Champ clé | `chiffre_affaires` | `montant_total` |
| Fidélisation | `potentiel_fidelisation` (élevé/moyen/faible) | `frequence` (régulier/occasionnel/nouveau) |
| Info vendeur | ❌ (c'est le vendeur lui-même) | ✅ Nom et téléphone du vendeur |
| Résumé ecom | en_attente, en_cours | acceptees, en_route |
