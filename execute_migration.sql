-- Migration manuelle : Ajout des colonnes GPS, livraison et payment_method_id
-- À exécuter directement dans votre client PostgreSQL

-- 1. Ajouter la colonne payment_method_id (si pas déjà fait)
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS payment_method_id INTEGER NULL;

-- Ajouter la contrainte seulement si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_ecommerce_orders_payment_method_id'
    ) THEN
        ALTER TABLE ecommerce_orders 
        ADD CONSTRAINT fk_ecommerce_orders_payment_method_id 
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Ajouter les colonnes GPS et livraison
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2) NULL;
ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NULL;

-- 3. Marquer les migrations comme complétées (seulement si elles n'existent pas déjà)
INSERT INTO adonis_schema (name, batch) 
SELECT '1766531000000_add_payment_method_id_to_ecommerce_orders', 11
WHERE NOT EXISTS (
    SELECT 1 FROM adonis_schema 
    WHERE name = '1766531000000_add_payment_method_id_to_ecommerce_orders'
);

INSERT INTO adonis_schema (name, batch) 
SELECT '1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table', 11
WHERE NOT EXISTS (
    SELECT 1 FROM adonis_schema 
    WHERE name = '1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table'
);

-- 4. Nettoyer les migrations corrompues
DELETE FROM adonis_schema WHERE name = '1745865839852_create_products_table';
DELETE FROM adonis_schema WHERE name = '1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table' AND batch = 11;

-- Vérification
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ecommerce_orders' 
  AND column_name IN ('latitude', 'longitude', 'distance_km', 'delivery_fee', 'payment_method_id');
