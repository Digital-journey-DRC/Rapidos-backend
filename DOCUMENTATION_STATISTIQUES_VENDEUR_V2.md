# Statistiques Vendeur — Documentation API

> **⚠️ IMPORTANT (v2 — 5 mars 2026)** : Cet endpoint ne retourne désormais que les **commandes livrées** (`statut = 'livre'` pour express, `status = 'delivered'` pour ecommerce). Les commandes en attente, en cours ou annulées ne sont plus incluses dans les statistiques.

## Endpoint principal

```
GET /statistiques/vendeur/global
Authorization: Bearer <token_vendeur>
```

Cet endpoint retourne les statistiques de vente du vendeur connecté basées **uniquement sur les commandes livrées** (express + ecommerce).

---

## Query Parameters

| Paramètre | Valeurs possibles | Défaut | Description |
|-----------|-------------------|--------|-------------|
| `filtre` | `journalier`, `mensuel`, `semestriel`, `annuel` | aucun (toutes les périodes) | Filtre temporel |
| `type` | `express`, `ecommerce`, `tous` | `tous` | Type de commandes |
| `limit` | `1` à `50` | `10` | Limite pour les classements (top produits / top clients) |

### Détails des filtres

| Filtre | Période couverte |
|--------|-----------------|
| `journalier` | Aujourd'hui (depuis minuit) |
| `mensuel` | Depuis le 1er du mois en cours |
| `semestriel` | Les 6 derniers mois |
| `annuel` | Depuis le 1er janvier de l'année en cours |

---

## Exemples d'appels curl

### Toutes les statistiques (sans filtre)
```bash
curl -s -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3333/statistiques/vendeur/global"
```

### Filtre journalier — Express seulement
```bash
curl -s -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3333/statistiques/vendeur/global?filtre=journalier&type=express"
```

### Filtre mensuel — Ecommerce seulement
```bash
curl -s -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3333/statistiques/vendeur/global?filtre=mensuel&type=ecommerce"
```

### Filtre annuel — Les deux types combinés
```bash
curl -s -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3333/statistiques/vendeur/global?filtre=annuel&type=tous"
```

### Filtre semestriel — Top 20 produits et clients
```bash
curl -s -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3333/statistiques/vendeur/global?filtre=semestriel&limit=20"
```

---

## Structure de la réponse

```jsonc
{
  "success": true,
  "filtre": "annuel",              // filtre appliqué ("tout" si aucun)
  "filtre_label": "Cette année",   // libellé lisible du filtre
  "type": "tous",                  // type de commandes retournées

  "data": {

    // ── 1. RÉSUMÉ (uniquement commandes livrées) ──
    "resume": {
      "express": {                          // présent si type=express ou tous
        "total_commandes_livrees": 5,
        "chiffre_affaires": "1250000.00"
      },
      "ecommerce": {                        // présent si type=ecommerce ou tous
        "total_commandes_livrees": 8,
        "chiffre_affaires": "3200000.00"
      },
      "combine": {                          // toujours présent
        "total_commandes_livrees": 13,
        "chiffre_affaires": 4450000
      }
    },

    // ── 2. TOTAL GÉNÉRAL ──
    "total_general": 4450000,
    "nombre_commandes": 13,

    // ── 3. COMMANDES DÉTAILLÉES (toutes livrées) ──
    "commandes": [
      {
        "id": 21,
        "order_id": "e1be4da6-24b3-4487-...",
        "type_commande": "express",         // ou "ecommerce"

        // ✅ Informations client
        "informations_client": {
          "client_id": 9,
          "nom": "Aviel Elykia",
          "telephone": "+243823439137",
          "email": "informyistore@gmail.com"
        },

        // ✅ Produits commandés
        "produits_commandes": [
          {
            "nom": "makengo",
            "description": "",              // express uniquement
            "quantite": 1,
            "prix_unitaire": 50000,
            "sous_total": 50000
          },
          {
            "nom": "Burger Double Cheese",
            "description": "",
            "quantite": 1,
            "prix_unitaire": 18000,
            "sous_total": 18000
          }
        ],

        // ✅ Quantité totale
        "quantite": 3,

        // ✅ Total partiel
        "total_partiel": 90000,

        "statut": "livre",                              // toujours "livre"
        "adresse_pickup": "23 Avenue Mobutu, ...",      // express
        "adresse_livraison": "24 du livre, ...",
        "date": "2026-03-02T19:19:25.911Z"
      },
      {
        "id": 35,
        "order_id": "ORD-...",
        "type_commande": "ecommerce",

        "informations_client": {
          "client_id": 7,
          "nom": "myinda@gmail.com",
          "telephone": "+243816644420",
          "email": "myinda@gmail.com"
        },

        "produits_commandes": [
          {
            "product_id": 22,               // ecommerce uniquement
            "nom": "makengo",
            "quantite": 1,
            "prix_unitaire": 50000,
            "sous_total": 50000
          }
        ],

        "quantite": 1,
        "total_partiel": 50000,
        "frais_livraison": 3830,            // ecommerce uniquement
        "moyen_paiement": "cash",           // ecommerce uniquement
        "statut": "delivered",              // toujours "delivered"
        "adresse_livraison": "Av. Du Dépôt, Gombe, Kinshasa",
        "date": "2026-01-12T20:24:43.044Z"
      }
    ],

    // ── 4. PRODUITS LES PLUS VENDUS (basé sur commandes livrées) ──
    "produits_les_plus_vendus": [
      {
        "rang": 1,
        "nom_produit": "Burger Double Cheese",
        "quantite_vendue": 15,
        "montant_total": 270000,
        "nombre_commandes": 12
      }
    ],

    // ── 5. CLIENTS LES PLUS FIDÈLES (basé sur commandes livrées) ──
    "clients_les_plus_commandes": [
      {
        "rang": 1,
        "client_id": 7,
        "nom": "myinda@gmail.com",
        "telephone": "+243816644420",
        "email": "myinda@gmail.com",
        "nombre_commandes": 22,
        "montant_total": 3356000,
        "derniere_commande": "2026-02-18T08:59:03.996Z",
        "potentiel_fidelisation": "élevé"   // élevé (≥5) | moyen (3-4) | faible (<3)
      }
    ]
  }
}
```

---

## Changements par rapport à la v1

| Aspect | Avant (v1) | Maintenant (v2) |
|--------|-----------|-----------------|
| Commandes considérées | Tous les statuts | **Uniquement livrées** |
| Résumé | `total_commandes`, `chiffre_affaires_total`, `chiffre_affaires_livre`, `en_attente`, `en_cours`, `livrees`, `annulees` | **`total_commandes_livrees`**, **`chiffre_affaires`** |
| Liste commandes | Toutes les commandes | **Uniquement les commandes livrées** |
| Top clients | Basé sur toutes les commandes | **Basé uniquement sur les commandes livrées** |
| Top produits | Déjà basé sur livrées | Inchangé |

---

## Récapitulatif des données retournées

### Résumé (`resume`)

| Champ | Description |
|-------|-------------|
| `total_commandes_livrees` | Nombre de commandes livrées |
| `chiffre_affaires` | Chiffre d'affaires des commandes livrées |

### Pour chaque commande (toutes livrées)

| Champ | Description |
|-------|-------------|
| `informations_client` | Nom, téléphone, email, client_id |
| `produits_commandes[]` | Nom du produit, quantité, prix unitaire, sous-total |
| `quantite` | Quantité totale de produits dans la commande |
| `total_partiel` | Montant total de la commande |
| `type_commande` | `express` ou `ecommerce` |
| `statut` | `livre` (express) ou `delivered` (ecommerce) |
| `date` | Date de création |

### Champs spécifiques Express

| Champ | Description |
|-------|-------------|
| `adresse_pickup` | Adresse d'enlèvement |
| `adresse_livraison` | Adresse de livraison |

### Champs spécifiques Ecommerce

| Champ | Description |
|-------|-------------|
| `product_id` | ID du produit (dans produits_commandes) |
| `frais_livraison` | Frais de livraison |
| `moyen_paiement` | Moyen de paiement utilisé |
| `adresse_livraison` | Adresse formatée |

---

## Potentiel de fidélisation

Le champ `potentiel_fidelisation` dans les top clients est calculé sur les **commandes livrées uniquement** :

| Valeur | Condition |
|--------|-----------|
| `élevé` | 5 commandes livrées ou plus |
| `moyen` | 3 à 4 commandes livrées |
| `faible` | Moins de 3 commandes livrées |

---

## Endpoints existants (toujours fonctionnels)

Ces endpoints ne sont pas modifiés et continuent de fonctionner :

| Endpoint | Description |
|----------|-------------|
| `GET /statistiques/vendeur/express` | Stats détaillées commandes express (tous statuts) |
| `GET /statistiques/vendeur/ecommerce` | Stats détaillées commandes ecommerce (tous statuts) |
| `GET /statistiques/vendeur/global` | **v2** — Stats combinées basées sur commandes livrées uniquement |
