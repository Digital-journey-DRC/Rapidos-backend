#!/bin/bash

# Test du workflow de modification du moyen de paiement
# Serveur de production

BASE_URL="http://24.144.87.127:3333"

echo "🚀 Test de modification du moyen de paiement"
echo "=============================================="
echo ""

# Credentials
BUYER_UID="+243828191010"
BUYER_PWD="Acheteur@243"

# ============================================
# ÉTAPE 1: Login Acheteur
# ============================================
echo "1️⃣  LOGIN ACHETEUR"
echo "-------------------"
echo "UID: $BUYER_UID"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$BUYER_UID\", \"password\": \"$BUYER_PWD\"}")

echo "Réponse login:"
echo "$LOGIN_RESPONSE" | jq '.'
echo ""

BUYER_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token.token // .token')

if [ -z "$BUYER_TOKEN" ] || [ "$BUYER_TOKEN" == "null" ]; then
  echo "❌ Échec login acheteur"
  echo "Réponse complète: $LOGIN_RESPONSE"
  exit 1
fi
echo "✅ Token acheteur obtenu: ${BUYER_TOKEN:0:30}..."
echo ""

# ============================================
# ÉTAPE 2: Initialiser la commande
# ============================================
echo "2️⃣  INITIALISATION COMMANDE"
echo "----------------------------"
INIT_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{
    "products": [
      {"productId": 151, "quantite": 1}
    ],
    "latitude": -4.3276,
    "longitude": 15.3136,
    "address": {
      "pays": "RDC",
      "ville": "Kinshasa",
      "commune": "Ngaliema",
      "quartier": "Test Payment",
      "avenue": "Avenue Test",
      "numero": "1",
      "codePostale": "10001"
    }
  }')

echo "Réponse initialisation:"
echo "$INIT_RESPONSE" | jq '.'
echo ""

ORDER_ID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].id')
ORDER_UUID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].orderId')
INITIAL_STATUS=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].status')
PAYMENT_METHOD_ID=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].paymentMethod.id')
PAYMENT_METHOD_NAME=$(echo "$INIT_RESPONSE" | jq -r '.orders[0].paymentMethod.name')

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" == "null" ]; then
  echo "❌ Échec création commande"
  exit 1
fi

echo "✅ Commande créée:"
echo "   - ID: $ORDER_ID"
echo "   - UUID: $ORDER_UUID"
echo "   - Statut initial: $INITIAL_STATUS"
echo "   - Moyen de paiement: $PAYMENT_METHOD_NAME (ID: $PAYMENT_METHOD_ID)"
echo ""

# ============================================
# ÉTAPE 3: Récupérer les moyens de paiement disponibles
# ============================================
echo "3️⃣  RÉCUPÉRER LES MOYENS DE PAIEMENT"
echo "--------------------------------------"
PAYMENT_METHODS=$(curl -s -X GET "$BASE_URL/payment-methods" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "Moyens de paiement disponibles:"
echo "$PAYMENT_METHODS" | jq '.data[] | {id, name, type}'
echo ""

# Récupérer un autre moyen de paiement (différent de celui actuel)
NEW_PAYMENT_METHOD_ID=$(echo "$PAYMENT_METHODS" | jq -r ".data[] | select(.id != $PAYMENT_METHOD_ID) | .id" | head -1)
NEW_PAYMENT_METHOD_NAME=$(echo "$PAYMENT_METHODS" | jq -r ".data[] | select(.id == $NEW_PAYMENT_METHOD_ID) | .name")

if [ -z "$NEW_PAYMENT_METHOD_ID" ] || [ "$NEW_PAYMENT_METHOD_ID" == "null" ]; then
  echo "⚠️  Aucun autre moyen de paiement disponible, on garde le même"
  NEW_PAYMENT_METHOD_ID=$PAYMENT_METHOD_ID
  NEW_PAYMENT_METHOD_NAME=$PAYMENT_METHOD_NAME
fi

echo "📌 Nouveau moyen de paiement sélectionné: $NEW_PAYMENT_METHOD_NAME (ID: $NEW_PAYMENT_METHOD_ID)"
echo ""

# ============================================
# ÉTAPE 4: Modifier le moyen de paiement
# ============================================
echo "4️⃣  MODIFICATION DU MOYEN DE PAIEMENT"
echo "--------------------------------------"
PAYMENT_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/payment-method" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d "{
    \"paymentMethodId\": $NEW_PAYMENT_METHOD_ID,
    \"numeroPayment\": \"TXN$(date +%s)\"
  }")

echo "Réponse modification:"
echo "$PAYMENT_RESPONSE" | jq '.'
echo ""

NEW_STATUS=$(echo "$PAYMENT_RESPONSE" | jq -r '.order.status')
UPDATED_PAYMENT=$(echo "$PAYMENT_RESPONSE" | jq -r '.order.paymentMethod.name')
SUCCESS=$(echo "$PAYMENT_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" == "true" ]; then
  echo "✅ Modification réussie:"
  echo "   - Statut avant: $INITIAL_STATUS"
  echo "   - Statut après: $NEW_STATUS"
  echo "   - Moyen de paiement avant: $PAYMENT_METHOD_NAME"
  echo "   - Moyen de paiement après: $UPDATED_PAYMENT"
else
  echo "❌ Échec de la modification"
  echo "   Message: $(echo "$PAYMENT_RESPONSE" | jq -r '.message')"
fi
echo ""

# ============================================
# ÉTAPE 5: Vérifier la commande
# ============================================
echo "5️⃣  VÉRIFICATION DE LA COMMANDE"
echo "--------------------------------"
MY_ORDERS=$(curl -s -X GET "$BASE_URL/ecommerce/commandes/buyer/me" \
  -H "Authorization: Bearer $BUYER_TOKEN")

VERIFIED_ORDER=$(echo "$MY_ORDERS" | jq ".orders[] | select(.id == $ORDER_ID)")
VERIFIED_STATUS=$(echo "$VERIFIED_ORDER" | jq -r '.status')
VERIFIED_PAYMENT=$(echo "$VERIFIED_ORDER" | jq -r '.paymentMethod.name')
VERIFIED_NUMERO=$(echo "$VERIFIED_ORDER" | jq -r '.numeroPayment')

echo "Commande vérifiée:"
echo "$VERIFIED_ORDER" | jq '{id, orderId, status, paymentMethod: .paymentMethod.name, numeroPayment}'
echo ""

echo "✅ Statut confirmé: $VERIFIED_STATUS"
echo "✅ Moyen de paiement confirmé: $VERIFIED_PAYMENT"
echo "✅ Numéro de transaction: $VERIFIED_NUMERO"
echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo "=============================================="
echo "📊 RÉSUMÉ DU TEST"
echo "=============================================="
echo "Commande ID: $ORDER_ID"
echo "UUID: $ORDER_UUID"
echo ""
echo "Statut:"
echo "  - Initial: $INITIAL_STATUS"
echo "  - Final: $VERIFIED_STATUS"
echo ""
echo "Moyen de paiement:"
echo "  - Initial: $PAYMENT_METHOD_NAME (ID: $PAYMENT_METHOD_ID)"
echo "  - Final: $VERIFIED_PAYMENT (ID: $NEW_PAYMENT_METHOD_ID)"
echo ""
if [ "$NEW_STATUS" != "$INITIAL_STATUS" ]; then
  echo "✅ Le statut a bien changé après modification du paiement"
else
  echo "⚠️  Le statut n'a pas changé"
fi
echo "=============================================="
