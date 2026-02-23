-- Script pour ajouter la colonne vendor_id à commande_express
ALTER TABLE commande_express 
ADD COLUMN IF NOT EXISTS vendor_id INTEGER NOT NULL DEFAULT 1;

-- Créer l'index pour vendor_id
CREATE INDEX IF NOT EXISTS idx_commande_express_vendor_id ON commande_express(vendor_id);

-- Mise à jour: Retirer le DEFAULT après ajout de la colonne (pour forcer la fourniture du vendorId)
ALTER TABLE commande_express 
ALTER COLUMN vendor_id DROP DEFAULT;
