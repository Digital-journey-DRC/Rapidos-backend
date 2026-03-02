# Statistiques Vendeur — Documentation API

## Endpoint principal

```
GET /statistiques/vendeur/global
Authorization: Bearer <token_vendeur>
```

Cet endpoint retourne les statistiques de vente complètes du vendeur connecté (commandes express + ecommerce).

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

    // ── 1. RÉSUMÉ ──
    "resume": {
      "express": {                          // présent si type=express ou tous
        "total_commandes": 12,
        "chiffre_affaires_total": "3371550.00",
        "chiffre_affaires_livre": "0",
        "en_attente": 8,
        "en_cours": 4,
        "livrees": 0,
        "annulees": 0
      },
      "ecommerce": {                        // présent si type=ecommerce ou tous
        "total_commandes": 33,
        "chiffre_affaires_total": "8358000.00",
        "chiffre_affaires_livre": "0",
        "en_attente": 28,
        "en_cours": 1,
        "livrees": 0,
        "annulees": 4
      },
      "combine": {                          // toujours présent
        "total_commandes": 45,
        "chiffre_affaires_total": 11729550,
        "chiffre_affaires_livre": 0,
        "en_attente": 36,
        "en_cours": 5,
        "livrees": 0,
        "annulees": 4
      }
    },

    // ── 2. TOTAL GÉNÉRAL ──
    "total_general": 11729550,
    "nombre_commandes": 45,

    // ── 3. COMMANDES DÉTAILLÉES ──
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

        "statut": "pending",
        "adresse_pickup": "23 Avenue Mobutu, ...",    // express
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
        "statut": "pending",
        "adresse_livraison": "Av. Du Dépôt, Gombe, Kinshasa",
        "date": "2026-01-12T20:24:43.044Z"
      }
    ],

    // ── 4. PRODUITS LES PLUS VENDUS ──
    "produits_les_plus_vendus": [
      {
        "rang": 1,
        "nom_produit": "Burger Double Cheese",
        "quantite_vendue": 15,
        "montant_total": 270000,
        "nombre_commandes": 12
      }
    ],

    // ── 5. CLIENTS LES PLUS COMMANDÉS (fidélisation) ──
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

## Récapitulatif des données retournées

### Pour chaque commande

| Champ | Description |
|-------|-------------|
| `informations_client` | Nom, téléphone, email, client_id |
| `produits_commandes[]` | Nom du produit, quantité, prix unitaire, sous-total |
| `quantite` | Quantité totale de produits dans la commande |
| `total_partiel` | Montant total de la commande |
| `type_commande` | `express` ou `ecommerce` |
| `statut` | Statut actuel de la commande |
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

Le champ `potentiel_fidelisation` dans les top clients est calculé ainsi :

| Valeur | Condition |
|--------|-----------|
| `élevé` | 5 commandes ou plus |
| `moyen` | 3 à 4 commandes |
| `faible` | Moins de 3 commandes |

---

## Endpoints existants (toujours fonctionnels)

Ces endpoints ne sont pas modifiés et continuent de fonctionner :

| Endpoint | Description |
|----------|-------------|
| `GET /statistiques/vendeur/express` | Stats détaillées commandes express |
| `GET /statistiques/vendeur/ecommerce` | Stats détaillées commandes ecommerce |
| `GET /statistiques/vendeur/global` | **Amélioré** — Stats combinées avec filtres |
