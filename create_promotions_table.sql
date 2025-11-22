-- Script SQL pour créer la table promotions

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


