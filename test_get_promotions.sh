#!/bin/bash

# Script de test pour GET /promotions
# Utilisation: ./test_get_promotions.sh

BASE_URL="http://localhost:3333"
PHONE="+243828191010"
PASSWORD="0826016607Makengo@"

echo "========================================="
echo "🔐 Test de GET /promotions"
echo "========================================="
echo ""

# Vérifier si le serveur est accessible
echo "1️⃣ Vérification du serveur..."
if ! curl -s -f "$BASE_URL/" > /dev/null 2>&1; then
  echo "❌ Erreur: Le serveur n'est pas accessible sur $BASE_URL"
  echo "   Assurez-vous que le serveur est démarré avec: npm run dev"
  exit 1
fi
echo "✅ Serveur accessible"
echo ""

# Étape 1: Connexion
echo "2️⃣ Connexion avec les identifiants..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\":\"$PHONE\",\"password\":\"$PASSWORD\"}")

echo "Réponse de login:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Vérifier si la connexion a réussi
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\":\"$PHONE\",\"password\":\"$PASSWORD\"}")

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Erreur de connexion (HTTP $HTTP_CODE)"
  exit 1
fi

# Extraire le token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.value // .value // .token.token.value // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible d'extraire le token de la réponse"
  echo "Structure de la réponse:"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:30}..."
echo ""

# Étape 2: Test GET /promotions
echo "3️⃣ Test de GET /promotions..."
echo ""
PROMOTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Réponse de GET /promotions:"
echo "$PROMOTIONS_RESPONSE" | jq '.' 2>/dev/null || echo "$PROMOTIONS_RESPONSE"
echo ""
echo "Code HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Succès! Endpoint GET /promotions fonctionne"
elif [ "$HTTP_CODE" = "404" ]; then
  echo "ℹ️  Aucune promotion trouvée (normal si la table est vide)"
elif [ "$HTTP_CODE" = "401" ]; then
  echo "❌ Erreur d'authentification"
else
  echo "⚠️  Code HTTP inattendu: $HTTP_CODE"
fi

echo ""
echo "========================================="




