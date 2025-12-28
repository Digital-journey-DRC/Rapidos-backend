#!/bin/bash

# Test de l'endpoint initialize avec GPS et calcul des frais de livraison

echo "🔐 Connexion et récupération du token..."
TOKEN=$(curl -s -X POST http://24.144.87.127:3333/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "password123"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Échec de la connexion"
  exit 1
fi

echo "✅ Token obtenu"
echo ""
echo "📦 Test de l'endpoint /ecommerce/commandes/initialize..."
echo ""

curl -X POST http://24.144.87.127:3333/ecommerce/commandes/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "products": [
      {
        "productId": 1,
        "quantite": 2
      },
      {
        "productId": 5,
        "quantite": 1
      }
    ],
    "latitude": -4.3276,
    "longitude": 15.3136
  }' | jq '.'

echo ""
echo "✅ Test terminé"
