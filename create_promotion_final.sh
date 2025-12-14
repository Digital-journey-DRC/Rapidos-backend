#!/bin/bash

echo "========================================="
echo "🛍️  CRÉATION D'UNE PROMOTION"
echo "========================================="
echo ""

BASE_URL="http://localhost:3333"

# 1. Connexion
echo "1️⃣  Connexion..."
LOGIN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"uid":"admin2@rapidos.com","password":"Rapidos@1234"}')

TOKEN=$(echo "$LOGIN" | jq -r '.token.token // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] || [ "$TOKEN" = "" ]; then
  echo "❌ Erreur: Impossible d'obtenir le token"
  exit 1
fi

echo "✅ Token obtenu"
echo ""

# 2. Recréer la table
echo "2️⃣  Recréation de la table promotions..."
TABLE_RESULT=$(curl -s -X GET "$BASE_URL/create-promotions-table" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$TABLE_RESULT" | jq '.' 2>/dev/null || echo "$TABLE_RESULT"
echo ""

# 3. Créer la promotion
echo "3️⃣  Création de la promotion..."

DELAI=$(date -u -v+30d +"%Y-%m-%d" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%d" 2>/dev/null || echo "2025-12-31")

PROMO_DATA=$(cat <<EOF
{
  "productId": 152,
  "image": "https://res.cloudinary.com/dnn2ght5x/image/upload/v1234567890/promotions/main.jpg",
  "image1": "https://res.cloudinary.com/dnn2ght5x/image/upload/v1234567890/promotions/img1.jpg",
  "image2": "https://res.cloudinary.com/dnn2ght5x/image/upload/v1234567890/promotions/img2.jpg",
  "image3": "https://res.cloudinary.com/dnn2ght5x/image/upload/v1234567890/promotions/img3.jpg",
  "image4": "https://res.cloudinary.com/dnn2ght5x/image/upload/v1234567890/promotions/img4.jpg",
  "libelle": "🎉 Promotion spéciale -30% sur ce produit!",
  "likes": 0,
  "delaiPromotion": "$DELAI",
  "nouveauPrix": 35000,
  "ancienPrix": 50000
}
EOF
)

PROMO_CREATE=$(curl -s -X POST "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PROMO_DATA")

echo "$PROMO_CREATE" | jq '.' 2>/dev/null || echo "$PROMO_CREATE"
echo ""

# 4. Vérifier avec GET /promotions
echo "4️⃣  Vérification avec GET /promotions..."
PROMOTIONS=$(curl -s -X GET "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Code HTTP: $HTTP_CODE"
echo "$PROMOTIONS" | jq '.' 2>/dev/null || echo "$PROMOTIONS"

echo ""
echo "========================================="





