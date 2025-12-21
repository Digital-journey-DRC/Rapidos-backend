#!/bin/bash

echo "=== Test de l'endpoint GET /products/get-products/:productId ==="
echo ""

# 1. Connexion pour obtenir un token
echo "1. Connexion pour obtenir un token..."
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3333/login \
  -H 'Content-Type: application/json' \
  -d '{"uid":"admin2@rapidos.com","password":"password"}' | jq '.')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Impossible d'obtenir un token. Vérifiez les identifiants de connexion."
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:15}..."
echo ""

# 2. Récupérer un produit par ID
echo "2. Récupération d'un produit par ID..."
echo "----------------------------------------"
PRODUCT_ID="${1:-1}"  # Utilise l'ID fourni en argument ou 1 par défaut

echo "📦 Récupération du produit avec ID: $PRODUCT_ID"
echo ""

curl -X GET "http://localhost:3333/products/get-products/$PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo ""

# 3. Instructions pour tester avec un autre ID
echo "3. Pour tester avec un autre ID de produit:"
echo "----------------------------------------"
echo "   ./test_get_product_by_id.sh 2"
echo "   (Remplacez 2 par l'ID du produit souhaité)"
echo ""

echo "=== Test terminé ==="

