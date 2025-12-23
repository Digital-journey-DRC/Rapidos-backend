#!/bin/bash

# Script de test simple pour les endpoints de moyens de paiement
# IMPORTANT: Assurez-vous que le serveur est démarré (npm run dev ou node ace serve)

BASE_URL="http://localhost:3333"

echo "=========================================="
echo "Test des endpoints de moyens de paiement"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Le serveur doit être démarré avant de lancer ce script"
echo ""

# 1. Créer la table (une seule fois)
echo "1. Création de la table payment_methods..."
RESPONSE=$(curl -s -X GET "${BASE_URL}/payment-methods/create-table")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""
echo "---"
echo ""

# Si vous avez un token, décommentez les lignes suivantes et remplacez TOKEN
# TOKEN="VOTRE_TOKEN_ICI"
# 
# # 2. Ajouter un moyen de paiement
# echo "2. Ajout d'un moyen de paiement (Orange Money)..."
# curl -X POST "${BASE_URL}/payment-methods" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer ${TOKEN}" \
#   -d '{
#     "type": "orange_money",
#     "numeroCompte": "0651234567",
#     "nomTitulaire": "Jean Dupont",
#     "isDefault": true
#   }' | jq '.'
# echo ""
# echo "---"
# echo ""
# 
# # 3. Récupérer tous les moyens de paiement
# echo "3. Récupération de tous les moyens de paiement..."
# curl -X GET "${BASE_URL}/payment-methods" \
#   -H "Authorization: Bearer ${TOKEN}" | jq '.'
# echo ""

echo "✅ Test de création de table terminé !"
echo ""
echo "Pour tester les autres endpoints, vous devez :"
echo "1. Vous connecter en tant que vendeur pour obtenir un token"
echo "2. Utiliser ce token dans les requêtes avec l'header: Authorization: Bearer TOKEN"

