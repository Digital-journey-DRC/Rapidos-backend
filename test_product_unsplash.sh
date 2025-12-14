#!/bin/bash

echo "=================================================================================="
echo "TEST DE CRÉATION D'UN PRODUIT AVEC URL UNSPLASH"
echo "=================================================================================="
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

echo "✅ Token obtenu: ${TOKEN:0:20}..."
echo ""

# 2. Création d'un produit avec URL Unsplash
echo "2. Création d'un produit avec URL Unsplash..."
echo "----------------------------------------"
echo "Endpoint: POST /products/store"
echo "URL Unsplash: https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"
echo ""

PRODUCT_RESPONSE=$(curl -s -X POST http://localhost:3333/products/store \
  -H "Authorization: Bearer $TOKEN" \
  -F 'name=Produit Test Unsplash' \
  -F 'description=Produit de test avec image Unsplash uploadée sur Cloudinary' \
  -F 'price=25000' \
  -F 'stock=15' \
  -F 'category=Test Category' \
  -F 'image=https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop' \
  -F 'image1=https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop')

echo "Réponse de création:"
echo "$PRODUCT_RESPONSE" | jq '.'
echo ""

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.product.id')

if [ "$PRODUCT_ID" == "null" ] || [ -z "$PRODUCT_ID" ]; then
  echo "❌ Erreur lors de la création du produit"
  exit 1
fi

echo "✅ Produit créé avec ID: $PRODUCT_ID"
echo ""

# 3. Vérification - Récupération du produit par ID
echo "3. Vérification - Récupération du produit par ID..."
echo "----------------------------------------"
echo "Endpoint: GET /products/get-products/$PRODUCT_ID"
echo ""

PRODUCT_DETAILS=$(curl -s -X GET "http://localhost:3333/products/get-products/$PRODUCT_ID" \
  -H "Content-Type: application/json" | jq '.')

echo "Détails du produit:"
echo "$PRODUCT_DETAILS" | jq -r '{
  id: .product.id,
  name: .product.name,
  price: .product.price,
  stock: .product.stock,
  image: .product.image,
  imagesCount: (.product.images | length),
  images: .product.images
}'
echo ""

# Vérifier que l'image est une URL Cloudinary
IMAGE_URL=$(echo $PRODUCT_DETAILS | jq -r '.product.image')
if [[ "$IMAGE_URL" == *"cloudinary.com"* ]]; then
  echo "✅ Image principale: URL Cloudinary détectée"
  echo "   $IMAGE_URL"
else
  echo "⚠️  Image principale: URL non-Cloudinary détectée"
  echo "   $IMAGE_URL"
fi
echo ""

# 4. Vérification - Récupération de tous les produits
echo "4. Vérification - Récupération de tous les produits..."
echo "----------------------------------------"
echo "Endpoint: GET /products/all"
echo ""

ALL_PRODUCTS=$(curl -s -X GET http://localhost:3333/products/all \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.')

echo "Résumé des produits:"
echo "$ALL_PRODUCTS" | jq -r '{
  message: .message,
  productsCount: (.products | length),
  firstProduct: .products[0] | {
    id,
    name,
    price,
    hasImage: (.image != null),
    imageUrl: .image,
    imagesCount: (.images | length)
  }
}'
echo ""

echo "=================================================================================="
echo "TEST TERMINÉ"
echo "=================================================================================="

