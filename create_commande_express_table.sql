-- Script SQL pour créer la table commande_express
CREATE TABLE IF NOT EXISTS commande_express (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL UNIQUE,
  client_id INTEGER NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  package_value DECIMAL(10, 2) NOT NULL,
  package_description TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_reference VARCHAR(255),
  delivery_reference VARCHAR(255),
  created_by INTEGER NOT NULL,
  statut VARCHAR(50) NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL,
  delivery_person_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_commande_express_order_id ON commande_express(order_id);
CREATE INDEX IF NOT EXISTS idx_commande_express_client_id ON commande_express(client_id);
CREATE INDEX IF NOT EXISTS idx_commande_express_statut ON commande_express(statut);
CREATE INDEX IF NOT EXISTS idx_commande_express_delivery_person_id ON commande_express(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_commande_express_created_by ON commande_express(created_by);
