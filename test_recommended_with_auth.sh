#!/bin/bash

BASE_URL="http://localhost:3333"

echo "=== Test de GET /products/recommended ==="
echo ""

# Test sans token (devrait retourner 401)
echo "1. Test sans authentification:"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/products/recommended" \
  -H "Content-Type: application/json" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

# Instructions pour obtenir un token
echo "2. Pour tester avec authentification, vous devez:"
echo "----------------------------------------"
echo "   a) Se connecter pour obtenir un token:"
echo "   curl -X POST ${BASE_URL}/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"uid\":\"votre_email@example.com\",\"password\":\"votre_mot_de_passe\"}'"
echo ""
echo "   b) Copier le token de la réponse"
echo ""
echo "   c) Tester l'endpoint avec le token:"
echo "   curl -X GET ${BASE_URL}/products/recommended \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer VOTRE_TOKEN' | jq '.'"
echo ""

# Si vous avez un token, testez-le ici
if [ ! -z "$1" ]; then
  echo "3. Test avec le token fourni:"
  echo "----------------------------------------"
  TOKEN="$1"
  curl -X GET "${BASE_URL}/products/recommended" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -s | jq '.' 2>/dev/null || cat
  echo ""
fi

