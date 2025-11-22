#!/bin/bash

echo "========================================="
echo "🛍️  CRÉATION D'UNE PROMOTION DE TEST"
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

echo "✅ Token obtenu: ${TOKEN:0:50}..."
echo ""

# 2. Rechercher un produit existant
echo "2️⃣  Recherche d'un produit existant..."
PRODUCTS=$(curl -s -X GET "$BASE_URL/products/adm/all" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

PRODUCT_ID=$(echo "$PRODUCTS" | jq -r '.products[0].id // empty' 2>/dev/null)

if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ] || [ "$PRODUCT_ID" = "" ]; then
  echo "⚠️  Aucun produit trouvé. Création d'un produit de test..."
  
  # Créer un produit
  PRODUCT_DATA='{
    "name": "Produit Test Promotion",
    "description": "Produit créé pour tester les promotions",
    "price": 50000,
    "stock": 100,
    "category": "ELECTRONIQUE"
  }'
  
  PRODUCT_CREATE=$(curl -s -X POST "$BASE_URL/products/store" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$PRODUCT_DATA")
  
  PRODUCT_ID=$(echo "$PRODUCT_CREATE" | jq -r '.product.id // empty' 2>/dev/null)
  
  if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
    echo "❌ Impossible de créer un produit. Vérifiez les logs."
    exit 1
  fi
  
  echo "✅ Produit créé! ID: $PRODUCT_ID"
else
  PRODUCT_NAME=$(echo "$PRODUCTS" | jq -r '.products[0].name // empty' 2>/dev/null)
  echo "✅ Produit trouvé: $PRODUCT_NAME (ID: $PRODUCT_ID)"
fi

echo ""

# 3. Créer la promotion
echo "3️⃣  Création de la promotion..."

# Calculer la date de fin (30 jours à partir de maintenant)
DELAI=$(date -u -v+30d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || \
        date -u -d "+30 days" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || \
        date -u +"%Y-%m-%dT%H:%M:%S.000Z")

PROMO_DATA=$(cat <<EOF
{
  "productId": $PRODUCT_ID,
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

echo "Données de la promotion:"
echo "$PROMO_DATA" | jq '.'
echo ""

PROMO_CREATE=$(curl -s -X POST "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PROMO_DATA")

echo "Réponse de création:"
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
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Promotion créée et récupérée avec succès!"
  echo ""
  echo "📋 Liste des promotions:"
  echo "$PROMOTIONS" | jq '.promotions | length' 2>/dev/null
  echo ""
  echo "Première promotion:"
  echo "$PROMOTIONS" | jq '.promotions[0] | {
    id,
    productId,
    libelle,
    nouveauPrix,
    ancienPrix,
    image,
    image1,
    image2,
    image3,
    image4,
    likes,
    delaiPromotion,
    product: {name: .product.name, price: .product.price}
  }' 2>/dev/null || echo "$PROMOTIONS"
elif [ "$HTTP_CODE" = "404" ]; then
  echo "ℹ️  Aucune promotion trouvée"
else
  echo "⚠️  Code HTTP: $HTTP_CODE"
  echo "$PROMOTIONS" | jq '.' 2>/dev/null || echo "$PROMOTIONS"
fi

echo ""
echo "========================================="


