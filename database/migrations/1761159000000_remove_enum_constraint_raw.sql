-- Supprimer la contrainte d'enum et changer en string
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_check;
ALTER TABLE categories ALTER COLUMN name TYPE VARCHAR(255);
