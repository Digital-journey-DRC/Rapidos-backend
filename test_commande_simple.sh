#!/bin/bash

# Script de test simple - Remplacez les valeurs ci-dessous

BASE_URL="http://localhost:3333"
TOKEN_ACHETEUR="VOTRE_TOKEN_ACHETEUR"
TOKEN_VENDEUR="VOTRE_TOKEN_VENDEUR"
PAYMENT_METHOD_ID=1
PRODUCT_ID=1
VENDEUR_ID=1
PRODUCT_NAME="Produit Test"
PRODUCT_PRICE=5000
QUANTITY=2

echo "=========================================="
echo "Test création et affichage de commande"
echo "=========================================="
echo ""

# 1. Créer la commande
echo "1. Création de la commande..."
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/ecommerce/commandes/store" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN_ACHETEUR}" \
  -d "{
    \"produits\": [{
      \"id\": ${PRODUCT_ID},
      \"nom\": \"${PRODUCT_NAME}\",
      \"prix\": ${PRODUCT_PRICE},
      \"quantite\": ${QUANTITY},
      \"idVendeur\": ${VENDEUR_ID}
    }],
    \"ville\": \"Kinshasa\",
    \"commune\": \"Gombe\",
    \"quartier\": \"Centre-ville\",
    \"avenue\": \"Avenue de la République\",
    \"numero\": \"123\",
    \"pays\": \"RDC\",
    \"codePostale\": \"001\",
    \"paymentMethodId\": ${PAYMENT_METHOD_ID}
  }")

echo "$CREATE_RESPONSE" | jq '.'
ORDER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.orderId // empty')

if [ -z "$ORDER_ID" ]; then
  echo "❌ Erreur lors de la création"
  exit 1
fi

echo ""
echo "✅ Commande créée : $ORDER_ID"
echo ""

# Vérifier le paymentMethod dans la réponse
PAYMENT_TYPE=$(echo "$CREATE_RESPONSE" | jq -r '.paymentMethod.type // "null"')
if [ "$PAYMENT_TYPE" != "null" ]; then
  echo "✅ Type de moyen de paiement dans création : $PAYMENT_TYPE"
  echo "$CREATE_RESPONSE" | jq '.paymentMethod'
else
  echo "⚠️  Pas de moyen de paiement dans la réponse"
fi

echo ""
echo "---"
echo ""

# 2. Récupérer les commandes de l'acheteur
echo "2. Récupération des commandes de l'acheteur..."
BUYER_ORDERS=$(curl -s -X GET "${BASE_URL}/ecommerce/commandes/acheteur" \
  -H "Authorization: Bearer ${TOKEN_ACHETEUR}")

echo "$BUYER_ORDERS" | jq '.commandes[0].paymentMethod // "null"'

PAYMENT_TYPE=$(echo "$BUYER_ORDERS" | jq -r '.commandes[0].paymentMethod.type // "null"')
if [ "$PAYMENT_TYPE" != "null" ]; then
  echo "✅ Type visible dans GET acheteur : $PAYMENT_TYPE"
else
  echo "⚠️  Pas de type dans GET acheteur"
fi

echo ""
echo "---"
echo ""

# 3. Récupérer les commandes du vendeur
echo "3. Récupération des commandes du vendeur..."
VENDOR_ORDERS=$(curl -s -X GET "${BASE_URL}/ecommerce/commandes/vendeur" \
  -H "Authorization: Bearer ${TOKEN_VENDEUR}")

echo "$VENDOR_ORDERS" | jq '.commandes[0].paymentMethod // "null"'

PAYMENT_TYPE=$(echo "$VENDOR_ORDERS" | jq -r '.commandes[0].paymentMethod.type // "null"')
if [ "$PAYMENT_TYPE" != "null" ]; then
  echo "✅ Type visible dans GET vendeur : $PAYMENT_TYPE"
else
  echo "⚠️  Pas de type dans GET vendeur"
fi

echo ""
echo "✅ Test terminé !"
