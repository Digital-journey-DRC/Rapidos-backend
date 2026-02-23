-- Vérifier la structure complète de la table client_express
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_express' 
ORDER BY ordinal_position;

-- Vérifier les données du dernier client créé
SELECT * FROM client_express WHERE id = 4;
