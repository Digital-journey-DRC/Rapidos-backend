#!/bin/bash

echo "========================================="
echo "🧪 TEST COMPLET GET /promotions"
echo "========================================="
echo ""

BASE_URL="http://localhost:3333"
PHONE="+243828191010"
PASSWORD="0826016607Makengo?"

# Vérifier si le serveur est accessible
echo "1️⃣ Vérification du serveur..."
if ! curl -s -f "$BASE_URL/" > /dev/null 2>&1; then
  echo "❌ Erreur: Le serveur n'est pas accessible sur $BASE_URL"
  echo "   Démarrez le serveur avec: npm run dev"
  exit 1
fi
echo "✅ Serveur accessible"
echo ""

# Étape 1: Connexion
echo "2️⃣ Connexion pour obtenir le token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\":\"$PHONE\",\"password\":\"$PASSWORD\"}")

echo "Réponse:"
echo "$LOGIN_RESPONSE" | jq -r '.message // .error // "Réponse reçue"' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extraire le token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.token // .token.value // .value // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
  echo "❌ Erreur: Impossible d'extraire le token"
  echo "Structure de la réponse:"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:40}..."
echo ""

# Étape 2: Créer la table
echo "3️⃣ Création de la table promotions..."
TABLE_RESPONSE=$(curl -s -X GET "$BASE_URL/create-promotions-table" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/create-promotions-table" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$TABLE_RESPONSE" | jq '.' 2>/dev/null || echo "$TABLE_RESPONSE"
echo ""
echo "Code HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Table créée avec succès!"
elif [ "$HTTP_CODE" = "404" ]; then
  echo "⚠️  Route non trouvée - Le serveur doit être redémarré"
else
  echo "⚠️  Code HTTP: $HTTP_CODE"
fi
echo ""

# Étape 3: Tester GET /promotions
echo "4️⃣ Test GET /promotions..."
PROMOTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE_PROMO=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Réponse:"
echo "$PROMOTIONS_RESPONSE" | jq '.' 2>/dev/null || echo "$PROMOTIONS_RESPONSE"
echo ""
echo "Code HTTP: $HTTP_CODE_PROMO"
echo ""

if [ "$HTTP_CODE_PROMO" = "200" ]; then
  echo "✅ GET /promotions fonctionne!"
elif [ "$HTTP_CODE_PROMO" = "404" ]; then
  echo "ℹ️  Aucune promotion trouvée (normal si la table est vide)"
elif [ "$HTTP_CODE_PROMO" = "500" ]; then
  ERROR_MSG=$(echo "$PROMOTIONS_RESPONSE" | jq -r '.error // .message' 2>/dev/null)
  if [[ "$ERROR_MSG" == *"does not exist"* ]]; then
    echo "⚠️  La table promotions n'existe pas encore"
    echo "   Exécutez d'abord: curl -X GET $BASE_URL/create-promotions-table"
  else
    echo "⚠️  Erreur serveur: $ERROR_MSG"
  fi
else
  echo "⚠️  Code HTTP inattendu: $HTTP_CODE_PROMO"
fi

echo ""
echo "========================================="





