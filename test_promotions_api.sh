#!/bin/bash

# Script pour tester l'endpoint GET /promotions
# Utilisation: ./test_promotions_api.sh

BASE_URL="http://localhost:3333"
PHONE="+243828191010"
PASSWORD="0826016607Makengo@"

echo "🔐 Connexion à l'API..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\":\"$PHONE\",\"password\":\"$PASSWORD\"}")

echo "Réponse de login:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extraire le token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"value":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  # Essayer avec une structure différente
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  # Essayer avec token.value
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.value // .value // empty' 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Erreur: Impossible de récupérer le token d'authentification"
  echo "Vérifiez que le serveur est démarré et que les identifiants sont corrects"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:20}..."
echo ""
echo "📦 Test de GET /promotions..."
echo ""

PROMOTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Réponse de GET /promotions:"
echo "$PROMOTIONS_RESPONSE" | jq '.' 2>/dev/null || echo "$PROMOTIONS_RESPONSE"
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Code HTTP: $HTTP_CODE"

