# Exécution de la migration pour créer la table promotions

## Option 1: Via l'endpoint (après redémarrage du serveur)

1. Redémarrer le serveur pour charger la nouvelle route
2. Appeler l'endpoint:
```bash
curl -X POST http://localhost:3333/migration/create-promotions-table \
  -H "Content-Type: application/json"
```

## Option 2: Exécuter le SQL directement

Connectez-vous à votre base de données PostgreSQL et exécutez:

```sql
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image VARCHAR(255) NOT NULL,
  image1 VARCHAR(255) NULL,
  image2 VARCHAR(255) NULL,
  image3 VARCHAR(255) NULL,
  image4 VARCHAR(255) NULL,
  libelle VARCHAR(255) NOT NULL,
  likes INTEGER DEFAULT 0,
  delai_promotion TIMESTAMP NOT NULL,
  nouveau_prix DECIMAL(10, 2) NOT NULL,
  ancien_prix DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Le fichier SQL est disponible dans: `create_promotions_table.sql`





