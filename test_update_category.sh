#!/bin/bash

# Script de test pour la modification de catégorie

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test de modification de catégorie ===${NC}\n"

# 1. Login
echo -e "${BLUE}1. Connexion...${NC}"
TOKEN=$(curl -s -X POST http://localhost:3333/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "Admin@123456",
    "uid": "+243900000000"
  }' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Échec de la connexion${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Connexion réussie${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 2. Lister les catégories
echo -e "${BLUE}2. Liste des catégories...${NC}"
curl -s -X GET http://localhost:3333/category/get-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.categories | .[] | {id, name, description}'
echo ""

# 3. Modifier une catégorie (ID 3)
echo -e "${BLUE}3. Modification de la catégorie ID=3...${NC}"
RESPONSE=$(curl -s -X PUT http://localhost:3333/category/update/3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Vêtements",
    "description": "Vêtements et accessoires de mode"
  }')

echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.message == "Category updated successfully"' > /dev/null; then
  echo -e "\n${GREEN}✅ Catégorie modifiée avec succès!${NC}"
else
  echo -e "\n${RED}❌ Échec de la modification${NC}"
fi

echo ""

# 4. Vérifier la modification
echo -e "${BLUE}4. Vérification de la modification...${NC}"
curl -s -X GET http://localhost:3333/category/get-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" | jq '.categories | .[] | select(.id == 3)'

echo -e "\n${GREEN}=== Test terminé ===${NC}"
