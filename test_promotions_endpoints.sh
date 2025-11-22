#!/bin/bash

# Script pour tester tous les endpoints de promotion
# Usage: ./test_promotions_endpoints.sh

BASE_URL="http://localhost:3333"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test des endpoints de promotion${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. Créer la table promotions (si nécessaire)
echo -e "${YELLOW}1. Création de la table promotions...${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/promotions/create-table")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo -e "\n"

# 2. Se connecter pour obtenir un token
echo -e "${YELLOW}2. Connexion pour obtenir un token...${NC}"
echo -e "${BLUE}Veuillez entrer vos identifiants:${NC}"
read -p "Email ou téléphone: " UID
read -sp "Mot de passe: " PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"${UID}\", \"password\": \"${PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.value' 2>/dev/null)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}Erreur de connexion!${NC}"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Connexion réussie!${NC}"
echo -e "${BLUE}Token: ${TOKEN:0:20}...${NC}\n"

# 3. Récupérer tous les produits en promotion
echo -e "${YELLOW}3. GET /promotions - Récupérer toutes les promotions${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/promotions" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo -e "\n"

# 4. Créer une nouvelle promotion
echo -e "${YELLOW}4. POST /promotions - Créer une nouvelle promotion${NC}"
echo -e "${BLUE}Veuillez entrer les informations de la promotion:${NC}"
read -p "Product ID: " PRODUCT_ID
read -p "Image principale (URL): " IMAGE
read -p "Image 1 (optionnel, URL): " IMAGE1
read -p "Image 2 (optionnel, URL): " IMAGE2
read -p "Image 3 (optionnel, URL): " IMAGE3
read -p "Image 4 (optionnel, URL): " IMAGE4
read -p "Libellé: " LIBELLE
read -p "Likes (défaut: 0): " LIKES
LIKES=${LIKES:-0}
read -p "Date de fin (format: YYYY-MM-DDTHH:mm:ss, ex: 2024-12-31T23:59:59): " DELAI_PROMOTION
read -p "Nouveau prix: " NOUVEAU_PRIX
read -p "Ancien prix: " ANCIEN_PRIX

# Construire le JSON
JSON_DATA="{\"productId\": ${PRODUCT_ID}, \"image\": \"${IMAGE}\", \"libelle\": \"${LIBELLE}\", \"likes\": ${LIKES}, \"delaiPromotion\": \"${DELAI_PROMOTION}\", \"nouveauPrix\": ${NOUVEAU_PRIX}, \"ancienPrix\": ${ANCIEN_PRIX}"

if [ ! -z "$IMAGE1" ]; then
  JSON_DATA="${JSON_DATA}, \"image1\": \"${IMAGE1}\""
fi
if [ ! -z "$IMAGE2" ]; then
  JSON_DATA="${JSON_DATA}, \"image2\": \"${IMAGE2}\""
fi
if [ ! -z "$IMAGE3" ]; then
  JSON_DATA="${JSON_DATA}, \"image3\": \"${IMAGE3}\""
fi
if [ ! -z "$IMAGE4" ]; then
  JSON_DATA="${JSON_DATA}, \"image4\": \"${IMAGE4}\""
fi

JSON_DATA="${JSON_DATA}}"

RESPONSE=$(curl -s -X POST "${BASE_URL}/promotions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extraire l'ID de la promotion créée
PROMOTION_ID=$(echo "$RESPONSE" | jq -r '.promotion.id' 2>/dev/null)
echo -e "\n"

if [ "$PROMOTION_ID" != "null" ] && [ ! -z "$PROMOTION_ID" ]; then
  echo -e "${GREEN}✓ Promotion créée avec l'ID: ${PROMOTION_ID}${NC}\n"
  
  # 5. Récupérer une promotion spécifique
  echo -e "${YELLOW}5. GET /promotions/${PROMOTION_ID} - Récupérer la promotion créée${NC}"
  RESPONSE=$(curl -s -X GET "${BASE_URL}/promotions/${PROMOTION_ID}" \
    -H "Authorization: Bearer ${TOKEN}")
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo -e "\n"
  
  # 6. Mettre à jour la promotion
  echo -e "${YELLOW}6. PUT /promotions/${PROMOTION_ID} - Mettre à jour la promotion${NC}"
  read -p "Voulez-vous mettre à jour la promotion? (o/n): " UPDATE_CHOICE
  
  if [ "$UPDATE_CHOICE" == "o" ] || [ "$UPDATE_CHOICE" == "O" ]; then
    read -p "Nouveau libellé (laisser vide pour ne pas changer): " NEW_LIBELLE
    read -p "Nouveau prix (laisser vide pour ne pas changer): " NEW_NOUVEAU_PRIX
    
    UPDATE_JSON="{}"
    if [ ! -z "$NEW_LIBELLE" ]; then
      UPDATE_JSON="{\"libelle\": \"${NEW_LIBELLE}\"}"
    fi
    if [ ! -z "$NEW_NOUVEAU_PRIX" ]; then
      if [ "$UPDATE_JSON" == "{}" ]; then
        UPDATE_JSON="{\"nouveauPrix\": ${NEW_NOUVEAU_PRIX}}"
      else
        UPDATE_JSON=$(echo "$UPDATE_JSON" | jq ". + {\"nouveauPrix\": ${NEW_NOUVEAU_PRIX}}")
      fi
    fi
    
    RESPONSE=$(curl -s -X PUT "${BASE_URL}/promotions/${PROMOTION_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$UPDATE_JSON")
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo -e "\n"
  fi
  
  # 7. Supprimer la promotion
  echo -e "${YELLOW}7. DELETE /promotions/${PROMOTION_ID} - Supprimer la promotion${NC}"
  read -p "Voulez-vous supprimer la promotion? (o/n): " DELETE_CHOICE
  
  if [ "$DELETE_CHOICE" == "o" ] || [ "$DELETE_CHOICE" == "O" ]; then
    RESPONSE=$(curl -s -X DELETE "${BASE_URL}/promotions/${PROMOTION_ID}" \
      -H "Authorization: Bearer ${TOKEN}")
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo -e "\n"
  fi
else
  echo -e "${RED}✗ Erreur lors de la création de la promotion${NC}\n"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Tests terminés!${NC}"
echo -e "${GREEN}========================================${NC}"

