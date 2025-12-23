#!/bin/bash

# Script de test complet pour la création et l'affichage de commandes
# avec moyen de paiement

BASE_URL="http://localhost:3333"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Test complet : Création et affichage"
echo "de commande avec moyen de paiement"
echo "=========================================="
echo ""

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq n'est pas installé. Installez-le avec: brew install jq${NC}"
    exit 1
fi

# Demander les tokens si non fournis
if [ -z "$TOKEN_ACHETEUR" ]; then
    echo -e "${YELLOW}⚠️  Token acheteur non fourni${NC}"
    echo "Pour obtenir un token, connectez-vous avec :"
    echo "curl -X POST ${BASE_URL}/login -H 'Content-Type: application/json' -d '{\"uid\":\"email@example.com\",\"password\":\"password\"}'"
    echo ""
    read -p "Entrez le token de l'acheteur: " TOKEN_ACHETEUR
fi

if [ -z "$TOKEN_VENDEUR" ]; then
    echo -e "${YELLOW}⚠️  Token vendeur non fourni${NC}"
    read -p "Entrez le token du vendeur: " TOKEN_VENDEUR
fi

# Demander l'ID du moyen de paiement
if [ -z "$PAYMENT_METHOD_ID" ]; then
    echo ""
    echo "Récupération des moyens de paiement du vendeur..."
    PAYMENT_METHODS=$(curl -s -X GET "${BASE_URL}/payment-methods" \
      -H "Authorization: Bearer ${TOKEN_VENDEUR}")
    
    echo "$PAYMENT_METHODS" | jq '.'
    echo ""
    read -p "Entrez l'ID du moyen de paiement à utiliser (ou laissez vide pour ne pas en utiliser): " PAYMENT_METHOD_ID
fi

# Demander les détails du produit
if [ -z "$PRODUCT_ID" ]; then
    read -p "Entrez l'ID du produit: " PRODUCT_ID
fi
if [ -z "$VENDEUR_ID" ]; then
    read -p "Entrez l'ID du vendeur: " VENDEUR_ID
fi
if [ -z "$PRODUCT_NAME" ]; then
    read -p "Entrez le nom du produit: " PRODUCT_NAME
fi
if [ -z "$PRODUCT_PRICE" ]; then
    read -p "Entrez le prix du produit: " PRODUCT_PRICE
fi
if [ -z "$QUANTITY" ]; then
    read -p "Entrez la quantité: " QUANTITY
fi

echo ""
echo "=========================================="
echo "1. CRÉATION DE LA COMMANDE"
echo "=========================================="
echo ""

# Construire le body de la requête
BODY=$(cat <<JSON
{
  "produits": [
    {
      "id": ${PRODUCT_ID},
      "nom": "${PRODUCT_NAME}",
      "prix": ${PRODUCT_PRICE},
      "quantite": ${QUANTITY},
      "idVendeur": ${VENDEUR_ID}
    }
  ],
  "ville": "Kinshasa",
  "commune": "Gombe",
  "quartier": "Centre-ville",
  "avenue": "Avenue de la République",
  "numero": "123",
  "pays": "RDC",
  "codePostale": "001"
JSON
)

# Ajouter paymentMethodId si fourni
if [ -n "$PAYMENT_METHOD_ID" ]; then
    BODY=$(echo "$BODY" | jq ". + {\"paymentMethodId\": ${PAYMENT_METHOD_ID}}")
fi

echo "Requête de création :"
echo "$BODY" | jq '.'
echo ""

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/ecommerce/commandes/store" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN_ACHETEUR}" \
  -d "$BODY")

echo "Réponse de création :"
echo "$CREATE_RESPONSE" | jq '.'
echo ""

# Vérifier si la création a réussi
if echo "$CREATE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    ORDER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.orderId')
    echo -e "${GREEN}✅ Commande créée avec succès !${NC}"
    echo "   OrderId: ${ORDER_ID}"
    
    # Vérifier le paymentMethod
    PAYMENT_METHOD=$(echo "$CREATE_RESPONSE" | jq '.paymentMethod')
    if [ "$PAYMENT_METHOD" != "null" ]; then
        PAYMENT_TYPE=$(echo "$CREATE_RESPONSE" | jq -r '.paymentMethod.type')
        echo -e "${GREEN}✅ Moyen de paiement trouvé : ${PAYMENT_TYPE}${NC}"
        echo ""
        echo "Détails du paymentMethod :"
        echo "$CREATE_RESPONSE" | jq '.paymentMethod'
    else
        echo -e "${YELLOW}⚠️  Aucun moyen de paiement dans la réponse${NC}"
    fi
else
    echo -e "${RED}❌ Erreur lors de la création de la commande${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "2. AFFICHAGE DES COMMANDES (ACHETEUR)"
echo "=========================================="
echo ""

BUYER_ORDERS=$(curl -s -X GET "${BASE_URL}/ecommerce/commandes/acheteur" \
  -H "Authorization: Bearer ${TOKEN_ACHETEUR}")

echo "Réponse :"
echo "$BUYER_ORDERS" | jq '.'
echo ""

# Vérifier le paymentMethod dans la première commande
FIRST_ORDER=$(echo "$BUYER_ORDERS" | jq '.commandes[0]')
if [ "$FIRST_ORDER" != "null" ]; then
    PAYMENT_METHOD=$(echo "$FIRST_ORDER" | jq '.paymentMethod')
    if [ "$PAYMENT_METHOD" != "null" ]; then
        PAYMENT_TYPE=$(echo "$FIRST_ORDER" | jq -r '.paymentMethod.type')
        echo -e "${GREEN}✅ Type de moyen de paiement visible : ${PAYMENT_TYPE}${NC}"
        echo ""
        echo "Détails du paymentMethod :"
        echo "$FIRST_ORDER" | jq '.paymentMethod'
    else
        echo -e "${YELLOW}⚠️  Aucun moyen de paiement dans cette commande${NC}"
    fi
fi

echo ""
echo "=========================================="
echo "3. AFFICHAGE DES COMMANDES (VENDEUR)"
echo "=========================================="
echo ""

VENDOR_ORDERS=$(curl -s -X GET "${BASE_URL}/ecommerce/commandes/vendeur" \
  -H "Authorization: Bearer ${TOKEN_VENDEUR}")

echo "Réponse :"
echo "$VENDOR_ORDERS" | jq '.'
echo ""

# Vérifier le paymentMethod dans la première commande
FIRST_VENDOR_ORDER=$(echo "$VENDOR_ORDERS" | jq '.commandes[0]')
if [ "$FIRST_VENDOR_ORDER" != "null" ]; then
    PAYMENT_METHOD=$(echo "$FIRST_VENDOR_ORDER" | jq '.paymentMethod')
    if [ "$PAYMENT_METHOD" != "null" ]; then
        PAYMENT_TYPE=$(echo "$FIRST_VENDOR_ORDER" | jq -r '.paymentMethod.type')
        echo -e "${GREEN}✅ Type de moyen de paiement visible : ${PAYMENT_TYPE}${NC}"
        echo ""
        echo "Détails du paymentMethod :"
        echo "$FIRST_VENDOR_ORDER" | jq '.paymentMethod'
    else
        echo -e "${YELLOW}⚠️  Aucun moyen de paiement dans cette commande${NC}"
    fi
fi

echo ""
echo "=========================================="
echo "RÉSUMÉ"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Test terminé avec succès !${NC}"
echo ""
