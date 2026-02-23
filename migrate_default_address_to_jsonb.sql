-- Migration pour transformer default_address de TEXT vers JSONB
-- Cette migration est safe et préserve les données existantes

-- Étape 1: Ajouter une nouvelle colonne temporaire en JSONB
ALTER TABLE client_express 
ADD COLUMN IF NOT EXISTS default_address_temp JSONB;

-- Étape 2: Migrer les données existantes
-- Si c'est du texte simple, on le met dans le champ "Avenue"
UPDATE client_express 
SET default_address_temp = 
  CASE 
    WHEN default_address IS NULL THEN NULL
    WHEN default_address::text ~ '^\{.*\}$' THEN default_address::jsonb
    ELSE jsonb_build_object('Avenue', default_address)
  END
WHERE default_address IS NOT NULL;

-- Étape 3: Supprimer l'ancienne colonne
ALTER TABLE client_express DROP COLUMN IF EXISTS default_address;

-- Étape 4: Renommer la nouvelle colonne
ALTER TABLE client_express RENAME COLUMN default_address_temp TO default_address;

-- Vérification
SELECT 
  id, 
  name, 
  phone,
  default_address,
  jsonb_typeof(default_address) as address_type
FROM client_express 
LIMIT 5;
