#!/bin/bash

echo "👤 Création des utilisateurs de test..."
echo ""

BASE_URL="http://localhost:3333"

# 1. Créer le VENDEUR
echo "📝 1. Création du vendeur..."
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Stanislas",
    "lastName": "Makengo",
    "phone": "+243826016607",
    "email": "vendeur@test.com",
    "password": "0826016607Makengo@",
    "role": "vendeur",
    "latitude": -4.3276,
    "longitude": 15.3136
  }' | jq '{success, message, userId: .user.id, role: .user.role}'

echo ""

# 2. Créer l'ACHETEUR
echo "📝 2. Création de l'acheteur..."
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Client",
    "lastName": "Test",
    "phone": "+243828191010",
    "email": "acheteur@test.com",
    "password": "0826016607Makengo?",
    "role": "client",
    "latitude": -4.3500,
    "longitude": 15.3500
  }' | jq '{success, message, userId: .user.id, role: .user.role}'

echo ""
echo "✅ Utilisateurs créés!"
echo "   Vendeur: +243826016607 / 0826016607Makengo@"
echo "   Acheteur: +243828191010 / 0826016607Makengo?"
