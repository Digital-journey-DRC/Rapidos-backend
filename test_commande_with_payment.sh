#!/bin/bash

# Script de test pour la création et l'affichage de commandes avec moyen de paiement
# Remplacez les valeurs ci-dessous par vos vraies données

BASE_URL="http://localhost:3333"
TOKEN_ACHETEUR="VOTRE_TOKEN_ACHETEUR_ICI"  # Token d'un utilisateur avec rôle "acheteur"
TOKEN_VENDEUR="VOTRE_TOKEN_VENDEUR_ICI"     # Token d'un utilisateur avec rôle "vendeur"
PAYMENT_METHOD_ID=1                         # ID d'un moyen de paiement existant

echo "=========================================="
echo "Test création et affichage de commande"
echo "avec moyen de paiement"
echo "=========================================="
echo ""

# 1. Créer une commande avec moyen de paiement
echo "1. Création d'une commande avec moyen de paiement..."
echo "   PaymentMethodId: ${PAYMENT_METHOD_ID}"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/ecommerce/commandes/store" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN_ACHETEUR}" \
  -d '{
    "produits": [
      {
        "id": 1,
        "nom": "Produit Test",
        "prix": 5000,
        "quantite": 2,
        "idVendeur": 1
      }
    ],
    "ville": "Kinshasa",
    "commune": "Gombe",
    "quartier": "Centre-ville",
    "avenue": "Avenue de la République",
    "numero": "123",
    "pays": "RDC",
    "codePostale": "001",
    "paymentMethodId": '${PAYMENT_METHOD_ID}'
  }')

echo "Réponse de création :"
echo "${CREATE_RESPONSE}" | jq '.'
echo ""

# Extraire l'orderId de la réponse
ORDER_ID=$(echo "${CREATE_RESPONSE}" | jq -r '.orderId // empty')

if [ -z "$ORDER_ID" ]; then
  echo "❌ Erreur : Impossible de récupérer l'orderId"
  echo "Vérifiez que la commande a été créée avec succès"
  exit 1
fi

echo "✅ Commande créée avec succès !"
echo "   OrderId: ${ORDER_ID}"
echo ""
echo "---"
echo ""

# 2. Vérifier le paymentMethod dans la réponse de création
echo "2. Vérification du paymentMethod dans la réponse de création..."
PAYMENT_METHOD_TYPE=$(echo "${CREATE_RESPONSE}" | jq -r '.paymentMethod.type // "null"')

if [ "$PAYMENT_METHOD_TYPE" != "null" ] && [ -n "$PAYMENT_METHOD_TYPE" ]; then
  echo "✅ Type de moyen de paiement trouvé : ${PAYMENT_METHOD_TYPE}"
  echo ""
  echo "Détails du paymentMethod :"
  echo "${CREATE_RESPONSE}" | jq '.paymentMethod'
else
  echo "⚠️  Aucun type de moyen de paiement trouvé dans la réponse"
fi
echo ""
echo "---"
echo ""

# 3. Récupérer les commandes de l'acheteur
echo "3. Récupération des commandes de l'acheteur..."
BUYER_ORDERS=$(curl -s -X GET "${BASE_URL}/ecommerce/commandes/acheteur" \
  -H "Authorization: Bearer ${TOKEN_ACHETEUR}")

echo "Réponse :"
echo "${BUYER_ORDERS}" | jq '.'
echo ""

# Vérifier le paymentMethod dans les commandes de l'acheteur
FIRST_ORDER_PAYMENT_TYPE=$(echo "${BUYER_ORDERS}" | jq -r '.commandes[0].paymentMethod.type // "null"')

if [ "$FIRST_ORDER_PAYMENT_TYPE" != "null" ] && [ -n "$FIRST_ORDER_PAYMENT_TYPE" ]; then
  echo "✅ Type de moyen de paiement visible dans les commandes de l'acheteur : ${FIRST_ORDER_PAYMENT_TYPE}"
  echo ""
  echo "Détails du paymentMethod de la première commande :"
  echo "${BUYER_ORDERS}" | jq '.commandes[0].paymentMethod'
else
  echo "⚠️  Aucun type de moyen de paiement trouvé dans les commandes de l'acheteur"
fi
echo ""
echo "---"
echo ""

# 4. Récupérer les commandes du vendeur
echo "4. Récupération des commandes du vendeur..."
VENDOR_ORDERS=$(curl -s -X GET "${BASE_URL}/ecommerce/commandes/vendeur" \
  -H "Authorization: Bearer ${TOKEN_VENDEUR}")

echo "Réponse :"
echo "${VENDOR_ORDERS}" | jq '.'
echo ""

# Vérifier le paymentMethod dans les commandes du vendeur
FIRST_VENDOR_ORDER_PAYMENT_TYPE=$(echo "${VENDOR_ORDERS}" | jq -r '.commandes[0].paymentMethod.type // "null"')

if [ "$FIRST_VENDOR_ORDER_PAYMENT_TYPE" != "null" ] && [ -n "$FIRST_VENDOR_ORDER_PAYMENT_TYPE" ]; then
  echo "✅ Type de moyen de paiement visible dans les commandes du vendeur : ${FIRST_VENDOR_ORDER_PAYMENT_TYPE}"
  echo ""
  echo "Détails du paymentMethod de la première commande :"
  echo "${VENDOR_ORDERS}" | jq '.commandes[0].paymentMethod'
else
  echo "⚠️  Aucun type de moyen de paiement trouvé dans les commandes du vendeur"
fi
echo ""
echo "---"
echo ""

# 5. Résumé
echo "=========================================="
echo "RÉSUMÉ DU TEST"
echo "=========================================="
echo ""
echo "✅ Commande créée : ${ORDER_ID}"
echo "✅ PaymentMethod dans création : $([ "$PAYMENT_METHOD_TYPE" != "null" ] && echo "OUI (${PAYMENT_METHOD_TYPE})" || echo "NON")"
echo "✅ PaymentMethod dans GET acheteur : $([ "$FIRST_ORDER_PAYMENT_TYPE" != "null" ] && echo "OUI (${FIRST_ORDER_PAYMENT_TYPE})" || echo "NON")"
echo "✅ PaymentMethod dans GET vendeur : $([ "$FIRST_VENDOR_ORDER_PAYMENT_TYPE" != "null" ] && echo "OUI (${FIRST_VENDOR_ORDER_PAYMENT_TYPE})" || echo "NON")"
echo ""
echo "Test terminé !"

