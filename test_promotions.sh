#!/bin/bash

BASE_URL="http://localhost:3333"

echo "=== Test de l'endpoint GET /promotions ==="
echo ""

# Étape 1: Se connecter pour obtenir un token
echo "1. Connexion pour obtenir un token..."
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -X POST "${BASE_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"uid":"admin2@rapidos.com","password":"Rapidos@1234"}' \
  -s)

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extraire le token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible d'obtenir un token"
  echo ""
  echo "Vous pouvez utiliser un token existant:"
  echo "curl -X GET ${BASE_URL}/promotions \\"
  echo "  -H 'Content-Type: application/json' \\"
  echo "  -H 'Authorization: Bearer VOTRE_TOKEN' | jq '.'"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:20}..."
echo ""

# Étape 2: Récupérer les promotions
echo "2. Récupération des produits promotionnels..."
echo "----------------------------------------"
curl -X GET "${BASE_URL}/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s | jq '.' 2>/dev/null || curl -X GET "${BASE_URL}/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s

echo ""
echo ""
echo "=== Test terminé ==="

