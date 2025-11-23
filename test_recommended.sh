#!/bin/bash

# Script de test pour l'endpoint GET /products/recommended

BASE_URL="http://localhost:3333"

echo "=== Test de l'endpoint GET /products/recommended ==="
echo ""

# Test 1: Sans authentification (devrait retourner 401)
echo "Test 1: Sans token d'authentification"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/products/recommended" \
  -H "Content-Type: application/json" \
  -w "\n\nStatus Code: %{http_code}\n" \
  2>/dev/null | jq '.' 2>/dev/null || cat
echo ""
echo ""

# Test 2: Avec un token invalide
echo "Test 2: Avec un token invalide"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/products/recommended" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_12345" \
  -w "\n\nStatus Code: %{http_code}\n" \
  2>/dev/null | jq '.' 2>/dev/null || cat
echo ""
echo ""

# Test 3: Essayer de se connecter pour obtenir un token valide
echo "Test 3: Tentative de connexion (nécessite des identifiants valides)"
echo "----------------------------------------"
echo "Pour tester avec un token valide, utilisez:"
echo "1. curl -X POST ${BASE_URL}/login -H 'Content-Type: application/json' -d '{\"uid\":\"email@example.com\",\"password\":\"password\"}'"
echo "2. Copiez le token de la réponse"
echo "3. Utilisez: curl -X GET ${BASE_URL}/products/recommended -H 'Authorization: Bearer VOTRE_TOKEN'"
echo ""

# Vérifier que le serveur est en ligne
echo "Vérification: Le serveur est-il en ligne?"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n" \
  2>/dev/null | jq '.' 2>/dev/null || cat
echo ""

