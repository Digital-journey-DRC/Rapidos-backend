-- Migration manuelle : Ajouter colonnes GPS et livraison
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2) NULL;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NULL;

-- Insérer l'entrée dans adonis_schema pour marquer la migration comme complétée
INSERT INTO adonis_schema (name, batch) VALUES ('1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table', 11)
ON CONFLICT (name) DO NOTHING;
