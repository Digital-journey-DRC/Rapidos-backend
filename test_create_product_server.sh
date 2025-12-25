#!/bin/bash

SERVER_URL="http://24.144.87.127:3333"

echo "=================================================================================="
echo "TEST DE CRÉATION DE PRODUIT AVEC IMAGE SUR SERVEUR EN LIGNE"
echo "Serveur: $SERVER_URL"
echo "=================================================================================="
echo ""

# 1. Obtenir un token
echo "1. CONNEXION POUR OBTENIR UN TOKEN:"
echo "----------------------------------------"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

TOKEN=$(curl -s -X POST $SERVER_URL/login \
  -H "Content-Type: application/json" \
  -d "{\"uid\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.token.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erreur de connexion. Vérifiez vos identifiants."
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:20}..."
echo ""

# 2. Créer un produit avec URL d'image
echo "2. CRÉATION D'UN PRODUIT AVEC IMAGE URL:"
echo "----------------------------------------"
RESPONSE=$(curl -s -X POST $SERVER_URL/products/store \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Produit Image Cloudinary",
    "description": "Test upload image depuis URL vers Cloudinary",
    "price": 1500,
    "stock": 20,
    "category": "TEST",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
  }')

echo "$RESPONSE" | jq .

echo ""
echo "=================================================================================="
echo "VÉRIFICATION:"
echo "=================================================================================="
echo ""
echo "Si l'image a été uploadée sur Cloudinary, vous verrez:"
echo "- mediaUrl avec une URL Cloudinary (https://res.cloudinary.com/...)"
echo "- Pas d'erreurs dans la réponse"
echo ""
echo "Si l'upload a échoué, vous verrez:"
echo "- Des erreurs dans le champ 'errors'"
echo "- Ou un message d'erreur Cloudinary"
echo ""

