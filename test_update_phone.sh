#!/bin/bash

echo "=== Test de mise à jour du numéro de téléphone ==="
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

# 2. Demander le changement de numéro de téléphone
echo "2. Demander le changement de numéro de téléphone..."
echo "----------------------------------------"
echo "Endpoint: POST /users/update-phone"
echo "Body: { \"newPhone\": \"+243999999999\" }"
echo ""
UPDATE_RESPONSE=$(curl -s -X POST http://localhost:3333/users/update-phone \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"newPhone":"+243999999999"}' | jq '.')

echo "$UPDATE_RESPONSE"
echo ""

# 3. Instructions pour vérifier l'OTP
echo "3. Instructions pour vérifier l'OTP:"
echo "----------------------------------------"
echo "Endpoint: POST /users/verify-phone-otp"
echo "Body: { \"otp\": \"CODE_OTP\", \"newPhone\": \"+243999999999\" }"
echo ""
echo "Exemple:"
echo "curl -X POST http://localhost:3333/users/verify-phone-otp \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -d '{\"otp\":\"123456\",\"newPhone\":\"+243999999999\"}'"
echo ""

echo "=== Test terminé ==="

