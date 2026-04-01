# Prix des commandes — Guide Frontend

## EcommerceOrder (Commandes e-commerce)

```json
{
  "total": 850.00,
  "deliveryFee": 25.00,
  "totalAvecLivraison": 875.00
}
```

| Variable              | Type     | Description                                      |
|-----------------------|----------|--------------------------------------------------|
| `total`               | `number` | Prix du package (somme des produits)              |
| `deliveryFee`         | `number` | Prix de livraison                                 |
| `totalAvecLivraison`  | `number` | Prix total = `total` + `deliveryFee`              |

---

## CommandeExpress (Commandes express)

```json
{
  "packageValue": 750.50,
  "deliveryFee": null,
  "totalAvecLivraison": null
}
```

| Variable              | Type            | Description                                      |
|-----------------------|-----------------|--------------------------------------------------|
| `packageValue`        | `number`        | Prix du package                                   |
| `deliveryFee`         | `number \| null` | Prix de livraison (`null` si pas encore acceptée) |
| `totalAvecLivraison`  | `number \| null` | Prix total (`null` si pas encore acceptée)        |

> **Note :** Pour les commandes express, `deliveryFee` et `totalAvecLivraison` sont `null` tant qu'un livreur n'a pas accepté la commande.
