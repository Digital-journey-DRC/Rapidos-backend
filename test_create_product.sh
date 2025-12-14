#!/bin/bash

echo "=== Test de création d'un produit ==="
echo ""

# 1. Connexion pour obtenir un token
echo "1. Connexion pour obtenir un token..."
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3333/login \
  -H 'Content-Type: application/json' \
  -d '{"uid":"admin2@rapidos.com","password":"password"}' | jq '.')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token.token')

if [ "$TOKEN" == "null" ]; then
  echo "❌ Impossible d'obtenir un token. Vérifiez les identifiants de connexion."
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:15}..."
echo ""

# 2. Création d'un produit avec images
echo "2. Création d'un produit avec images..."
echo "----------------------------------------"
echo "Endpoint: POST /products/store"
echo ""

# Note: Pour tester avec de vraies images, remplacez les chemins par des chemins réels
# Pour ce test, on va juste montrer la structure de la commande

echo "Exemple de commande curl pour créer un produit:"
echo ""
echo "curl -X POST http://localhost:3333/products/store \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -F 'name=Produit Test' \\"
echo "  -F 'description=Description du produit de test' \\"
echo "  -F 'price=15000' \\"
echo "  -F 'stock=20' \\"
echo "  -F 'category=Test Category' \\"
echo "  -F 'image=@/chemin/vers/image1.jpg' \\"
echo "  -F 'image1=@/chemin/vers/image2.jpg' \\"
echo "  -F 'image2=@/chemin/vers/image3.jpg' \\"
echo "  -F 'image3=@/chemin/vers/image4.jpg' \\"
echo "  -F 'image4=@/chemin/vers/image5.jpg'"
echo ""

# 3. Test avec des données minimales (sans images pour tester la structure)
echo "3. Test de création avec données minimales (sans images)..."
echo "----------------------------------------"
RESPONSE=$(curl -s -X POST http://localhost:3333/products/store \
  -H "Authorization: Bearer $TOKEN" \
  -F 'name=Produit Test Script' \
  -F 'description=Description du produit de test créé via script' \
  -F 'price=15000' \
  -F 'stock=20' \
  -F 'category=Test Category')

echo "$RESPONSE" | jq '.'
echo ""

# 4. Vérification de la création
echo "4. Vérification - Récupération de tous les produits..."
echo "----------------------------------------"
PRODUCTS_RESPONSE=$(curl -s -X GET http://localhost:3333/products/all \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$PRODUCTS_RESPONSE" | jq -r '{message: .message, productsCount: (.products | length), firstProduct: .products[0] | {id, name, price, image, imagesCount: (.images | length)}}'
echo ""

echo "=== Test terminé ==="

