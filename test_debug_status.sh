#!/bin/bash

echo "=== Test manuel détaillé ==="

# Login buyer
echo "1. Login acheteur..."
BUYER_TOKEN=$(curl -s -X POST "http://localhost:3333/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243828191010", "password": "0826016607Makengo?"}' | jq -r '.token.token // .token')
echo "   Token: ${BUYER_TOKEN:0:30}..."

# Create order
echo "2. Créer commande..."
ORDER=$(curl -s -X POST "http://localhost:3333/ecommerce/commandes/initialize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d '{"products":[{"productId":151,"quantite":1}],"latitude":-4.3276,"longitude":15.3136,"address":{"pays":"RDC","ville":"Kinshasa","commune":"Ngaliema","quartier":"Joli Parc","avenue":"Avenue de la Liberté","numero":"123","codePostale":"10001"}}')

ORDER_ID=$(echo $ORDER | jq -r '.orders[0].id')
ORDER_UUID=$(echo $ORDER | jq -r '.orders[0].orderId')
VENDOR_ID=$(echo $ORDER | jq -r '.orders[0].vendeurId')
echo "   ID: $ORDER_ID, UUID: $ORDER_UUID, VendorID: $VENDOR_ID"

# Confirm payment
echo "3. Confirmer paiement..."
PAYMENT_METHOD_ID=$(echo $ORDER | jq -r '.orders[0].paymentMethod.id')
STATUS=$(curl -s -X PATCH "http://localhost:3333/ecommerce/commandes/$ORDER_ID/payment-method" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d "{\"paymentMethodId\": $PAYMENT_METHOD_ID, \"numeroPayment\": \"TXN123\"}" | jq -r '.order.status')
echo "   Statut: $STATUS"

# Login vendor
echo "4. Login vendeur..."
VENDOR_RESPONSE=$(curl -s -X POST "http://localhost:3333/login" \
  -H "Content-Type: application/json" \
  -d '{"uid": "+243826016607", "password": "0826016607Makengo@"}')

VENDOR_TOKEN=$(echo $VENDOR_RESPONSE | jq -r '.token.token // .token')
VENDOR_ROLE=$(echo $VENDOR_RESPONSE | jq -r '.user.role')
VENDOR_USER_ID=$(echo $VENDOR_RESPONSE | jq -r '.user.id')
echo "   Role: $VENDOR_ROLE, ID: $VENDOR_USER_ID"

# Check if vendor matches
if [ "$VENDOR_USER_ID" == "$VENDOR_ID" ]; then
  echo "   ✅ Vendeur correspond"
else
  echo "   ❌ Vendeur ne correspond pas: $VENDOR_USER_ID != $VENDOR_ID"
fi

# Try to update status
echo "5. Changer statut vers en_preparation..."
PREP_RESPONSE=$(curl -s -X PATCH "http://localhost:3333/ecommerce/commandes/$ORDER_UUID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{"status": "en_preparation"}')

echo "$PREP_RESPONSE" | jq
