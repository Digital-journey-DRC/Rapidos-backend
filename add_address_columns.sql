-- ============================================================
-- Migration: Ajouter les colonnes d'adresse structurée
-- Table: client_express
-- Date: 23 février 2026
-- ============================================================

-- Ajouter les 5 colonnes d'adresse
ALTER TABLE client_express 
ADD COLUMN IF NOT EXISTS pays VARCHAR(255),
ADD COLUMN IF NOT EXISTS province VARCHAR(255),
ADD COLUMN IF NOT EXISTS ville VARCHAR(255),
ADD COLUMN IF NOT EXISTS commune VARCHAR(255),
ADD COLUMN IF NOT EXISTS avenue VARCHAR(255);

-- Vérification: Afficher la structure de la table
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_express' 
ORDER BY ordinal_position;

-- Message de confirmation
SELECT 'Migration terminée avec succès!' AS message;
