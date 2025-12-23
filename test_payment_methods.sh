#!/bin/bash

# Script de test pour les endpoints de moyens de paiement
# Remplacez TOKEN par votre token d'authentification de vendeur

BASE_URL="http://localhost:3333"
TOKEN="VOTRE_TOKEN_ICI"

echo "=========================================="
echo "Test des endpoints de moyens de paiement"
echo "=========================================="
echo ""

# 1. Créer la table (une seule fois)
echo "1. Création de la table payment_methods..."
curl -X GET "${BASE_URL}/payment-methods/create-table" | jq '.'
echo ""
echo "---"
echo ""

# 2. Ajouter un moyen de paiement
echo "2. Ajout d'un moyen de paiement (Orange Money)..."
curl -X POST "${BASE_URL}/payment-methods" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "type": "orange_money",
    "numeroCompte": "0651234567",
    "nomTitulaire": "Jean Dupont",
    "isDefault": true
  }' | jq '.'
echo ""
echo "---"
echo ""

# 3. Ajouter un autre moyen de paiement
echo "3. Ajout d'un deuxième moyen de paiement (Master Card)..."
curl -X POST "${BASE_URL}/payment-methods" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "type": "master_card",
    "numeroCompte": "1234567890123456",
    "nomTitulaire": "Jean Dupont",
    "isDefault": false
  }' | jq '.'
echo ""
echo "---"
echo ""

# 4. Récupérer tous les moyens de paiement (vendeur connecté)
echo "4. Récupération de tous les moyens de paiement du vendeur connecté..."
curl -X GET "${BASE_URL}/payment-methods" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo "---"
echo ""

# 4b. Récupérer les moyens de paiement actifs d'un vendeur (pour acheteur)
echo "4b. Récupération des moyens de paiement actifs d'un vendeur (pour acheteur)..."
VENDEUR_ID=1  # Remplacez par l'ID d'un vendeur réel
curl -X GET "${BASE_URL}/payment-methods/vendeur/${VENDEUR_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo "---"
echo ""

# 5. Modifier un moyen de paiement (remplacez PAYMENT_METHOD_ID par l'ID réel)
echo "5. Modification d'un moyen de paiement..."
PAYMENT_METHOD_ID=1
curl -X PUT "${BASE_URL}/payment-methods/${PAYMENT_METHOD_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "numeroCompte": "0651234568",
    "isDefault": true
  }' | jq '.'
echo ""
echo "---"
echo ""

# 6. Désactiver un moyen de paiement (remplacez PAYMENT_METHOD_ID par l'ID réel)
echo "6. Désactivation d'un moyen de paiement..."
PAYMENT_METHOD_ID=2
curl -X PATCH "${BASE_URL}/payment-methods/${PAYMENT_METHOD_ID}/deactivate" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo "---"
echo ""

# 7. Activer un moyen de paiement (remplacez PAYMENT_METHOD_ID par l'ID réel)
echo "7. Activation d'un moyen de paiement..."
PAYMENT_METHOD_ID=2
curl -X PATCH "${BASE_URL}/payment-methods/${PAYMENT_METHOD_ID}/activate" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo "---"
echo ""

# 8. Supprimer un moyen de paiement (remplacez PAYMENT_METHOD_ID par l'ID réel)
echo "8. Suppression d'un moyen de paiement..."
PAYMENT_METHOD_ID=2
curl -X DELETE "${BASE_URL}/payment-methods/${PAYMENT_METHOD_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.'
echo ""
echo "---"
echo ""

echo "Tests terminés !"

