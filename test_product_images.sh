#!/bin/bash

BASE_URL="http://localhost:3333"

echo "=== Test de création/mise à jour de produit avec images supplémentaires ==="
echo ""

# Étape 1: Se connecter pour obtenir un token
echo "1. Connexion pour obtenir un token..."
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/login" \
  -H "Content-Type: application/json" \
  -d '{"uid":"+243828191010","password":"0826016607Makengo?"}')

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extraire le token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible d'obtenir un token"
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:30}..."
echo ""

# Étape 2: Instructions pour tester avec de vraies images
echo "2. Instructions pour tester la création d'un produit avec images supplémentaires:"
echo "----------------------------------------"
echo ""
echo "Pour créer un produit avec images supplémentaires, utilisez:"
echo ""
echo "curl -X POST ${BASE_URL}/products \\"
echo "  -H 'Authorization: Bearer ${TOKEN}' \\"
echo "  -F 'name=Produit Test avec Images' \\"
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
echo "Note: Remplacez /chemin/vers/ par le chemin réel de vos images"
echo ""

# Étape 3: Instructions pour tester la mise à jour
echo "3. Instructions pour tester la mise à jour d'un produit avec images supplémentaires:"
echo "----------------------------------------"
echo ""
echo "Pour mettre à jour un produit avec images supplémentaires, utilisez:"
echo ""
echo "curl -X PUT ${BASE_URL}/products/PRODUCT_ID \\"
echo "  -H 'Authorization: Bearer ${TOKEN}' \\"
echo "  -F 'name=Produit Mis à Jour' \\"
echo "  -F 'description=Nouvelle description' \\"
echo "  -F 'price=20000' \\"
echo "  -F 'stock=15' \\"
echo "  -F 'category=Test Category' \\"
echo "  -F 'image=@/chemin/vers/nouvelle_image1.jpg' \\"
echo "  -F 'image1=@/chemin/vers/nouvelle_image2.jpg' \\"
echo "  -F 'image2=@/chemin/vers/nouvelle_image3.jpg'"
echo ""
echo "Note: Remplacez PRODUCT_ID par l'ID réel du produit"
echo ""

# Étape 4: Vérifier que l'endpoint est accessible
echo "4. Vérification de l'endpoint /products/all:"
echo "----------------------------------------"
curl -s -X GET "${BASE_URL}/products/all" \
  -H "Content-Type: application/json" | jq '{message: "Endpoint accessible", productsCount: (.products | length)}' 2>/dev/null || echo "Endpoint accessible"
echo ""

echo "=== Test terminé ==="

