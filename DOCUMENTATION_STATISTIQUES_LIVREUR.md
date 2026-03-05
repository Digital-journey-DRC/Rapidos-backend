# 📊 Statistiques Livreur - API Documentation

> **⚠️ IMPORTANT (v2 — 5 mars 2026)** : Cet endpoint ne retourne désormais que les **livraisons effectuées** (`statut = 'livre'` pour express, `status = 'delivered'` pour ecommerce). Les livraisons en cours, acceptées ou annulées ne sont plus incluses.

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
# Toutes les livraisons effectuées (sans filtre)
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
        "total_livraisons_effectuees": 4,
        "montant_total": "80000.00"
      },
      "ecommerce": {
        "total_livraisons_effectuees": 3,
        "montant_total": "45000.00"
      },
      "combine": {
        "total_livraisons_effectuees": 7,
        "montant_total": 125000
      }
    },
    "total_general": 125000,
    "nombre_livraisons": 7,
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
        "statut": "livre",
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

## Changements par rapport à la v1

| Aspect | Avant (v1) | Maintenant (v2) |
|--------|-----------|-----------------|
| Livraisons considérées | Tous les statuts | **Uniquement livrées** |
| Résumé Express | `total_livraisons`, `montant_total`, `en_cours`, `livrees`, `annulees` | **`total_livraisons_effectuees`**, **`montant_total`** |
| Résumé Ecommerce | `total_livraisons`, `montant_total`, `acceptees`, `en_route`, `livrees`, `annulees` | **`total_livraisons_effectuees`**, **`montant_total`** |
| Résumé Combiné | `total_livraisons`, `montant_total`, `en_cours`, `livrees`, `annulees` | **`total_livraisons_effectuees`**, **`montant_total`** |
| Liste livraisons | Toutes | **Uniquement les livrées** |
| Top clients | Basé sur toutes les livraisons | **Basé uniquement sur les livrées** |
| Top produits | Déjà basé sur livrées | Inchangé |

---

## Détail des champs

### Resume (`resume.express` / `resume.ecommerce` / `resume.combine`)

| Champ | Description |
|-------|-------------|
| `total_livraisons_effectuees` | Nombre de livraisons effectuées (livrées) |
| `montant_total` | Montant total des livraisons effectuées |

### Livraison détaillée (toutes livrées)

| Champ | Description |
|-------|-------------|
| `type_commande` | `express` ou `ecommerce` |
| `informations_client` | Nom, téléphone, email du client |
| `informations_vendeur` | Nom et téléphone du vendeur |
| `produits_commandes` | Liste des produits (nom, quantité, prix, sous-total) |
| `quantite` | Quantité totale de produits |
| `total_partiel` | Montant de la commande |
| `statut` | `livre` (express) ou `delivered` (ecommerce) |

### Fréquence client (fidélisation — basée sur livraisons effectuées)

| Valeur | Condition |
|--------|-----------|
| `régulier` | ≥ 5 livraisons effectuées |
| `occasionnel` | 3-4 livraisons effectuées |
| `nouveau` | < 3 livraisons effectuées |

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
| Champ résumé | `total_commandes_livrees`, `chiffre_affaires` | `total_livraisons_effectuees`, `montant_total` |
| Fidélisation | `potentiel_fidelisation` (élevé/moyen/faible) | `frequence` (régulier/occasionnel/nouveau) |
| Info vendeur | ❌ (c'est le vendeur lui-même) | ✅ Nom et téléphone du vendeur |
| Données | Uniquement commandes livrées | Uniquement livraisons effectuées |
