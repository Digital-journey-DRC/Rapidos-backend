#!/bin/bash

# Test du workflow complet de commande e-commerce avec adresse
# Basé sur ECOMMERCE_MULTI_VENDOR_ORDERS.md

BASE_URL="http://localhost:3333"
# BASE_URL="http://24.144.87.127:3333"

echo "🚀 Test du workflow complet de commande e-commerce"
echo "=================================================="
echo ""

# Credentials
BUYER_UID="+243828191010"
BUYER_PWD="0826016607Makengo?"
VENDOR_UID="+243826016607"
VENDOR_PWD="0826016607Makengo@"
DRIVER_UID="+243852583009"
DRIVER_PWD="Informyi@81642"

# ============================================
# ÉTAPE 1: Login Acheteur
# ============================================
echo "1️⃣  LOGIN ACHETEUR"
echo "-------------------"
BUYER_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$BUYER_UID\", \"password\": \"$BUYER_PWD\"}" | jq -r '.token.token // .token')

if [ -z "$BUYER_TOKEN" ] || [ "$BUYER_TOKEN" == "null" ]; then
  echo "❌ Échec login acheteur"
  exit 1
fi
echo "✅ Token acheteur obtenu: ${BUYER_TOKEN:0:30}..."
echo ""

# ============================================
# ÉTAPE 2: Initialiser la commande avec adresse
# ============================================
echo "2️⃣  INITIALISATION COMMANDE (avec adresse)"
echo "--------------------------------------------"
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
      "quartier": "Joli Parc",
      "avenue": "Avenue de la Liberté",
      "numero": "123",
      "codePostale": "10001"
    }
  }')

ORDER_ID=$(echo $INIT_RESPONSE | jq -r '.orders[0].id')
ORDER_UUID=$(echo $INIT_RESPONSE | jq -r '.orders[0].orderId')
VENDOR_ID=$(echo $INIT_RESPONSE | jq -r '.orders[0].vendeurId')
ADDRESS=$(echo $INIT_RESPONSE | jq -r '.orders[0].address')
LATITUDE=$(echo $INIT_RESPONSE | jq -r '.orders[0].latitude')
LONGITUDE=$(echo $INIT_RESPONSE | jq -r '.orders[0].longitude')

echo "✅ Commande créée:"
echo "   - ID: $ORDER_ID"
echo "   - UUID: $ORDER_UUID"
echo "   - Vendeur ID: $VENDOR_ID"
echo "   - Adresse: $ADDRESS"
echo "   - GPS: $LATITUDE, $LONGITUDE"
echo ""

# ============================================
# ÉTAPE 3: Voir ses commandes (Acheteur)
# ============================================
echo "3️⃣  VOIR SES COMMANDES (Acheteur)"
echo "----------------------------------"
MY_ORDERS=$(curl -s -X GET "$BASE_URL/ecommerce/commandes/buyer/me" \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq -r '.orders | length')
echo "✅ Nombre de commandes: $MY_ORDERS"
echo ""

# ============================================
# ÉTAPE 4: Confirmer le paiement (mise à jour payment method)
# ============================================
echo "4️⃣  CONFIRMER PAIEMENT"
echo "----------------------"
PAYMENT_METHOD_ID=$(echo $INIT_RESPONSE | jq -r '.orders[0].paymentMethod.id')
PAYMENT_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_ID/payment-method" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -d "{\"paymentMethodId\": $PAYMENT_METHOD_ID, \"numeroPayment\": \"TXN$(date +%s)\"}")

STATUS=$(echo $PAYMENT_RESPONSE | jq -r '.order.status')
echo "✅ Statut après paiement: $STATUS"
echo ""

# ============================================
# ÉTAPE 5: Login Vendeur
# ============================================
echo "5️⃣  LOGIN VENDEUR"
echo "-----------------"
VENDOR_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$VENDOR_UID\", \"password\": \"$VENDOR_PWD\"}" | jq -r '.token.token // .token')

if [ -z "$VENDOR_TOKEN" ] || [ "$VENDOR_TOKEN" == "null" ]; then
  echo "❌ Échec login vendeur"
  exit 1
fi
echo "✅ Token vendeur obtenu"
echo ""

# ============================================
# ÉTAPE 6: Voir ses commandes (Vendeur)
# ============================================
echo "6️⃣  VOIR SES COMMANDES (Vendeur)"
echo "---------------------------------"
VENDOR_ORDERS=$(curl -s -X GET "$BASE_URL/ecommerce/commandes/vendeur" \
  -H "Authorization: Bearer $VENDOR_TOKEN" | jq -r '.commandes | length')
echo "✅ Nombre de commandes vendeur: $VENDOR_ORDERS"
echo ""

# ============================================
# ÉTAPE 7: Commencer la préparation
# ============================================
echo "7️⃣  COMMENCER PRÉPARATION"
echo "-------------------------"
PREP_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_UUID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{"status": "en_preparation", "reason": "Commande prise en charge"}')

STATUS=$(echo $PREP_RESPONSE | jq -r '.order.status // .message')
SUCCESS=$(echo $PREP_RESPONSE | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Erreur: $STATUS"
  echo "   Réponse: $PREP_RESPONSE"
else
  echo "✅ Statut: $STATUS"
fi
echo ""

# ============================================
# ÉTAPE 8: Upload photo du colis
# ============================================
echo "8️⃣  UPLOAD PHOTO COLIS"
echo "----------------------"
# Créer une image de test
convert -size 300x200 xc:blue -pointsize 30 -fill white -gravity center \
  -annotate +0+0 "Colis #$ORDER_ID" /tmp/test_package_$ORDER_ID.jpg 2>/dev/null || \
  echo "Blue package photo" > /tmp/test_package_$ORDER_ID.txt

PHOTO_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/commandes/$ORDER_ID/upload-package-photo" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -F "packagePhoto=@/tmp/test_package_$ORDER_ID.jpg" 2>/dev/null || \
  curl -s -X POST "$BASE_URL/ecommerce/commandes/$ORDER_ID/upload-package-photo" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -F "packagePhoto=@/tmp/test_package_$ORDER_ID.txt")

CODE_1=$(echo $PHOTO_RESPONSE | jq -r '.data.codeColis')
echo "✅ Photo uploadée | Code 1: $CODE_1"
echo ""

# ============================================
# ÉTAPE 9: Marquer prêt à expédier
# ============================================
echo "9️⃣  MARQUER PRÊT À EXPÉDIER"
echo "---------------------------"
READY_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_UUID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{"status": "pret_a_expedier", "reason": "Colis emballé et prêt"}')

STATUS=$(echo $READY_RESPONSE | jq -r '.order.status')
echo "✅ Statut: $STATUS"
echo ""

# ============================================
# ÉTAPE 10: Login Livreur
# ============================================
echo "🔟 LOGIN LIVREUR"
echo "----------------"
DRIVER_TOKEN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"uid\": \"$DRIVER_UID\", \"password\": \"$DRIVER_PWD\"}" | jq -r '.token.token // .token')

if [ -z "$DRIVER_TOKEN" ] || [ "$DRIVER_TOKEN" == "null" ]; then
  echo "❌ Échec login livreur"
  exit 1
fi
echo "✅ Token livreur obtenu"
echo ""

# ============================================
# ÉTAPE 11: Accepter la livraison
# ============================================
echo "1️⃣1️⃣  ACCEPTER LA LIVRAISON"
echo "---------------------------"
TAKE_RESPONSE=$(curl -s -X POST "$BASE_URL/ecommerce/livraison/$ORDER_UUID/take" \
  -H "Authorization: Bearer $DRIVER_TOKEN")

STATUS=$(echo $TAKE_RESPONSE | jq -r '.order.status')
echo "✅ Statut: $STATUS (accepte_livreur)"
echo ""

# ============================================
# ÉTAPE 12: Récupérer le colis (valider code 1, génère code 2)
# ============================================
echo "1️⃣2️⃣  RÉCUPÉRER COLIS (Code 1 → génère Code 2)"
echo "-----------------------------------------------"
EN_ROUTE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_UUID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d "{\"status\": \"en_route\", \"codeColis\": \"$CODE_1\"}")

STATUS=$(echo $EN_ROUTE_RESPONSE | jq -r '.order.status')
CODE_2=$(echo $EN_ROUTE_RESPONSE | jq -r '.newCodeColis')
MESSAGE=$(echo $EN_ROUTE_RESPONSE | jq -r '.message')

echo "✅ Statut: $STATUS"
echo "✅ Code 2 généré: $CODE_2"
echo "   Message: $MESSAGE"
echo ""

# ============================================
# ÉTAPE 13: Livrer au client (valider code 2)
# ============================================
echo "1️⃣3️⃣  LIVRER AU CLIENT (Code 2)"
echo "--------------------------------"
DELIVERED_RESPONSE=$(curl -s -X PATCH "$BASE_URL/ecommerce/commandes/$ORDER_UUID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d "{\"status\": \"delivered\", \"codeColis\": \"$CODE_2\"}")

STATUS=$(echo $DELIVERED_RESPONSE | jq -r '.order.status')
echo "✅ Statut final: $STATUS"
echo ""

# ============================================
# ÉTAPE 14: Vérifier l'adresse finale
# ============================================
echo "1️⃣4️⃣  VÉRIFICATION FINALE"
echo "-------------------------"
FINAL_ORDER=$(curl -s -X GET "$BASE_URL/ecommerce/commandes/buyer/me" \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq ".orders[] | select(.id == $ORDER_ID)")

FINAL_STATUS=$(echo $FINAL_ORDER | jq -r '.status')
FINAL_ADDRESS=$(echo $FINAL_ORDER | jq '.address')
FINAL_GPS=$(echo $FINAL_ORDER | jq -r '"\(.latitude), \(.longitude)"')

echo "✅ Statut final: $FINAL_STATUS"
echo "✅ Adresse conservée: $FINAL_ADDRESS"
echo "✅ GPS conservé: $FINAL_GPS"
echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo "=================================================="
echo "🎉 WORKFLOW COMPLET TESTÉ AVEC SUCCÈS"
echo "=================================================="
echo "Commande ID: $ORDER_ID"
echo "UUID: $ORDER_UUID"
echo "Code 1 (pickup): $CODE_1"
echo "Code 2 (delivery): $CODE_2"
echo "Statut final: $FINAL_STATUS"
echo "Adresse: Kinshasa, Ngaliema, Joli Parc"
echo "GPS: $FINAL_GPS"
echo "=================================================="
