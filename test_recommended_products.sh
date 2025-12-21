#!/bin/bash

echo "=== Test de l'endpoint GET /products/recommended ==="
echo ""

# 1. Test sans authentification (devrait retourner 5 produits les plus récents)
echo "1. Test sans authentification..."
echo "----------------------------------------"
echo "📦 Récupération des 5 produits les plus récents (sans auth)"
echo ""

curl -s -X GET "http://localhost:3333/products/recommended" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo ""

# 2. Test avec authentification (si possible)
echo "2. Instructions pour tester avec authentification:"
echo "----------------------------------------"
echo "   a) Se connecter pour obtenir un token:"
echo "   curl -X POST http://localhost:3333/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"uid\":\"votre_email@example.com\",\"password\":\"votre_password\"}'"
echo ""
echo "   b) Utiliser le token pour tester:"
echo "   curl -X GET http://localhost:3333/products/recommended \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer VOTRE_TOKEN' | jq '.'"
echo ""

# 3. Vérification de la structure
echo "3. Structure attendue (identique à getAllProducts):"
echo "----------------------------------------"
echo "{"
echo "  \"message\": \"Produits recommandés récupérés avec succès\","
echo "  \"products\": ["
echo "    {"
echo "      \"id\": 1,"
echo "      \"name\": \"...\","
echo "      \"description\": \"...\","
echo "      \"price\": 15000,"
echo "      \"stock\": 50,"
echo "      \"category\": { ... },"
echo "      \"image\": \"https://res.cloudinary.com/...\","
echo "      \"images\": [ ... ],"
echo "      \"vendeur\": { ... }"
echo "    }"
echo "  ],"
echo "  \"count\": 5"
echo "}"
echo ""

echo "=== Test terminé ==="

