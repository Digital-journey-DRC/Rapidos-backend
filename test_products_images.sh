#!/bin/bash

echo "=================================================================================="
echo "TEST DES ENDPOINTS DE PRODUITS - VÉRIFICATION DES IMAGES CLOUDINARY"
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

# 2. Test GET /products/all
echo "2. Test GET /products/all (tous les produits)"
echo "----------------------------------------"
ALL_PRODUCTS=$(curl -s -X GET http://localhost:3333/products/all \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$ALL_PRODUCTS" | jq -r '{
  message: .message,
  productsCount: (.products | length),
  firstProduct: .products[0] | {
    id,
    name,
    price,
    hasImage: (.image != null),
    image: .image,
    imagesCount: (.images | length),
    images: .images
  }
}'
echo ""

# 3. Test GET /products/get-products/:id (si des produits existent)
echo "3. Test GET /products/get-products/:id (produit spécifique)"
echo "----------------------------------------"
FIRST_PRODUCT_ID=$(echo "$ALL_PRODUCTS" | jq -r '.products[0].id // empty')

if [ -n "$FIRST_PRODUCT_ID" ] && [ "$FIRST_PRODUCT_ID" != "null" ]; then
  PRODUCT_BY_ID=$(curl -s -X GET "http://localhost:3333/products/get-products/$FIRST_PRODUCT_ID" \
    -H "Content-Type: application/json")
  
  echo "$PRODUCT_BY_ID" | jq -r '{
    message: "Produit récupéré",
    product: .product | {
      id,
      name,
      price,
      hasImage: (.image != null),
      image: .image,
      imagesCount: (.images | length),
      images: .images
    }
  }'
else
  echo "⚠️  Aucun produit trouvé pour tester getProductById"
fi
echo ""

# 4. Test GET /products/boutique/:userId (produits d'un vendeur)
echo "4. Test GET /products/boutique/:userId (produits d'un vendeur)"
echo "----------------------------------------"
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id // empty')

if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
  PRODUCTS_BY_USER=$(curl -s -X GET "http://localhost:3333/products/boutique/$USER_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  echo "$PRODUCTS_BY_USER" | jq -r '{
    message: "Produits du vendeur",
    productsCount: (.product | length),
    firstProduct: (.product[0] // {}) | {
      id,
      name,
      price,
      hasImage: (.image != null),
      image: .image,
      imagesCount: (.images | length),
      images: .images
    }
  }'
else
  echo "⚠️  Impossible de récupérer l'ID utilisateur"
fi
echo ""

# 5. Test GET /products/category/:categoryId (si des catégories existent)
echo "5. Test GET /products/category/:categoryId (produits par catégorie)"
echo "----------------------------------------"
FIRST_CATEGORY_ID=$(echo "$ALL_PRODUCTS" | jq -r '.products[0].category.id // empty')

if [ -n "$FIRST_CATEGORY_ID" ] && [ "$FIRST_CATEGORY_ID" != "null" ]; then
  PRODUCTS_BY_CATEGORY=$(curl -s -X GET "http://localhost:3333/products/category/$FIRST_CATEGORY_ID" \
    -H "Content-Type: application/json")
  
  echo "$PRODUCTS_BY_CATEGORY" | jq -r '{
    message: "Produits par catégorie",
    productsCount: (.products | length),
    firstProduct: (.products[0] // {}) | {
      id,
      name,
      price,
      hasImage: (.image != null),
      image: .image,
      imagesCount: (.images | length),
      images: .images
    }
  }'
else
  echo "⚠️  Aucune catégorie trouvée pour tester getProductByCategory"
fi
echo ""

# 6. Résumé
echo "=================================================================================="
echo "RÉSUMÉ DES TESTS"
echo "=================================================================================="
echo ""
echo "✅ Structure attendue pour chaque produit:"
echo "   - image: URL Cloudinary de l'image principale (ou null)"
echo "   - images: Tableau des URLs Cloudinary des images supplémentaires"
echo ""
echo "✅ Tous les endpoints doivent retourner cette structure:"
echo "   - GET /products/all"
echo "   - GET /products/get-products/:id"
echo "   - GET /products/boutique/:userId"
echo "   - GET /products/category/:categoryId"
echo ""

echo "=================================================================================="
echo "TEST TERMINÉ"
echo "=================================================================================="

